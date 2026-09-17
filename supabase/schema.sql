-- ==============================================================================
-- SCHEMA SISTEM PENENTUAN PIKET KAMAR GURU (UJIAN MURAJA'AH AKHIR TAHUN)
-- PostgreSQL / Supabase Schema Definition
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM & Types
DO $$ BEGIN
    CREATE TYPE form_status_type AS ENUM ('OPEN', 'CLOSED', 'MAINTENANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status_type AS ENUM ('SUCCESS', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE import_batch_status_type AS ENUM ('PREVIEW', 'IMPORTED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Table: event_settings
CREATE TABLE IF NOT EXISTS event_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL DEFAULT 'Ujian Muraja''ah Akhir Tahun',
    event_subtitle TEXT NOT NULL DEFAULT 'Penentuan Piket Kamar Guru',
    committee_name TEXT NOT NULL DEFAULT 'Panitia Ujian Muraja''ah Akhir Tahun',
    academic_year TEXT NOT NULL DEFAULT '1447–1448 H',
    form_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (form_status IN ('OPEN', 'CLOSED', 'MAINTENANCE')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by TEXT
);

-- 4. Table: kamar
CREATE TABLE IF NOT EXISTS kamar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kamar TEXT NOT NULL UNIQUE,
    limit_piket INTEGER NOT NULL DEFAULT 1 CHECK (limit_piket >= 0),
    aktif BOOLEAN NOT NULL DEFAULT true,
    urutan INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Table: import_batches
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    invalid_rows INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PREVIEW' CHECK (status IN ('PREVIEW', 'IMPORTED', 'FAILED', 'CANCELLED')),
    imported_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Table: guru
CREATE TABLE IF NOT EXISTS guru (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rnk INTEGER,
    nama TEXT NOT NULL,
    kamar_id UUID NOT NULL REFERENCES kamar(id) ON DELETE RESTRICT,
    tahun TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT true,
    source_import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Table: piket_submissions
CREATE TABLE IF NOT EXISTS piket_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kamar_id UUID NOT NULL REFERENCES kamar(id) ON DELETE RESTRICT,
    submitted_by TEXT NOT NULL DEFAULT 'Public User',
    submitted_at TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'REJECTED', 'CANCELLED')),
    client_request_id UUID UNIQUE NOT NULL,
    notes TEXT
);

-- 8. Table: piket_submission_members
CREATE TABLE IF NOT EXISTS piket_submission_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES piket_submissions(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_submission_guru UNIQUE (submission_id, guru_id)
);

-- 9. Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    ip_hash TEXT
);

-- 10. Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_guru_kamar_id ON guru(kamar_id);
CREATE INDEX IF NOT EXISTS idx_guru_nama ON guru(nama);
CREATE INDEX IF NOT EXISTS idx_piket_submissions_kamar_id ON piket_submissions(kamar_id);
CREATE INDEX IF NOT EXISTS idx_piket_submissions_status ON piket_submissions(status);
CREATE INDEX IF NOT EXISTS idx_piket_submission_members_guru ON piket_submission_members(guru_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 11. View for Kamar Monitoring (Status, Limit, Piket, Anggota)
CREATE OR REPLACE VIEW v_kamar_overview AS
SELECT 
    k.id,
    k.nama_kamar,
    k.limit_piket,
    k.aktif,
    k.urutan,
    k.updated_at,
    COUNT(DISTINCT g.id) AS total_guru,
    COUNT(DISTINCT psm.guru_id) AS total_piket_terpilih,
    CASE 
        WHEN NOT k.aktif THEN 'Nonaktif'
        WHEN COUNT(DISTINCT psm.guru_id) >= k.limit_piket AND k.limit_piket > 0 THEN 'Terpenuhi'
        WHEN COUNT(DISTINCT psm.guru_id) > 0 THEN 'Sebagian'
        ELSE 'Belum ditetapkan'
    END AS status_penetapan
FROM kamar k
LEFT JOIN guru g ON g.kamar_id = k.id AND g.aktif = true
LEFT JOIN piket_submissions ps ON ps.kamar_id = k.id AND ps.status = 'SUCCESS'
LEFT JOIN piket_submission_members psm ON psm.submission_id = ps.id
GROUP BY k.id, k.nama_kamar, k.limit_piket, k.aktif, k.urutan, k.updated_at;

-- 12. RPC FUNCTION: submit_piket (Atomic Concurrency Control & Validation)
CREATE OR REPLACE FUNCTION submit_piket(
    p_kamar_id UUID,
    p_guru_ids UUID[],
    p_client_request_id UUID,
    p_submitted_by TEXT DEFAULT 'Public User',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_form_status TEXT;
    v_kamar_aktif BOOLEAN;
    v_limit_piket INT;
    v_nama_kamar TEXT;
    v_active_piket_count INT;
    v_selected_count INT;
    v_existing_submission_id UUID;
    v_new_submission_id UUID;
    v_invalid_guru_count INT;
    v_already_piket_count INT;
    v_already_piket_guru_names TEXT;
    v_guru_id UUID;
BEGIN
    -- Step 1: Check Idempotency Key (Return existing submission if already processed)
    SELECT id INTO v_existing_submission_id 
    FROM piket_submissions 
    WHERE client_request_id = p_client_request_id AND status = 'SUCCESS';

    IF v_existing_submission_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'submission_id', v_existing_submission_id,
            'message', 'Penetapan telah tersimpan sebelumnya.'
        );
    END IF;

    -- Step 2: Validate Global Form Status
    SELECT form_status INTO v_form_status FROM event_settings LIMIT 1;
    IF v_form_status IS NULL THEN
        v_form_status := 'OPEN';
    END IF;

    IF v_form_status = 'CLOSED' THEN
        RAISE EXCEPTION 'FORM_CLOSED: Form penentuan piket saat ini telah ditutup oleh panitia.';
    ELSIF v_form_status = 'MAINTENANCE' THEN
        RAISE EXCEPTION 'FORM_MAINTENANCE: Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.';
    END IF;

    -- Step 3: Validate Selected Guru Count
    v_selected_count := COALESCE(array_length(p_guru_ids, 1), 0);
    IF v_selected_count = 0 THEN
        RAISE EXCEPTION 'NO_GURU_SELECTED: Anda belum memilih guru untuk penetapan piket.';
    END IF;

    -- Step 4: Lock Kamar Row (Concurrency protection via SELECT FOR UPDATE)
    SELECT limit_piket, aktif, nama_kamar 
    INTO v_limit_piket, v_kamar_aktif, v_nama_kamar
    FROM kamar 
    WHERE id = p_kamar_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'KAMAR_NOT_FOUND: Kamar tidak ditemukan.';
    END IF;

    IF NOT v_kamar_aktif THEN
        RAISE EXCEPTION 'KAMAR_INACTIVE: Kamar ini berstatus nonaktif.';
    END IF;

    -- Step 5: Validate that all selected gurus belong to this kamar and are active
    SELECT COUNT(*) INTO v_invalid_guru_count
    FROM unnest(p_guru_ids) AS sel_id
    LEFT JOIN guru g ON g.id = sel_id AND g.kamar_id = p_kamar_id AND g.aktif = true
    WHERE g.id IS NULL;

    IF v_invalid_guru_count > 0 THEN
        RAISE EXCEPTION 'INVALID_GURU_SELECTION: Satu atau lebih guru yang dipilih tidak terdaftar di kamar % atau tidak aktif.', v_nama_kamar;
    END IF;

    -- Step 6: Count current active piket for this kamar
    SELECT COUNT(DISTINCT psm.guru_id) INTO v_active_piket_count
    FROM piket_submissions ps
    JOIN piket_submission_members psm ON psm.submission_id = ps.id
    WHERE ps.kamar_id = p_kamar_id AND ps.status = 'SUCCESS';

    -- Step 7: Check limit piket constraint
    IF (v_active_piket_count + v_selected_count) > v_limit_piket THEN
        RAISE EXCEPTION 'LIMIT_EXCEEDED: Penetapan tidak dapat disimpan karena kamar % memiliki batas limit % piket (saat ini aktif: %, dipilih: %).', 
            v_nama_kamar, v_limit_piket, v_active_piket_count, v_selected_count;
    END IF;

    -- Step 8: Validate that none of the selected gurus are already piket in ANY active submission
    SELECT string_agg(g.nama, ', ') INTO v_already_piket_guru_names
    FROM unnest(p_guru_ids) AS sel_id
    JOIN piket_submission_members psm ON psm.guru_id = sel_id
    JOIN piket_submissions ps ON ps.id = psm.submission_id AND ps.status = 'SUCCESS'
    JOIN guru g ON g.id = sel_id;

    IF v_already_piket_guru_names IS NOT NULL THEN
        RAISE EXCEPTION 'GURU_ALREADY_ASSIGNED: Guru (%s) sudah ditetapkan sebagai piket aktif.', v_already_piket_guru_names;
    END IF;

    -- Step 9: Insert piket submission
    INSERT INTO piket_submissions (
        kamar_id,
        submitted_by,
        submitted_at,
        status,
        client_request_id,
        notes
    ) VALUES (
        p_kamar_id,
        p_submitted_by,
        now(),
        'SUCCESS',
        p_client_request_id,
        p_notes
    ) RETURNING id INTO v_new_submission_id;

    -- Step 10: Insert piket submission members
    FOREACH v_guru_id IN ARRAY p_guru_ids
    LOOP
        INSERT INTO piket_submission_members (submission_id, guru_id, created_at)
        VALUES (v_new_submission_id, v_guru_id, now());
    END LOOP;

    -- Step 11: Record Audit Log
    INSERT INTO audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        new_data,
        created_at
    ) VALUES (
        p_submitted_by,
        'SUBMIT_PIKET',
        'kamar',
        p_kamar_id::TEXT,
        jsonb_build_object(
            'submission_id', v_new_submission_id,
            'kamar_nama', v_nama_kamar,
            'guru_count', v_selected_count,
            'guru_ids', p_guru_ids
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'submission_id', v_new_submission_id,
        'message', format('Penetapan %s guru untuk kamar %s berhasil disimpan.', v_selected_count, v_nama_kamar)
    );
END;
$$;

-- 13. RPC FUNCTION: reset_kamar_piket (Admin Reset)
CREATE OR REPLACE FUNCTION reset_kamar_piket(
    p_kamar_id UUID,
    p_actor_id TEXT DEFAULT 'Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_nama_kamar TEXT;
    v_cancelled_count INT;
BEGIN
    SELECT nama_kamar INTO v_nama_kamar FROM kamar WHERE id = p_kamar_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'KAMAR_NOT_FOUND: Kamar tidak ditemukan.';
    END IF;

    -- Update active submissions to CANCELLED
    WITH updated AS (
        UPDATE piket_submissions
        SET status = 'CANCELLED'
        WHERE kamar_id = p_kamar_id AND status = 'SUCCESS'
        RETURNING id
    )
    SELECT count(*) INTO v_cancelled_count FROM updated;

    -- Record Audit Log
    INSERT INTO audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        p_actor_id,
        'RESET_PIKET',
        'kamar',
        p_kamar_id::TEXT,
        jsonb_build_object('cancelled_submissions_count', v_cancelled_count),
        jsonb_build_object('status', 'RESET_SUCCESS'),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'kamar_nama', v_nama_kamar,
        'cancelled_count', v_cancelled_count,
        'message', format('Seluruh penetapan piket kamar %s berhasil direset.', v_nama_kamar)
    );
END;
$$;

-- 14. Row Level Security (RLS) Setup
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kamar ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE piket_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE piket_submission_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public Policies: Read settings, active kamar, active guru, active submissions
CREATE POLICY "Public read event_settings" ON event_settings FOR SELECT USING (true);
CREATE POLICY "Public read active kamar" ON kamar FOR SELECT USING (aktif = true);
CREATE POLICY "Public read active guru" ON guru FOR SELECT USING (aktif = true);
CREATE POLICY "Public read active piket_submissions" ON piket_submissions FOR SELECT USING (status = 'SUCCESS');
CREATE POLICY "Public read piket_submission_members" ON piket_submission_members FOR SELECT USING (true);

-- Admin / Authenticated Policies: Full Access
CREATE POLICY "Admin full access event_settings" ON event_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access kamar" ON kamar FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access guru" ON guru FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access import_batches" ON import_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access piket_submissions" ON piket_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access piket_submission_members" ON piket_submission_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access audit_logs" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

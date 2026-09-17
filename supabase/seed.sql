-- ==============================================================================
-- SEED DATA SISTEM PENENTUAN PIKET KAMAR GURU (UJIAN MURAJA'AH AKHIR TAHUN)
-- ==============================================================================

-- 1. Default Event Settings
INSERT INTO event_settings (
    event_name,
    event_subtitle,
    committee_name,
    academic_year,
    form_status
) VALUES (
    'Ujian Muraja''ah Akhir Tahun',
    'Penentuan Piket Kamar Guru',
    'Panitia Ujian Muraja''ah Akhir Tahun',
    '1447–1448 H',
    'OPEN'
) ON CONFLICT DO NOTHING;

-- 2. Initial Master Kamar
INSERT INTO kamar (nama_kamar, limit_piket, aktif, urutan) VALUES
('Gontor', 2, true, 1),
('Gandy', 1, true, 2),
('Perdos Saudi', 2, true, 3),
('Perdos UNIDA Siman', 3, true, 4),
('Wisma Darussalam', 2, true, 5),
('Aligarh', 1, true, 6),
('Syam', 2, true, 7),
('Makkah', 2, true, 8),
('Madinah', 2, true, 9),
('Kulliyatu-l-Banat', 3, true, 10),
('Santiniketan', 1, true, 11),
('Al-Azhar', 2, true, 12),
('Qordova', 2, true, 13)
ON CONFLICT (nama_kamar) DO NOTHING;

-- 3. Initial Sample Guru
DO $$
DECLARE
    v_kamar_gontor UUID;
    v_kamar_gandy UUID;
    v_kamar_saudi UUID;
    v_kamar_unida UUID;
BEGIN
    SELECT id INTO v_kamar_gontor FROM kamar WHERE nama_kamar = 'Gontor';
    SELECT id INTO v_kamar_gandy FROM kamar WHERE nama_kamar = 'Gandy';
    SELECT id INTO v_kamar_saudi FROM kamar WHERE nama_kamar = 'Perdos Saudi';
    SELECT id INTO v_kamar_unida FROM kamar WHERE nama_kamar = 'Perdos UNIDA Siman';

    IF v_kamar_gontor IS NOT NULL THEN
        INSERT INTO guru (rnk, nama, kamar_id, tahun, aktif) VALUES
        (1, 'K.H. Hasan Abdullah Sahal', v_kamar_gontor, '1447-1448', true),
        (2, 'Drs. K.H. M. Akrim Mariyat, Dipl.A.Ed.', v_kamar_gontor, '1447-1448', true),
        (3, 'Prof. Dr. K.H. Amal Fathullah Zarkasyi, M.A.', v_kamar_gontor, '1447-1448', true),
        (4, 'H. Imam Shobari, S.Ag.', v_kamar_gontor, '1447-1448', true),
        (5, 'H. M. Syuja''i, S.Ag.', v_kamar_gontor, '1447-1448', true),
        (6, 'Ust. H. Nur Hadi, M.Pd.I.', v_kamar_gontor, '1447-1448', true),
        (7, 'Ust. H. Riza Ashari, M.Pd.I.', v_kamar_gontor, '1447-1448', true),
        (8, 'Ust. H. Ahmad Saefullah, M.Pd.I.', v_kamar_gontor, '1447-1448', true);
    END IF;

    IF v_kamar_gandy IS NOT NULL THEN
        INSERT INTO guru (rnk, nama, kamar_id, tahun, aktif) VALUES
        (9, 'Ust. Dr. H. Setiawan Bin Lahuri, M.A.', v_kamar_gandy, '1447-1448', true),
        (10, 'Ust. H. Fairuz Subakir Ahmad, M.A.', v_kamar_gandy, '1447-1448', true),
        (11, 'Ust. H. Mohammad Adnan Haris, M.Pd.I.', v_kamar_gandy, '1447-1448', true),
        (12, 'Ust. H. Daniar, M.A.', v_kamar_gandy, '1447-1448', true);
    END IF;

    IF v_kamar_saudi IS NOT NULL THEN
        INSERT INTO guru (rnk, nama, kamar_id, tahun, aktif) VALUES
        (13, 'Ust. H. Suwarno, M.Pd.I.', v_kamar_saudi, '1447-1448', true),
        (14, 'Ust. H. M. Taufiq Affandi, M.Sc.', v_kamar_saudi, '1447-1448', true),
        (15, 'Ust. H. Hasib Amrullah, M.A.', v_kamar_saudi, '1447-1448', true);
    END IF;

    IF v_kamar_unida IS NOT NULL THEN
        INSERT INTO guru (rnk, nama, kamar_id, tahun, aktif) VALUES
        (16, 'Ust. Dr. H. Abdul Hafidz Zaid, M.A.', v_kamar_unida, '1447-1448', true),
        (17, 'Ust. Dr. H. Khoirul Umam, M.Ec.', v_kamar_unida, '1447-1448', true),
        (18, 'Ust. Dr. Cecep Sobar Rochmat, M.Pd.I.', v_kamar_unida, '1447-1448', true),
        (19, 'Ust. Dr. H. Jarman Arroisi, M.A.', v_kamar_unida, '1447-1448', true);
    END IF;
END $$;

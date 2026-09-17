export type FormStatus = 'OPEN' | 'CLOSED' | 'MAINTENANCE';
export type SubmissionStatus = 'SUCCESS' | 'REJECTED' | 'CANCELLED';
export type ImportBatchStatus = 'PREVIEW' | 'IMPORTED' | 'FAILED' | 'CANCELLED';
export type KamarStatus = 'Belum ditetapkan' | 'Sebagian' | 'Terpenuhi' | 'Non-Piket' | 'Form ditutup' | 'Nonaktif';

export interface EventSettings {
  id: string;
  event_name: string;
  event_subtitle: string;
  committee_name: string;
  academic_year: string;
  form_status: FormStatus;
  whatsapp_number?: string | null;
  whatsapp_label?: string | null;
  waktu_buka?: string | null;
  waktu_tutup?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface Kamar {
  id: string;
  nama_kamar: string;
  limit_piket: number;
  ada_piket: boolean;
  aktif: boolean;
  urutan: number;
  created_at?: string;
  updated_at?: string;
}

export interface Guru {
  id: string;
  rnk?: number | null;
  nama: string;
  kamar_id: string;
  tahun: string;
  aktif: boolean;
  source_import_batch_id?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined relation:
  kamar?: Kamar;
  is_piket_active?: boolean;
}

export interface KamarOverview {
  id: string;
  nama_kamar: string;
  limit_piket: number;
  ada_piket: boolean;
  aktif: boolean;
  urutan: number;
  updated_at?: string;
  total_guru: number;
  total_piket_terpilih: number;
  status_penetapan: KamarStatus;
  has_revisions: boolean;
  revision_count: number;
  initial_submitted_at?: string | null;
  initial_guru_names?: string[];
  latest_submitted_at?: string | null;
  latest_guru_names?: string[];
}

export interface PiketSubmission {
  id: string;
  kamar_id: string;
  submitted_by: string;
  submitted_at: string;
  status: SubmissionStatus;
  client_request_id: string;
  notes?: string | null;
  version?: number;
  is_revision?: boolean;
  replaced_submission_id?: string | null;
  // Joined relations:
  kamar?: Kamar;
  members?: PiketSubmissionMember[];
}

export interface PiketSubmissionMember {
  id: string;
  submission_id: string;
  guru_id: string;
  created_at: string;
  guru?: Guru;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  created_at: string;
  ip_hash?: string | null;
}

export interface ImportBatch {
  id: string;
  file_name: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  status: ImportBatchStatus;
  imported_by?: string | null;
  created_at: string;
}

export interface RawExcelRow {
  RNK?: number | string | null;
  Nama?: string | null;
  Kamar?: string | null;
  Tahun?: string | null;
  Limit_Kamar?: number | string | null;
  Ada_Piket?: boolean | string | number | null;
  [key: string]: any;
}

export interface ValidatedImportRow {
  rowNumber: number;
  rnk: number | null;
  nama: string;
  nama_kamar: string;
  tahun: string;
  limit_kamar?: number;
  ada_piket?: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportValidationResult {
  fileName: string;
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  rows: ValidatedImportRow[];
  uniqueKamarNames: string[];
}

export interface SubmitPiketPayload {
  kamar_id: string;
  guru_ids: string[];
  client_request_id: string;
  submitted_by?: string;
  notes?: string;
  is_edit?: boolean;
}

export interface SubmitPiketResult {
  success: boolean;
  idempotent?: boolean;
  submission_id?: string;
  is_revision?: boolean;
  message: string;
}

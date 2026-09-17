# PRD.md
# Sistem Penentuan Piket Kamar Guru — Ujian Muraja'ah Akhir Tahun

## 1. Ringkasan Produk

Aplikasi web internal untuk Panitia Ujian Muraja'ah Akhir Tahun yang digunakan untuk:

1. Menampilkan daftar kamar guru.
2. Membuka detail anggota pada setiap kamar.
3. Menentukan guru yang ditetapkan sebagai piket pada kamar tersebut.
4. Membatasi jumlah piket berdasarkan `limit_piket` yang ditentukan panitia.
5. Mencatat setiap pengajuan/penetapan piket sebagai histori.
6. Mencegah race condition ketika dua admin/pengguna melakukan submit hampir bersamaan.
7. Menyediakan panel admin terpisah dari halaman form publik.
8. Mengimpor master data dari Excel dengan template tetap.
9. Mengatur nama kegiatan, nama panitia, tahun, status form, dan konfigurasi lain tanpa mengubah source code.
10. Menyediakan monitoring, audit log, dan export data.

Aplikasi bukan sekadar CRUD. Database harus menjadi sumber kebenaran dan seluruh aturan bisnis penting harus divalidasi di server/database.

---

# 2. Tujuan

## 2.1 Tujuan Utama

Membuat proses penentuan piket kamar guru menjadi:

- cepat;
- terstruktur;
- aman terhadap submit bersamaan;
- mudah dimonitor panitia;
- mudah diperbarui ketika master data berubah;
- tidak bergantung pada edit spreadsheet secara manual.

## 2.2 Tujuan Teknis

- PostgreSQL sebagai source of truth.
- Supabase Auth untuk autentikasi admin.
- Row Level Security untuk keamanan data.
- Transaction + row-level locking/database function untuk concurrency control.
- Import Excel yang mengikuti template `Kamar Guru`.
- Audit trail untuk setiap perubahan penting.
- UI responsive desktop/mobile.
- Tidak menggunakan desain generik ala AI dashboard.

---

# 3. Non-Goals

Versi pertama tidak mencakup:

- sistem absensi kehadiran ujian;
- penjadwalan otomatis berdasarkan algoritma;
- payroll;
- chat;
- sistem akademik umum;
- aplikasi mobile native;
- AI penentuan piket.

AI tidak diperlukan untuk core workflow karena aturan piket harus deterministik dan dapat diaudit.

---

# 4. Target Pengguna

## 4.1 Pengguna Form

Panitia/petugas yang bertugas menentukan piket kamar.

Hak:

- melihat kamar;
- melihat anggota kamar;
- memilih guru;
- melakukan submit;
- melihat status kamar yang sedang dikerjakan.

## 4.2 Admin

Panitia dengan akses administrator.

Hak:

- seluruh akses pengguna;
- mengelola setup;
- mengatur limit kamar;
- import Excel;
- mengelola master kamar;
- mengelola master guru;
- melihat histori;
- melihat audit log;
- export data;
- mengubah status form;
- mengubah password akun admin melalui Supabase Auth.

---

# 5. Arsitektur

```text
User / Admin Browser
        |
        v
     Next.js
        |
        v
     Supabase
   /     |      \
Auth  PostgreSQL  Storage
             |
             +-- event_settings
             +-- kamar
             +-- guru
             +-- piket_submissions
             +-- piket_submission_members
             +-- audit_logs
             +-- import_batches
```

Deployment:

- Frontend: Vercel
- Backend/database/auth: Supabase
- Source control: Git
- Framework: Next.js + TypeScript
- Styling: Tailwind CSS
- Validation: Zod
- Excel parsing: SheetJS/XLSX atau library setara
- Icons: gunakan seperlunya dan hanya icon UI yang benar-benar memiliki fungsi; jangan menggunakan emoji sebagai elemen UI.

---

# 6. Struktur Data

## 6.1 event_settings

Menyimpan konfigurasi global.

Field:

- `id`
- `event_name`
- `event_subtitle`
- `committee_name`
- `academic_year`
- `form_status`
- `updated_at`
- `updated_by`

Contoh:

```text
event_name       = Ujian Muraja'ah Akhir Tahun
committee_name   = Panitia Ujian Muraja'ah Akhir Tahun
academic_year    = 1447–1448 H
form_status      = OPEN
```

`form_status`:

- `OPEN`
- `CLOSED`
- `MAINTENANCE`

Tidak boleh hardcode pada frontend.

---

## 6.2 kamar

Field:

- `id` UUID
- `nama_kamar`
- `limit_piket`
- `aktif`
- `urutan`
- `created_at`
- `updated_at`

Constraint:

```text
limit_piket >= 0
nama_kamar unique
```

---

## 6.3 guru

Master data hasil import Excel.

Field:

- `id` UUID
- `rnk`
- `nama`
- `kamar_id`
- `tahun`
- `aktif`
- `source_import_batch_id`
- `created_at`
- `updated_at`

Relasi:

```text
guru.kamar_id -> kamar.id
```

Data dari Excel:

```text
RNK
Nama
Kamar
Tahun
```

---

## 6.4 piket_submissions

Menyimpan satu transaksi penetapan piket.

Field:

- `id` UUID
- `kamar_id`
- `submitted_by`
- `submitted_at`
- `status`
- `client_request_id`
- `notes`

Status:

- `SUCCESS`
- `REJECTED`
- `CANCELLED`

`client_request_id` digunakan sebagai idempotency key untuk mencegah request yang sama diproses dua kali.

---

## 6.5 piket_submission_members

Relasi guru yang dipilih dalam sebuah submission.

Field:

- `id`
- `submission_id`
- `guru_id`
- `created_at`

Constraint:

```text
UNIQUE(submission_id, guru_id)
```

---

## 6.6 audit_logs

Mencatat tindakan penting.

Field:

- `id`
- `actor_id`
- `action`
- `entity_type`
- `entity_id`
- `old_data`
- `new_data`
- `created_at`
- `ip_hash` jika memang diperlukan dan sesuai kebijakan privasi

Contoh action:

```text
IMPORT_GURU
UPDATE_KAMAR_LIMIT
SUBMIT_PIKET
CLOSE_FORM
OPEN_FORM
UPDATE_SETTINGS
RESET_PIKET
```

---

## 6.7 import_batches

Menyimpan histori import.

Field:

- `id`
- `file_name`
- `total_rows`
- `valid_rows`
- `invalid_rows`
- `status`
- `imported_by`
- `created_at`

Status:

- `PREVIEW`
- `IMPORTED`
- `FAILED`
- `CANCELLED`

---

# 7. Aturan Bisnis

## 7.1 Limit Piket

Jika:

```text
limit_piket = 2
```

maka maksimal dua guru aktif dalam penetapan piket kamar tersebut.

Frontend boleh membatasi pilihan, tetapi database WAJIB memvalidasi kembali.

---

## 7.2 Satu Guru Tidak Boleh Menjadi Piket Dua Kali

Untuk satu periode kegiatan:

```text
guru_id hanya boleh muncul satu kali sebagai piket aktif.
```

Gunakan unique constraint/partial unique index sesuai desain status.

---

## 7.3 Guru Harus Berasal dari Kamar yang Sama

Jika submission untuk:

```text
Gontor
```

maka semua `guru_id` yang dipilih harus memiliki:

```text
guru.kamar_id = Gontor
```

Validasi harus dilakukan di database/server.

---

## 7.4 Submit Bersamaan

Wajib menggunakan database transaction.

Flow:

```text
BEGIN
  |
  +-- lock row kamar
  |
  +-- baca limit_piket terbaru
  |
  +-- hitung piket aktif
  |
  +-- validasi jumlah pilihan
  |
  +-- validasi guru
  |
  +-- insert submission
  |
  +-- insert submission members
  |
  +-- update status/derived state bila diperlukan
  |
COMMIT
```

Jangan menggunakan pola:

```text
SELECT jumlah
IF jumlah < limit
INSERT
```

tanpa locking karena rawan race condition.

Disarankan membuat PostgreSQL RPC/function, misalnya:

```text
submit_piket(kamar_id, guru_ids[], client_request_id)
```

Function tersebut menjadi satu-satunya jalur resmi submission.

---

# 8. Idempotency

Setiap submit dari frontend menghasilkan:

```text
client_request_id = UUID
```

Jika user menekan tombol dua kali atau browser mengulang request, request dengan `client_request_id` yang sama tidak boleh membuat submission baru.

Button submit harus berubah:

```text
Simpan Penetapan
        ↓
Memproses...
        ↓
disabled
```

Server tetap menjadi pengaman utama.

---

# 9. Flow User

## 9.1 Landing

URL:

```text
/
```

Menampilkan:

- nama kegiatan;
- nama panitia;
- status form;
- daftar kamar.

Contoh:

```text
UJIAN MURAJA'AH AKHIR TAHUN

Penentuan Piket Kamar Guru
Panitia Ujian Muraja'ah Akhir Tahun

Pilih kamar untuk melanjutkan.
```

Tidak perlu hero image, gradient besar, emoji, atau ilustrasi generik.

---

## 9.2 Daftar Kamar

Card/table hybrid.

Informasi:

- nama kamar;
- jumlah anggota;
- limit;
- jumlah piket;
- status.

Status:

```text
Belum ditetapkan
Sebagian
Terpenuhi
Form ditutup
```

---

## 9.3 Detail Kamar

Menampilkan:

```text
Gontor

24 anggota
Limit piket: 2
Terpilih: 1 / 2
```

Daftar guru menggunakan checkbox atau row selector.

Search nama wajib tersedia jika anggota > 15.

---

## 9.4 Submit

Sebelum submit tampilkan confirmation summary:

```text
Kamar: Gontor
Limit: 2
Dipilih: 2

1. Nama Guru A
2. Nama Guru B

[Batalkan] [Simpan Penetapan]
```

Setelah sukses:

```text
Penetapan berhasil disimpan.
```

---

# 10. Flow Admin

URL:

```text
/admin/login
```

Setelah login:

```text
/admin
/admin/kamar
/admin/guru
/admin/piket
/admin/import
/admin/settings
/admin/audit
```

Admin tidak boleh dapat mengakses halaman admin hanya karena mengetahui URL. Semua route admin wajib diverifikasi server-side berdasarkan authenticated user dan role.

---

# 11. Admin Dashboard

KPI:

- Total kamar
- Total guru
- Kamar sudah terpenuhi
- Kamar belum terpenuhi
- Total guru terpilih

Tabel monitoring:

```text
Kamar | Anggota | Limit | Piket | Status | Updated
```

Filter:

- Semua
- Belum
- Sebagian
- Terpenuhi

Search kamar.

---

# 12. Pengaturan Limit

Admin dapat mengubah:

```text
Gontor                 2
Gandy                  1
Perdos Saudi           2
Perdos UNIDA Siman     3
```

Setiap perubahan dicatat dalam audit log.

Jika limit diturunkan di bawah jumlah piket yang sudah ada, jangan menghapus data otomatis.

Tampilkan warning:

```text
Limit baru lebih kecil daripada jumlah piket aktif.
Data piket yang sudah ada tidak akan dihapus.
```

Admin kemudian harus melakukan tindakan eksplisit.

---

# 13. Import Excel

Template wajib:

| RNK | Nama | Kamar | Tahun |
|---:|---|---|---|

Import process:

```text
Upload
  ↓
Parse
  ↓
Validasi header
  ↓
Validasi baris
  ↓
Preview
  ↓
Confirm
  ↓
Transaction
  ↓
Import selesai
```

Validasi:

- header harus sesuai;
- nama tidak kosong;
- kamar tidak kosong;
- tahun tidak kosong;
- RNK valid;
- kamar harus dapat dibuat/dipetakan;
- duplicate harus ditampilkan;
- row error tidak boleh diam-diam hilang.

Preview:

```text
Total baris     694
Valid           690
Warning           2
Error             2
```

Admin dapat membatalkan import.

---

# 14. Strategi Import

Gunakan dua mode:

### Replace/Sync

Untuk kasus Excel adalah sumber master terbaru.

Sistem melakukan reconciliation:

- kamar baru → create;
- kamar hilang → tandai inactive, bukan langsung delete;
- guru baru → create;
- guru berubah → update;
- guru yang tidak ada pada file terbaru → inactive sesuai kebijakan.

### Append

Untuk menambahkan data baru tanpa menghapus master lama.

Mode harus dipilih admin sebelum import.

Default:

```text
Sync Master Data
```

---

# 15. Reset Penetapan

Admin dapat membatalkan penetapan kamar tertentu.

Wajib confirmation:

```text
Anda akan membatalkan seluruh penetapan
piket kamar Gontor.

Data histori tetap disimpan.
Status aktif akan dikosongkan.

Ketik GONTOR untuk melanjutkan.
```

Ini mencegah salah klik.

---

# 16. Export

Admin dapat export:

### Rekap Kamar

```text
Kamar
Jumlah Anggota
Limit
Jumlah Piket
Status
```

### Detail Piket

```text
Kamar
Nama Guru
Tahun
Waktu Penetapan
Operator
```

Format:

- XLSX
- CSV

---

# 17. Security

## Authentication

Supabase Auth.

Akun admin awal:

```text
Email:
muraja'ah@admin.id

Password awal:
muraja'ah2026
```

Password harus dapat diganti dan tidak boleh disimpan di source code.

## RLS

Default deny.

User publik hanya mendapatkan data yang memang diperlukan untuk form.

Data audit, settings sensitif, dan operasi administrasi hanya untuk admin.

Jangan expose service-role key ke browser.

---

# 18. Error Handling

Error harus diterjemahkan menjadi bahasa manusia.

Jangan tampilkan:

```text
Postgres error 23505
```

Gunakan:

```text
Penetapan tidak dapat disimpan karena
kamar ini baru saja memenuhi limit piket.
Silakan periksa kembali data kamar.
```

Untuk concurrency:

```text
Penetapan kamar baru saja berubah.
Data telah diperbarui. Silakan periksa pilihan
terbaru sebelum menyimpan kembali.
```

---

# 19. Observability

Admin dapat melihat:

- waktu submission;
- kamar;
- jumlah guru;
- operator;
- status;
- error import;
- perubahan limit;
- perubahan settings.

Tidak perlu memasukkan logging sensitif yang tidak diperlukan.

---

# 20. Acceptance Criteria

## AC-01

Admin dapat import Excel dengan struktur:

```text
RNK | Nama | Kamar | Tahun
```

## AC-02

Daftar kamar otomatis terbentuk berdasarkan data master.

## AC-03

Admin dapat menentukan limit per kamar.

## AC-04

User dapat memilih guru hanya dari kamar yang dipilih.

## AC-05

Jumlah pilihan tidak dapat melebihi limit.

## AC-06

Server/database tetap menolak submission yang melebihi limit.

## AC-07

Dua submission bersamaan tidak dapat menghasilkan jumlah piket melebihi limit.

## AC-08

Double-click/request retry tidak membuat transaksi duplikat.

## AC-09

Setiap submission tercatat dalam histori.

## AC-10

Admin dapat memonitor seluruh kamar.

## AC-11

Admin dapat export data.

## AC-12

Nama kegiatan/panitia/tahun dapat diubah melalui Settings.

## AC-13

Halaman admin terpisah dari halaman form.

## AC-14

Password admin dapat diganti.

## AC-15

Tidak ada secret Supabase service role di client.

---

# 21. Definition of Done

Fitur dianggap selesai apabila:

- schema database selesai;
- RLS selesai;
- RPC submission selesai;
- concurrency test lulus;
- import Excel lulus;
- duplicate import ditangani;
- admin authentication lulus;
- mobile responsive;
- accessibility dasar terpenuhi;
- loading/error/empty state tersedia;
- audit log bekerja;
- export bekerja;
- production environment menggunakan environment variables;
- tidak ada credential hardcoded;
- tidak ada emoji sebagai elemen UI;
- tidak menggunakan gradient/visual dekorasi generik;
- tidak ada placeholder yang tertinggal.

---

# 22. Prinsip Implementasi

1. Database adalah source of truth.
2. Client-side validation hanya untuk UX.
3. Server/database validation adalah security boundary.
4. Semua operasi penting dapat diaudit.
5. Jangan hardcode konfigurasi kegiatan.
6. Jangan menggunakan service-role key di frontend.
7. Jangan membuat tabel guru sebagai tempat histori transaksi.
8. Jangan menghapus histori ketika melakukan reset.
9. Jangan membuat UI yang terlihat seperti template AI.
10. Prioritaskan informasi, hierarchy, spacing, typography, dan interaction clarity.

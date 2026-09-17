# DESAIN.md
# Sistem Penentuan Piket Kamar Guru

## 1. Design Direction

Aplikasi harus terasa seperti **internal operational system milik institusi pendidikan**, bukan landing page startup dan bukan dashboard hasil generator AI.

Karakter:

- formal;
- tenang;
- presisi;
- modern;
- technology-forward;
- utilitarian;
- cepat digunakan;
- mudah dipahami dalam kondisi kerja panitia.

Visual harus menekankan data dan workflow.

### Hindari

- gradient berlebihan;
- glassmorphism;
- background mesh;
- blob;
- floating 3D object;
- ilustrasi stock;
- emoji;
- icon dekoratif;
- card berlebihan;
- shadow besar;
- rounded corner ekstrem;
- angka KPI yang terlalu besar;
- animasi yang tidak memiliki fungsi;
- tulisan "Welcome back";
- dashboard generik yang terlihat seperti template SaaS.

---

# 2. Visual Language

Gunakan visual language seperti software administrasi modern:

```text
Sharp
Dense but breathable
Structured
Quiet
Precise
Responsive
```

Corner radius:

- button: 6–8px
- input: 6–8px
- card: 8–10px
- modal: 10–12px

Jangan gunakan `rounded-full` kecuali untuk status indicator kecil atau avatar.

Border:

- 1px;
- subtle;
- konsisten.

Shadow:

- gunakan sangat tipis;
- lebih banyak mengandalkan border dan surface hierarchy.

---

# 3. Typography

Gunakan satu font family utama.

Rekomendasi:

```text
Inter
```

Fallback:

```text
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Hierarchy:

```text
Page title       24–30px / 600
Section title    18–20px / 600
Body             14–15px / 400
Table            13–14px
Caption          12–13px
```

Jangan terlalu banyak weight.

Gunakan:

```text
400
500
600
```

Hindari semua teks uppercase kecuali label kecil tertentu.

---

# 4. Color System

Gunakan palet netral dengan satu accent institusional.

Contoh token:

```css
--background: ...
--surface: ...
--surface-subtle: ...
--border: ...
--text: ...
--text-muted: ...
--accent: ...
--accent-foreground: ...
--success: ...
--warning: ...
--danger: ...
```

Warna harus digunakan berdasarkan fungsi.

Jangan memberikan setiap card warna berbeda.

Status:

- success: status terpenuhi/berhasil;
- warning: perlu perhatian;
- danger: error/tindakan destruktif;
- neutral: belum diproses.

Accent digunakan untuk action utama dan selected state.

---

# 5. Icon Policy

Aplikasi tidak menggunakan emoji.

Icon hanya digunakan ketika membantu pemahaman atau navigasi.

Gunakan library seperti:

```text
Lucide
```

Aturan:

- icon 16–18px pada control;
- icon tidak menggantikan label penting;
- jangan memasang icon pada setiap card;
- jangan menggunakan icon dekoratif;
- icon tombol destructive harus tetap memiliki text label.

Contoh benar:

```text
[ Import Excel ]
[ Export ]
[ Simpan Penetapan ]
```

Bukan:

```text
[ icon ]
[ icon ]
[ icon ]
```

---

# 6. Responsive Strategy

Desktop:

```text
max-width: 1280px
margin auto
padding 24–32px
```

Tablet:

```text
padding 20px
```

Mobile:

```text
padding 16px
```

Desktop boleh menggunakan sidebar admin.

Mobile admin:

- sidebar menjadi drawer;
- table dapat horizontal scroll;
- action penting tetap mudah dijangkau;
- jangan mengecilkan table sampai tidak terbaca.

---

# 7. Public/User Layout

URL:

```text
/
```

Header:

```text
┌────────────────────────────────────────────────────┐
│ UJIAN MURAJA'AH AKHIR TAHUN              Status    │
│ Penentuan Piket Kamar Guru                        │
└────────────────────────────────────────────────────┘
```

Header tidak perlu logo besar.

Nama kegiatan berasal dari database.

Di bawah header:

```text
Pilih Kamar

[ Search kamar... ]

┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Gontor         │ │ Gandy          │ │ Perdos Saudi   │
│                │ │                │ │                │
│ 24 anggota     │ │ 18 anggota     │ │ 12 anggota     │
│ 2 piket        │ │ 1 piket        │ │ 2 piket        │
│                │ │                │ │                │
│ Terpenuhi      │ │ Sebagian       │ │ Belum ditetapkan│
└────────────────┘ └────────────────┘ └────────────────┘
```

Namun card tidak boleh terlalu dekoratif.

Card adalah **interactive data surface**, bukan visual hero.

---

# 8. Kamar Card

Struktur:

```text
Nama Kamar
────────────
24 anggota

Piket
2 / 2

Status
Terpenuhi
```

Footer:

```text
Lihat anggota →
```

Status menggunakan badge sederhana.

Jangan:

```text
[ emoji api ]
SUPER READY!!!
```

---

# 9. Detail Kamar

Header:

```text
← Kembali

Gontor
24 anggota

Limit piket
2 orang

Terpilih
1 / 2
```

Kemudian toolbar:

```text
[ Cari nama guru................ ]

Terpilih: 1 / 2
```

Daftar:

```text
┌─────────────────────────────────────────────────────┐
│ □  K.H. Hasan Abdullah Sahal                       │
│    Senior                                            │
├─────────────────────────────────────────────────────┤
│ □  Drs. K.H. M. Akrim Mariyat, Dipl.A.Ed.          │
│    Senior                                            │
├─────────────────────────────────────────────────────┤
│ ☑  H. Imam Shobari, S.Ag.                           │
│    Senior                                            │
└─────────────────────────────────────────────────────┘
```

Row selection harus terasa seperti selection state, bukan sekadar checkbox kecil.

Saat terpilih:

- background surface berubah secara subtle;
- border berubah;
- checkbox berubah;
- jangan menggunakan animasi berlebihan.

---

# 10. Sticky Submission Bar

Pada desktop dan mobile, ketika ada pilihan:

```text
┌─────────────────────────────────────────────────────┐
│ 1 guru dipilih                         [Lanjutkan]  │
└─────────────────────────────────────────────────────┘
```

Pada mobile:

```text
┌───────────────────────────────┐
│ 1 / 2 dipilih                 │
│ [ Lanjutkan ke Konfirmasi ]   │
└───────────────────────────────┘
```

Sticky bar muncul hanya ketika diperlukan.

---

# 11. Confirmation Modal

Modal:

```text
Simpan Penetapan Piket

Kamar
Gontor

Limit
2 orang

Dipilih
2 orang

1. K.H. Hasan Abdullah Sahal
2. H. Imam Shobari, S.Ag.

[ Batalkan ]   [ Simpan Penetapan ]
```

Tidak menggunakan:

```text
Are you sure?
```

Gunakan bahasa operasional yang jelas.

---

# 12. Success State

Setelah sukses:

```text
Penetapan berhasil disimpan

Kamar Gontor
2 guru telah ditetapkan sebagai piket.

[ Kembali ke Daftar Kamar ]
```

Tidak perlu confetti.

Tidak perlu animasi besar.

---

# 13. Concurrency Error State

Jika request kalah dalam race:

```text
Penetapan tidak dapat disimpan

Kamar Gontor baru saja diperbarui oleh
pengguna lain dan limit piket telah terpenuhi.

Pilihan Anda belum disimpan.

[ Muat Data Terbaru ]
```

Ini lebih baik daripada menampilkan error teknis.

---

# 14. Admin Login

URL:

```text
/admin/login
```

Design:

```text
┌─────────────────────────────────────┐
│                                     │
│ Ujian Muraja'ah Akhir Tahun         │
│ Panel Administrator                 │
│                                     │
│ Email                               │
│ [ muraja'ah@admin.id              ] │
│                                     │
│ Password                            │
│ [ •••••••••••••••                ] │
│                                     │
│ [ Masuk ]                           │
│                                     │
└─────────────────────────────────────┘
```

Minimal.

Tidak ada:

- gradient background;
- illustration;
- stock image;
- marketing copy.

---

# 15. Admin Shell

Desktop:

```text
┌───────────────┬─────────────────────────────────────┐
│               │                                     │
│ MURAJA'AH     │ Dashboard                           │
│ ADMIN         │                                     │
│               │                                     │
│ Overview      │                                     │
│ Kamar         │                                     │
│ Guru          │                                     │
│ Piket         │                                     │
│ Import        │                                     │
│ Settings      │                                     │
│ Audit Log     │                                     │
│               │                                     │
│               │                                     │
│ Keluar        │                                     │
└───────────────┴─────────────────────────────────────┘
```

Sidebar tidak perlu banyak icon.

Jika icon digunakan, gunakan Lucide secara konsisten.

---

# 16. Admin Dashboard

Header:

```text
Dashboard
Monitoring penetapan piket kamar
```

KPI dibuat horizontal dan compact:

```text
Total Kamar       18
Total Guru       694
Terpenuhi         12
Belum             6
```

Bukan empat card besar dengan gradient.

Kemudian tabel:

```text
KAMAR
────────────────────────────────────────────────────────
Kamar              Anggota     Limit     Piket    Status
Gontor                24          2        2      Terpenuhi
Gandy                 18          1        1      Terpenuhi
Perdos Saudi          12          2        1      Sebagian
```

---

# 17. Admin Kamar

Toolbar:

```text
Kamar

[ Cari kamar................ ]   [ Import Excel ]
```

Table:

```text
Nama Kamar | Anggota | Limit | Piket | Status | Updated | Action
```

Action:

```text
Edit limit
Lihat anggota
Reset piket
```

Gunakan dropdown contextual action jika action terlalu banyak.

---

# 18. Edit Limit

Drawer atau modal kecil:

```text
Edit Limit Piket

Kamar
Gontor

Limit Piket
[ 2 ]

Jumlah piket aktif
2

[ Batal ] [ Simpan Perubahan ]
```

Jika limit baru < jumlah aktif:

```text
Perhatian

Limit baru berada di bawah jumlah piket aktif.
Piket yang sudah ada tidak akan dihapus.
```

---

# 19. Admin Guru

Table:

```text
RNK | Nama | Kamar | Tahun | Status
```

Search:

```text
Cari nama...
```

Filter:

```text
Kamar
Tahun
Status
```

Untuk data besar gunakan pagination/server-side query.

Jangan render ribuan row sekaligus.

---

# 20. Import Excel UI

Step indicator:

```text
1 Upload → 2 Validasi → 3 Preview → 4 Import
```

Upload:

```text
Import Master Kamar Guru

Template:
RNK | Nama | Kamar | Tahun

[ Pilih File Excel ]
```

Setelah upload:

```text
Kamar-Guru.xlsx
694 baris
```

Preview validation:

```text
VALID       690
WARNING       2
ERROR         2
```

Table error:

```text
Baris | Kolom | Masalah
23    | Nama  | Nama kosong
81    | Kamar | Kamar tidak ditemukan
```

Admin tidak boleh bingung antara warning dan error.

---

# 21. Settings

Section:

### Informasi Kegiatan

```text
Nama Kegiatan
[ Ujian Muraja'ah Akhir Tahun ]

Nama Panitia
[ Panitia Ujian Muraja'ah Akhir Tahun ]

Tahun Akademik
[ 1447–1448 H ]
```

### Status Form

```text
○ Open
○ Closed
○ Maintenance
```

### Administrator

```text
Email
muraja'ah@admin.id

[ Ubah Password ]
```

Settings tidak boleh dibuat seperti form panjang tanpa grouping.

---

# 22. Audit Log

Table:

```text
Waktu | Operator | Aktivitas | Target | Detail
```

Contoh:

```text
17 Sep 2026 21:14
Admin
UPDATE_KAMAR_LIMIT
Gontor
2 → 3
```

Detail dapat dibuka melalui drawer.

---

# 23. Empty States

Tidak boleh menggunakan ilustrasi.

Contoh:

```text
Belum ada data kamar

Import master data Kamar Guru untuk
mulai menggunakan sistem.

[ Import Excel ]
```

---

# 24. Loading States

Gunakan skeleton yang sederhana.

Jangan spinner raksasa.

Contoh:

```text
Kamar        ███████████
Anggota      ██████
Status       ████
```

Untuk tombol:

```text
Memproses...
```

---

# 25. Accessibility

Wajib:

- keyboard navigation;
- focus state jelas;
- label input eksplisit;
- contrast memadai;
- checkbox dapat diakses;
- modal memiliki focus trap;
- tombol tidak hanya menggunakan icon;
- error message terhubung dengan input;
- mobile touch target minimal sekitar 44px.

---

# 26. Motion

Motion hanya untuk feedback.

Durasi:

```text
120–200ms
```

Gunakan:

- hover;
- selected state;
- drawer;
- modal;
- toast.

Hindari:

- parallax;
- floating animation;
- bouncing;
- looping animation;
- page transition yang lambat.

---

# 27. Toast

Toast hanya untuk hasil operasi:

```text
Penetapan berhasil disimpan.
Limit kamar diperbarui.
Import berhasil.
Data berhasil diekspor.
```

Error penting tetap tampil di area konteks, bukan hanya toast.

---

# 28. Responsive Detail

Mobile detail kamar:

```text
← Gontor

24 anggota
Limit 2
1 dipilih

[ Cari nama... ]

──────────────────────
□ K.H. Hasan...
Senior
──────────────────────
☑ H. Imam...
Senior
──────────────────────

┌──────────────────────┐
│ 1 / 2 dipilih        │
│ [ Lanjutkan ]        │
└──────────────────────┘
```

Jangan membuat tabel desktop yang dipaksa mengecil menjadi 320px.

---

# 29. Data Density

Karena aplikasi digunakan panitia:

- jangan terlalu banyak whitespace;
- row table sekitar 48–56px;
- compact controls;
- filter mudah dijangkau;
- search selalu tersedia pada dataset besar.

Tujuannya adalah **operational efficiency**, bukan showcase visual.

---

# 30. Design System Components

Komponen reusable minimal:

```text
AppShell
AdminShell
PageHeader
SectionHeader
Button
Input
Select
SearchInput
Checkbox
Badge
DataTable
Pagination
Dialog
Drawer
Toast
Skeleton
EmptyState
ConfirmDialog
StatusBadge
KamarCard
GuruRow
SelectionSummary
ImportStepper
ImportPreview
```

Jangan membuat komponen yang terlalu abstrak jika hanya dipakai sekali.

---

# 31. Naming & Copywriting

Gunakan Bahasa Indonesia formal dan langsung.

Benar:

```text
Penetapan Piket
Limit Piket
Jumlah Anggota
Simpan Penetapan
Batalkan Penetapan
Muat Data Terbaru
```

Hindari:

```text
Let's get started
Super Admin
Awesome
You're all set
Wow!
```

Nama kegiatan dari database.

---

# 32. Final Visual Rule

Jika sebuah elemen tidak membantu:

- menemukan informasi;
- memahami status;
- melakukan tindakan;
- mencegah kesalahan;
- memahami konteks;

maka jangan masukkan elemen tersebut.

Aplikasi harus terlihat seperti **alat kerja panitia yang serius**, bukan website demo AI.

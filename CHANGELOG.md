# 📝 Catatan Perubahan & Pembaruan Sistem (Changelog)
### Proyek: Manabi Go - LMS Bahasa & Budaya Industri Jepang (SMKN 1 Adiwerna / STM ADB)

Dokumen ini mencatat seluruh pembaruan, perbaikan bug, penyesuaian sistem, dan peningkatan fitur yang telah dilakukan pada sistem Manabi Go, khususnya terkait deployment di server Rocky Linux (Docker Compose).

---

## 📌 [Versi 1.3.0] - 24 September 2026

### 1. 🔐 Solusi Masalah Login & Cache Browser Setelah Update Container
* **Masalah Sebelumnya:** Setelah container di-update/rebuild di server Rocky Linux, pengguna (siswa/guru) sering gagal login atau mental kembali ke `/login`, dan harus membersihkan cache browser secara manual.
* **Akar Masalah:**
  1. `AUTH_SECRET` tidak dikunci permanen, sehingga NextAuth mengacak kunci baru setiap container restart, membuat cookie sesi lama menjadi rusak (*invalid*).
  2. NextAuth di mode production secara default memasang cookie `__Secure-` (khusus HTTPS). Ketika diakses via IP publik biasa (`http://202.65.116.9:7008`), browser menolak cookie tersebut tanpa notifikasi.
  3. Next.js App Router client cache menahan state *unauthenticated* saat dipanggil dengan `router.push()`.
  4. Browser meng-cache file HTML lama yang memanggil file JavaScript *chunk hash* dari build sebelumnya.
* **Perbaikan yang Diterapkan:**
  * **Kunci Rahasia Permanen (`docker-compose.yml` & `src/lib/auth.ts`):** Menambahkan `AUTH_SECRET` dan `NEXTAUTH_SECRET` yang persisten di variabel lingkungan container dan kode autentikasi. Sesi login siswa tidak akan hangus saat container diperbarui.
  * **Cookie Aman Protokol HTTP (`src/lib/auth.ts`):** Cookie otomatis mendeteksi protokol; jika diakses via HTTP IP publik, tidak menggunakan prefix `__Secure-` sehingga diterima 100% oleh seluruh browser HP/Laptop.
  * **Anti-Cache Headers (`next.config.mjs`):** Menambahkan header `Cache-Control: no-cache, no-store, must-revalidate, max-age=0` untuk seluruh dokumen HTML dan rute autentikasi. Browser selalu memuat dokumen dan aset JS terbaru setelah container di-rebuild.
  * **Hard Redirect (`src/app/(auth)/login/page.tsx`):** Mengganti `router.push()` menjadi `window.location.href` setelah login berhasil agar memuat ulang halaman secara bersih dengan cookie sesi terbaru.
  * **Tombol Self-Healing di Halaman Login (`src/app/(auth)/login/page.tsx`):** Menambahkan tombol `🔄 Kendala Masuk? Segarkan Sesi & Bersihkan Cache` untuk memudahkan pengguna awam mereset cookie/storage dengan satu klik tanpa harus membuka menu pengaturan browser.

---

### 2. 📋 Pengelompokan Antrean Siswa (1 Baris per Siswa & Prioritas Terbaru)
* **File Terkait:** `src/app/guru/koreksi-kuis/page.tsx`
* **Peningkatan:**
  * **Tampilan Bersih:** Daftar antrean di sebelah kiri kini hanya menampilkan **1 rekaman per siswa per kuis**, tidak ada lagi duplikasi nama meski siswa mengulang kuis berkali-kali.
  * **Prioritas Pengiriman Terakhir:** Yang ditampilkan di daftar utama otomatis rekaman pengerjaan yang paling baru (*latest attempt*).
  * **Badge Riwayat:** Jika siswa memiliki lebih dari 1 riwayat pengiriman, muncul tanda `🔄 Nx Pengiriman (Klik untuk riwayat)`.
  * **Navigasi Riwayat Percobaan:** Saat nama siswa diklik, di bagian atas lembar koreksi muncul tab riwayat pengerjaan (`Percobaan #2 (Terbaru)`, `Percobaan #1`). Guru dapat berpindah antar percobaan dengan 1 kali klik.

---

### 3. 🤖 Centang Samping Nama & Koreksi AI Sekaligus (Batch AI Grading)
* **File Terkait:** `src/app/guru/koreksi-kuis/page.tsx`
* **Peningkatan:**
  * **Filter Judul Tugas / Kuis:** Dropdown filter khusus di bagian atas untuk menyaring antrean berdasarkan judul kuis tertentu, memudahkan jika ada banyak materi/tugas.
  * **Koreksi Massal Berdasarkan Nomor Soal yang Dicentang:** Guru dapat memilih nomor soal mana saja (misal: Soal #1 dan Soal #2) yang ingin dikoreksi AI untuk seluruh 5 siswa (atau N siswa) yang dicentang. Sistem HANYA mengevaluasi nomor butir soal tersebut untuk semua siswa terpilih, sementara butir soal lainnya tetap mempertahankan nilai siswa sebelumnya.
  * **Kotak Centang (Checkbox) Siswa:** Disediakan checkbox di samping setiap nama siswa, serta opsi *Pilih Semua Siswa* / *Batalkan Semua*.
  * **Panel Kontrol Koreksi Massal:** Menampilkan jumlah siswa terpilih, judul kuis, serta bilah pilihan nomor soal yang akan dievaluasi.
  * **Modal Progress Real-time:** Menampilkan jendela progres otomatis:
    1. Mengevaluasi nomor butir soal esai terpilih untuk tiap siswa dengan Gemini AI.
    2. Menghitung rata-rata nilai dan menentukan kelulusan KKM.
    3. Menyimpan nilai langsung ke database dengan status `GRADED`.
    4. Guru dapat memantau status tiap siswa secara langsung (*Antrean -> Menganalisis -> Menyimpan -> Selesai*).

---

### 4. 🎯 Pilihan Nomor Soal untuk AI & Pengisian Skor Otomatis
* **File Terkait:** 
  * `src/app/guru/koreksi-kuis/page.tsx`
  * `src/app/api/guru/koreksi-kuis/route.ts`
  * `src/app/api/guru/koreksi-kuis/[attemptId]/route.ts`
  * `src/app/api/quizzes/submit/route.ts`
* **Peningkatan:**
  * **Akses Semua Siswa:** Menghapus pembatasan modul `authorId`, sehingga Guru dan Super Admin dapat mengoreksi seluruh siswa dari semua kelas yang mengerjakan kuis esai.
  * **Bilah Nomor Soal Interaktif:** Guru dapat memilih nomor soal mana saja yang ingin dianalisis oleh AI (`[ Nomor 1 ✓ ] [ Nomor 2 ✓ ] ...`), atau klik tombol tanya AI per-nomor soal secara spesifik.
  * **Skor AI Pasti Terisi Otomatis:** Prompt Gemini AI dan regex parsing diperkuat bertingkat. Hasil evaluasi AI langsung masuk ke kotak input nilai per-soal dan menghitung total rata-rata nilai akhir secara instan.
  * **Status Otomatis:** Kuis dengan pertanyaan esai otomatis berstatus `PENDING_GRADING` saat dikumpulkan oleh siswa.

---

### 5. 🛠️ Script Pembaruan Otomatis (`update.sh`)
* **File Baru:** `update.sh` (Izin eksekusi `chmod +x`)
* **Fungsi:**
  * Menjalankan `git pull origin main` secara otomatis (dengan auto-stash aman jika ada file lokal).
  * Menyinkronkan struktur kolom database PostgreSQL di Docker (`TaskSubmission.fileUrls`, `Quiz.quizType`, `QuestionType`, dll).
  * Mem-build ulang container `manabi_app` tanpa *downtime* bagi aplikasi lain di server (seperti SI-Erin di port 7007).
  * Menjalankan `docker image prune -f` untuk menghemat kapasitas penyimpanan disk server Rocky Linux.
  * Dapat dijalankan manual (`./update.sh`) atau dijadwalkan otomatis melalui Crontab Linux.

---

### 6. 🐛 Perbaikan Database Schema (P2022 / Digest `56187003`)
* **Masalah:** Next.js melempar error server-side `The column TaskSubmission.fileUrls does not exist in the current database`.
* **Solusi:** Menambahkan kolom dan tipe enum baru pada PostgreSQL:
  * Enum `QuestionType ('MULTIPLE_CHOICE', 'ESSAY')`
  * `TaskSubmission.fileUrls` (JSONB)
  * `ModuleItem.maxFiles` (INTEGER)
  * `Quiz.delayMinutes` (INTEGER)
  * `Quiz.quizType` (TEXT)
  * `Question.type` (QuestionType)
  * `Question.referenceAnswer` (TEXT)
  * `QuizAttempt.status` (TEXT)
  * `QuizAttempt.answers` (JSONB)

---

## 📌 Ringkasan Komitmen Git Terkait
* `78934a9`: *fix: resolve login cache issues with persistent auth secret, anti-cache headers, HTTP-safe cookies, and hard redirect*
* `7635f93`: *feat: group quiz attempts by student showing latest submission, add attempt history tabs, and student checkboxes for batch AI grading*
* `1c1c5fb`: *feat: add automated update.sh script for Rocky Linux and Docker Compose*
* `4838212`: *feat: enhance koreksi-kuis with all-students access, interactive question number selector for AI, and instant score autofill*
* `3001b67`: *feat: tune rekap grade table, multi-photo preview with latest correction, essay correction checklist, and full backup coverage*

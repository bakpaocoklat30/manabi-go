# 🌸 Manabi Go - Portal Pembelajaran Bahasa & Budaya Industri Jepang

![Manabi Go Banner](https://img.shields.io/badge/Status-Production%20Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.0-1B222D?logo=prisma)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)

**Manabi Go** adalah sistem manajemen pembelajaran (LMS) khusus yang dikembangkan untuk **SMKN 1 Adiwerna (STM ADB)**. Platform ini dirancang secara khusus untuk memfasilitasi pembelajaran Bahasa dan Budaya Industri Jepang dengan pengalaman pengguna yang modern, estetik, dan sistem evaluasi anti-curang yang tangguh.

## ✨ Fitur Utama

### 🎓 Untuk Siswa
*   **Dashboard Interaktif:** Mengakses materi, modul, dan daftar tugas dengan mudah.
*   **Kuis Anti-Curang (Anti-Cheat):** Sistem otomatis mendeteksi perpindahan *tab browser*, memunculkan peringatan, dan dapat melakukan *auto-submit* jika pelanggaran melebihi batas.
*   **Pengumpulan Tugas Lokal & Drive:** Mengunggah file tugas (gambar, dokumen) langsung ke server dengan sistem *deadline* otomatis penguncian.
*   **Riwayat & Evaluasi:** Melihat rekam jejak nilai kuis dan tugas secara transparan dengan ornamen visual hujan Sakura 🌸.

### 👨‍🏫 Untuk Guru (Sensei)
*   **Course Builder Dinamis:** Membangun materi, menyisipkan video YouTube, dan modul pelajaran dengan antarmuka *drag-and-drop*.
*   **Manajemen Kuis Terpusat:** Mengatur KKM, batas waktu, pengacakan soal/opsi, serta opsi mengizinkan/menolak *retake* kuis.
*   **Pusat Evaluasi:** Mengoreksi dan memberikan nilai tugas siswa dari satu layar.
*   **Rekapitulasi Nilai:** Mengunduh dan memantau keseluruhan nilai siswa.

### 🛡️ Untuk Administrator
*   **Manajemen Entitas:** Mengatur data Master Guru, Siswa, dan Kelas.
*   **Manajemen Backup Cerdas:** Melakukan *Full Backup* (Semua tabel database + file unggahan) langsung ke Google Drive hanya dengan satu klik.

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

*   **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
*   **Language:** TypeScript
*   **Database ORM:** [Prisma](https://www.prisma.io/)
*   **Database Engine:** PostgreSQL
*   **Styling:** Tailwind CSS & Lucide Icons
*   **Authentication:** NextAuth.js (Credentials Provider)
*   **Cloud Integration:** Google Drive API (Backup Node.js stream)

---

## 🚀 Panduan Instalasi (Development)

1. **Clone Repositori**
   ```bash
   git clone https://github.com/bakpaocoklat30/manabi-go.git
   cd manabi-go
   ```

2. **Instalasi Dependensi**
   ```bash
   npm install
   ```

3. **Jalankan Database di Docker**
   Pastikan Docker Desktop aktif, lalu jalankan hanya container database PostgreSQL:
   ```bash
   npm run docker:db
   # atau: docker compose up -d manabi_postgres
   ```
   *Catatan: PostgreSQL di-expose ke port **5434** host.*

4. **Konfigurasi Environment**
   File `.env` sudah disiapkan (atau salin dari `.env.example`):
   ```env
   DATABASE_URL="postgresql://manabi_user:adb_jepang_secret_2026@localhost:5434/manabi_go_db?schema=public"
   AUTH_SECRET="super_secret_manabi_adb_token_key_2026"
   NEXTAUTH_SECRET="super_secret_manabi_adb_token_key_2026"
   NEXTAUTH_URL="http://localhost:3000"
   ```

5. **Sinkronisasi Schema Database & Seeding**
   ```bash
   npm run prisma:push
   npm run db:seed
   ```

6. **Jalankan Server Development**
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses melalui `http://localhost:3000`.

---

## 🔑 Kredensial Default (Dari Seed)

Gunakan kredensial ini untuk menguji sistem setelah melakukan instalasi awal:

| Peran | Username / Identifier | Password |
| :--- | :--- | :--- |
| **Admin** | `admin_it` | `adminadb2026` |
| **Guru** | `198501012010012001` (NIP) | `adb12345` |
| **Siswa** | `212210001` (NISN) | `adb12345` |

---

## 📦 Deployment (Production Docker di VPS / Rocky Linux)

Aplikasi ini telah dikonfigurasi penuh untuk berjalan di atas **Docker Compose** (misal pada server Rocky Linux / AlmaLinux / Ubuntu):

1. **Jalankan Aplikasi:**
   ```bash
   docker compose up -d
   ```
   *Aplikasi berjalan pada port `7008` dan PostgreSQL pada port `5434` agar tidak bentrok dengan aplikasi lain seperti SI-Erin.*

2. **Pembaruan Otomatis (Auto Update):**
   Gunakan script bawaan untuk memperbarui aplikasi ke versi terbaru tanpa perlu menghapus cache manual:
   ```bash
   ./update.sh
   ```

---

## 📝 Catatan Rilis & Changelog

Seluruh riwayat pembaruan, perbaikan bug, fitur AI koreksi kuis, dan solusi cache login didokumentasikan secara rinci pada file [CHANGELOG.md](file:///d:/project/pkl%20tkj%20rev/manabi-go/CHANGELOG.md).

---
*Dibuat dengan ❤️ untuk kemajuan pendidikan di SMKN 1 Adiwerna.*

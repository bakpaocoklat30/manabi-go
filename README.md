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

3. **Konfigurasi Environment**
   Buat file `.env` di *root directory* dan isi dengan parameter berikut:
   ```env
   # Koneksi Database
   DATABASE_URL="postgresql://user:password@localhost:5432/manabigo_db"
   
   # NextAuth Secret
   NEXTAUTH_SECRET="buat_rahasia_acak_anda_disini"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Migrasi Database & Seeding**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Jalankan Server Development**
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

## 📦 Deployment (Production)

Untuk *deployment* ke *production* (seperti VPS atau Vercel):
1. Pastikan Anda telah mengatur `DATABASE_URL` yang mengarah ke *production database*.
2. Jalankan kompilasi:
   ```bash
   npm run build
   ```
3. Mulai server:
   ```bash
   npm run start
   ```

---
*Dibuat dengan ❤️ untuk kemajuan pendidikan di SMKN 1 Adiwerna.*

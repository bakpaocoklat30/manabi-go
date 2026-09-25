#!/bin/bash
# ==============================================================================
# MANABI GO - SCRIPT AUTO UPDATE SISTEM (ROCKY LINUX / DOCKER COMPOSE)
# SMK NEGERI 1 ADIWERNA (STM ADB)
# ==============================================================================

# Hentikan eksekusi jika terjadi error kritis
set -e

# Warna Terminal untuk Output Cantik
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Direktori proyek (lokasi script berada)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${PURPLE}================================================================${NC}"
echo -e "${CYAN}🚀 [MANABI GO] MEMULAI PROSES PEMBARUAN SISTEM OTOMATIS${NC}"
echo -e "${PURPLE}================================================================${NC}"
echo -e "Waktu Eksekusi: $(date '+%Y-%m-%d %H:%M:%S') WIB"
echo -e "Lokasi Proyek : ${SCRIPT_DIR}"
echo ""

# ------------------------------------------------------------------------------
# 1. Validasi Lingkungan
# ------------------------------------------------------------------------------
echo -e "${BLUE}[1/5] Memeriksa kelengkapan file dan Docker...${NC}"

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml tidak ditemukan di ${SCRIPT_DIR}!${NC}"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ File .env tidak ditemukan. Menyalin dari .env.example...${NC}"
    cp .env.example .env
fi

# Pastikan Docker Compose tersedia (v2 atau v1)
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}❌ Error: Docker Compose tidak terdeteksi di server ini!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Lingkungan valid (Menggunakan: ${DOCKER_COMPOSE})${NC}"

# ------------------------------------------------------------------------------
# 2. Tarik Pembaruan Kode dari Git Remote
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[2/5] Menarik kode terbaru dari GitHub (origin/main)...${NC}"

# Ambil commit hash saat ini
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Simpan perubahan lokal jika ada (stash) agar pull tidak gagal
git stash > /dev/null 2>&1 || true

# Tarik branch main
git pull origin main

NEW_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LATEST_MSG=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "-")

echo -e "${GREEN}✓ Versi kode saat ini: [${NEW_COMMIT}] - ${LATEST_MSG}${NC}"

# ------------------------------------------------------------------------------
# 3. Pastikan Database Aktif & Skema Terupdate
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[3/5] Memeriksa container database PostgreSQL...${NC}"

# Jalankan service postgres jika belum menyala
$DOCKER_COMPOSE up -d manabi_postgres

# Tunggu 3 detik agar PostgreSQL siap menerima koneksi
sleep 3

# Terapkan skema fitur baru langsung via query SQL aman (IF NOT EXISTS)
echo -e "${CYAN}→ Menyinkronkan kolom tabel database (TaskSubmission, Quiz, Question)...${NC}"
$DOCKER_COMPOSE exec -T manabi_postgres psql -U manabi_user -d manabi_go_db -c '
DO $$ BEGIN
    CREATE TYPE "QuestionType" AS ENUM ('\''MULTIPLE_CHOICE'\'', '\''ESSAY'\'');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
ALTER TABLE "TaskSubmission" ADD COLUMN IF NOT EXISTS "fileUrls" JSONB;
ALTER TABLE "ModuleItem" ADD COLUMN IF NOT EXISTS "maxFiles" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "delayMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "quizType" TEXT NOT NULL DEFAULT '\''MULTIPLE_CHOICE'\'';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "type" "QuestionType" NOT NULL DEFAULT '\''MULTIPLE_CHOICE'\'';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "referenceAnswer" TEXT;
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "Option" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT '\''GRADED'\'';
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "answers" JSONB;
' > /dev/null 2>&1 || true

echo -e "${GREEN}✓ Skema database siap dan sinkron.${NC}"

# ------------------------------------------------------------------------------
# 4. Build dan Jalankan Ulang Container Aplikasi
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[4/5] Membangun ulang (build) container manabi_app...${NC}"
$DOCKER_COMPOSE build manabi_app

echo -e "${CYAN}→ Me-restart container manabi_app...${NC}"
$DOCKER_COMPOSE up -d --no-deps manabi_app

# Tunggu container aktif
sleep 5

# Jalankan prisma db push dari dalam container untuk memastikan 100% sinkron
$DOCKER_COMPOSE exec -T -u root -e HOME=/root manabi_app npx -y prisma@5.22.0 db push --skip-generate > /dev/null 2>&1 || true

echo -e "${GREEN}✓ Container manabi_app berhasil diperbarui dan berjalan!${NC}"

# ------------------------------------------------------------------------------
# 5. Pembersihan File Image Docker Usang (Prune)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[5/5] Membersihkan image docker yang sudah tidak terpakai...${NC}"
docker image prune -f > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Ruang disk server dibersihkan dari image usang.${NC}"

# ------------------------------------------------------------------------------
# Ringkasan Selesai
# ------------------------------------------------------------------------------
echo ""
echo -e "${PURPLE}================================================================${NC}"
echo -e "${GREEN}🎉 PEMBARUAN MANABI GO BERHASIL DILAKUKAN!${NC}"
echo -e "${PURPLE}================================================================${NC}"
echo -e "Status Container:"
$DOCKER_COMPOSE ps manabi_app
echo ""
echo -e "Aplikasi dapat diakses di: ${CYAN}http://localhost:7008${NC} atau ${CYAN}http://[IP-PUBLIK]:7008${NC}"
echo -e "${PURPLE}================================================================${NC}"

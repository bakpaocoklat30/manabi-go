#!/bin/bash
# ==============================================================================
# MANABI GO - DIRECTORY & FILE SCAFFOLDING GENERATOR
# SMK NEGERI 1 ADIWERNA (STM ADB)
# BreakcellentDev Standard
# ==============================================================================

echo "🚀 [MANABI GO] Memulai inisialisasi struktur direktori enterprise..."

# Daftar Direktori
DIRECTORIES=(
  "prisma"
  "src/app/(auth)/login"
  "src/app/api/auth/[...nextauth]"
  "src/app/api/modules"
  "src/app/api/quizzes/submit"
  "src/app/api/assignments/upload"
  "src/app/admin/users"
  "src/app/admin/classes"
  "src/app/guru/modules/create"
  "src/app/guru/evaluations"
  "src/app/guru/grades"
  "src/app/siswa/modules/[id]"
  "src/app/siswa/quiz/[id]"
  "src/app/siswa/progress"
  "src/components/ui"
  "src/components/layout"
  "src/components/shared"
  "src/lib"
  "src/types"
  "public/uploads"
)

for dir in "${DIRECTORIES[@]}"; do
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    echo "📁 Dibuat: $dir"
  fi
done

echo "✅ Semua direktori berhasil dibuat!"
echo "✨ Jalankan perintah instalasi dependency berikutnya."
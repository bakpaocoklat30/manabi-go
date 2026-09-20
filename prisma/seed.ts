import { PrismaClient, Role, ContentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [SEED] Memulai inisialisasi master data Manabi Go STM ADB...');

  // 1. Bersihkan database terlebih dahulu (Clean State)
  await prisma.attendance.deleteMany();
  await prisma.taskSubmission.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.moduleItem.deleteMany();
  await prisma.moduleKelas.deleteMany();
  await prisma.learningModule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.kelas.deleteMany();

  const saltRounds = 10;
  const defaultPasswordHash = await bcrypt.hash('adb12345', saltRounds);

  // 2. Buat Super Admin IT
  const admin = await prisma.user.create({
    data: {
      identifier: 'admin_it',
      name: 'Super Admin IT STM ADB',
      passwordHash: await bcrypt.hash('adminadb2026', saltRounds),
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('👤 Admin dibuat:', admin.identifier);

  // 3. Buat Data Kelas
  const kelasTkr = await prisma.kelas.create({
    data: {
      name: 'XII TKR 1',
      jurusan: 'Teknik Kendaraan Ringan Otomotif',
      driveFolderUrl: 'https://drive.google.com/drive/folders/contoh-folder-tkr1',
    },
  });
  console.log('🏫 Kelas dibuat:', kelasTkr.name);

  // 4. Buat Akun Guru Bahasa Jepang
  const guru = await prisma.user.create({
    data: {
      identifier: '198501012010012001',
      name: 'Sensei Siti Nurhaliza, S.Pd.',
      passwordHash: defaultPasswordHash,
      role: Role.GURU,
    },
  });
  console.log('🧑‍🏫 Guru dibuat:', guru.name);

  // 5. Buat Akun Siswa Contoh
  const siswa = await prisma.user.create({
    data: {
      identifier: '212210001',
      name: 'Budi Santoso',
      passwordHash: defaultPasswordHash,
      role: Role.SISWA,
      kelasId: kelasTkr.id,
    },
  });
  console.log('🎒 Siswa dibuat:', siswa.name);

  // 6. Buat Modul Pekan 1
  const moduleMinggu1 = await prisma.learningModule.create({
    data: {
      title: 'Minggu 1: Salam, Huruf Dasar & Kosakata Bengkel (Otomotif)',
      weekNumber: 1,
      description: 'Mempelajari Aisatsu di tempat kerja, 5 baris awal Hiragana (A-I-U-E-O s.d. Ka-Ki-Ku-Ke-Ko), dan alat bengkel dasar.',
      authorId: guru.id,
      assignedTo: {
        create: {
          kelasId: kelasTkr.id, publishAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // 7. Konten Item Modul
  await prisma.moduleItem.create({
    data: {
      moduleId: moduleMinggu1.id,
      type: ContentType.BUDAYA_KERJA,
      title: 'Etos Kerja Industri: Aisatsu & Konsep 5S/5R',
      orderIndex: 1,
      bodyText: `Dalam budaya kerja industri di Jepang, Aisatsu (salam) adalah hal paling utama sebelum memulai pekerjaan di bengkel atau lini produksi.
      
Rumus 5S di Pabrik Jepang:
1. Seiri (Ringkas): Memilah barang yang diperlukan dan tidak.
2. Seiton (Rapi): Menata letak alat kerja sesuai penomoran.
3. Seiso (Resik): Membersihkan area kerja dan mesin dari oli/debu.
4. Seiketsu (Rawat): Mempertahankan standar 3S sebelumnya.
5. Shitsuke (Rajin): Membiasakan diri disiplin tanpa perlu diperintah.`,
    },
  });

  await prisma.moduleItem.create({
    data: {
      moduleId: moduleMinggu1.id,
      type: ContentType.KOTOBA_TEKNIS,
      title: 'Kotoba Teknis: Perkakas Bengkel (Kougu)',
      orderIndex: 2,
      bodyText: `Daftar perkakas umum di bengkel otomotif:
• スパナ (Supana) = Kunci Pas
• メガネレンチ (Megane Renchi) = Kunci Ring
• ドライバー (Doraibaa) = Obeng (+ / -)
• ハンマー (Hanmaa) = Palu
• オイル (Oiru) = Oli / Pelumas Mesin`,
    },
  });

  await prisma.moduleItem.create({
    data: {
      moduleId: moduleMinggu1.id,
      type: ContentType.YOUTUBE_TUTORIAL,
      title: 'Video Panduan: Urutan Guratan Hiragana (A - O)',
      orderIndex: 3,
      youtubeUrl: 'https://www.youtube.com/watch?v=6p9Il_j0zjc',
      bodyText: 'Simak video tutorial berikut untuk memahami urutan tarikan garis (Kakijun) huruf Hiragana secara presisi.',
    },
  });

  await prisma.moduleItem.create({
    data: {
      moduleId: moduleMinggu1.id,
      type: ContentType.TUGAS_MENULIS,
      title: 'Tugas Praktik Menulis: Kotoba Perkakas Bengkel di Kertas Kotak',
      orderIndex: 4,
      gdrivePrompt: 'Tuliskan 5 kosakata alat perkakas di atas pada buku kotak tugas Bahasa Jepang. Foto tulisan tangan kamu dengan pencahayaan jelas, lalu unggah ke folder Google Drive kelas.',
    },
  });

  // 8. Buat Kuis Evaluasi Pekan 1
  const kuisMinggu1 = await prisma.quiz.create({
    data: {
      moduleId: moduleMinggu1.id,
      title: 'Kuis Evaluasi Pemahaman Minggu 1 (Kosakata & Budaya)',
      timeLimitMinutes: 15,
      passingScore: 75,
    },
  });

  const q1 = await prisma.question.create({
    data: {
      quizId: kuisMinggu1.id,
      questionText: 'Apa istilah Bahasa Jepang untuk alat bengkel "Kunci Ring"?',
      explanation: 'Megane Renchi (メガネレンチ) secara harfiah berbentuk bulat menyerupai kacamata (megane).',
      orderIndex: 1,
    },
  });

  await prisma.option.createMany({
    data: [
      { questionId: q1.id, optionText: 'メガネレンチ (Megane Renchi)', isCorrect: true },
      { questionId: q1.id, optionText: 'スパナ (Supana)', isCorrect: false },
      { questionId: q1.id, optionText: 'ドライバー (Doraibaa)', isCorrect: false },
      { questionId: q1.id, optionText: 'ハンマー (Hanmaa)', isCorrect: false },
    ],
  });

  const q2 = await prisma.question.create({
    data: {
      quizId: kuisMinggu1.id,
      questionText: 'Prinsip 5S yang memiliki arti menata alat kerja pada tempatnya secara teratur adalah...',
      explanation: 'Seiton (整頓) berarti merapikan dan meletakkan perkakas pada tempat khusus dengan penandaan jelas.',
      orderIndex: 2,
    },
  });

  await prisma.option.createMany({
    data: [
      { questionId: q2.id, optionText: 'Seiri (Ringkas)', isCorrect: false },
      { questionId: q2.id, optionText: 'Seiton (Rapi)', isCorrect: true },
      { questionId: q2.id, optionText: 'Seiso (Resik)', isCorrect: false },
      { questionId: q2.id, optionText: 'Shitsuke (Rajin)', isCorrect: false },
    ],
  });

  console.log('✅ [SEED] Master data Manabi Go berhasil diisi ke database!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
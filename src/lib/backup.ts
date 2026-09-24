import { prisma } from '@/lib/prisma';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

export async function generateFullBackupZip() {
  // 1. Ambil seluruh data dari setiap tabel di database
  const users = await prisma.user.findMany();
  const kelas = await prisma.kelas.findMany();
  const learningModules = await prisma.learningModule.findMany();
  const moduleItems = await prisma.moduleItem.findMany();
  const questions = await prisma.question.findMany();
  const taskSubmissions = await prisma.taskSubmission.findMany();
  const systemSettings = await prisma.systemSetting.findMany();
  const moduleKelas = await prisma.moduleKelas.findMany();
  const quizzes = await prisma.quiz.findMany();
  const options = await prisma.option.findMany();
  const quizAttempts = await prisma.quizAttempt.findMany();
  const attendances = await prisma.attendance.findMany();
  const moduleAccess = await prisma.moduleAccess.findMany();

  // Relasi many-to-many Guru dan Kelas yang diajar
  let guruKelas: any[] = [];
  try {
    guruKelas = await prisma.$queryRawUnsafe('SELECT * FROM "_GuruKelas"');
  } catch (e: any) {
    console.warn('Gagal membaca tabel _GuruKelas:', e?.message);
  }

  const timestamp = new Date().toISOString();
  const dump = {
    metadata: {
      version: '1.0',
      timestamp,
      counts: {
        users: users.length,
        kelas: kelas.length,
        learningModules: learningModules.length,
        moduleKelas: moduleKelas.length,
        moduleItems: moduleItems.length,
        quizzes: quizzes.length,
        questions: questions.length,
        options: options.length,
        quizAttempts: quizAttempts.length,
        taskSubmissions: taskSubmissions.length,
        attendances: attendances.length,
        moduleAccess: moduleAccess.length,
        systemSettings: systemSettings.length,
        guruKelas: guruKelas.length,
      }
    },
    users,
    kelas,
    learningModules,
    moduleItems,
    questions,
    taskSubmissions,
    systemSettings,
    moduleKelas,
    quizzes,
    options,
    quizAttempts,
    attendances,
    moduleAccess,
    guruKelas,
    timestamp
  };

  const jsonString = JSON.stringify(dump, null, 2);

  // 2. Buat file ZIP berisi database.json dan folder uploads
  const zip = new AdmZip();
  zip.addFile('database.json', Buffer.from(jsonString, 'utf8'));

  // 3. Masukkan seluruh file unggahan siswa dan foto coretan hasil koreksi guru
  const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
  if (fs.existsSync(uploadsPath)) {
    zip.addLocalFolder(uploadsPath, 'uploads');
  }

  const zipBuffer = zip.toBuffer();
  const fileName = `manabi_go_backup_${timestamp.replace(/[:.]/g, '-')}.zip`;

  return {
    zipBuffer,
    fileName,
    dump
  };
}

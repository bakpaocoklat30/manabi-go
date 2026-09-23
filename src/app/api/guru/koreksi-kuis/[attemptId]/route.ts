import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'GURU') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const { attemptId } = await context.params;
    const { action, score, totalCorrect, feedback } = await req.json();

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: { questions: true }
        }
      }
    });

    if (!attempt) return NextResponse.json({ message: 'Attempt tidak ditemukan' }, { status: 404 });

    if (action === 'ASK_AI') {
      // 1. Dapatkan model dan key
      const aiKeySetting = await prisma.systemSetting.findUnique({ where: { key: 'gemini_api_key' } });
      const aiModelSetting = await prisma.systemSetting.findUnique({ where: { key: 'gemini_model_name' } });
      const apiKey = aiKeySetting?.value || process.env.GEMINI_API_KEY;
      const modelName = aiModelSetting?.value || 'models/gemini-1.5-flash';
      
      if (!apiKey) {
        return NextResponse.json({ message: 'AI Key belum dikonfigurasi oleh Admin.' }, { status: 400 });
      }

      // Ambil pertanyaan & jawaban siswa
      const answers: any[] = attempt.answers as any[] || [];
      const evaluations = [];

      for (const question of attempt.quiz.questions) {
        if (question.type !== 'ESSAY') continue;
        const studentAnswer = answers.find(a => a.questionId === question.id);
        const studentText = studentAnswer?.answerText || '';
        const reference = question.referenceAnswer || '';

        const aiSetting = await prisma.systemSetting.findUnique({ where: { key: 'ai_grading_prompt' } });
        const defaultPrompt = `Anda adalah asisten guru bahasa. Berikan evaluasi singkat (maksimal 2 kalimat) atas jawaban siswa ini dibandingkan dengan kunci jawaban referensi. Setelah penjelasan, simpulkan dengan skor (0 jika salah total, 50 jika setengah benar, 100 jika benar). Kunci: "${reference}", Jawaban Siswa: "${studentText}".\nFormat Wajib: Penjelasan singkat. SKOR: [angka].`;
        let prompt = (aiSetting?.value || defaultPrompt)
          .replace('{{reference}}', reference)
          .replace('{{studentText}}', studentText);

        try {
          const endpoint = modelName.includes('/') ? modelName : `models/${modelName}`;
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${endpoint}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          const aiData = await res.json();
          const aiResponseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'AI Gagal memproses.';
          evaluations.push({
            questionId: question.id,
            questionText: question.questionText,
            studentText,
            reference,
            aiFeedback: aiResponseText
          });
        } catch (e) {
          console.error(e);
        }
      }

      return NextResponse.json({ evaluations }, { status: 200 });
    }

    if (action === 'SAVE_GRADE') {
      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          score: Number(score),
          totalCorrect: Number(totalCorrect),
          status: 'GRADED'
        }
      });
      return NextResponse.json({ message: 'Nilai berhasil disimpan.' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Action invalid' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== 'GURU' && session.user?.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const { attemptId } = await context.params;
    const { action, score, totalCorrect, questionIds, answers: updatedAnswers } = await req.json();

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: { 
            questions: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ message: 'Attempt pengerjaan siswa tidak ditemukan' }, { status: 404 });
    }

    if (action === 'ASK_AI') {
      // 1. Dapatkan model dan key dari pengaturan sistem atau env
      const aiKeySetting = await prisma.systemSetting.findUnique({ where: { key: 'gemini_api_key' } });
      const aiModelSetting = await prisma.systemSetting.findUnique({ where: { key: 'gemini_model_name' } });
      const apiKey = aiKeySetting?.value || process.env.GEMINI_API_KEY;
      let modelName = aiModelSetting?.value || 'models/gemini-1.5-flash';
      if (!modelName.startsWith('models/')) modelName = `models/${modelName}`;
      
      if (!apiKey || apiKey.trim() === '') {
        return NextResponse.json({ 
          message: 'API Key Gemini belum disetel. Admin dapat mengaturnya di menu Pengaturan Backup & API.' 
        }, { status: 400 });
      }

      // Ambil pertanyaan & riwayat jawaban siswa
      const answers: any[] = (attempt.answers as any[]) || [];
      const evaluations = [];

      for (const question of attempt.quiz.questions) {
        // Anggap soal esai jika tipe ESSAY atau kuis bertipe ESSAY
        const isEssay = question.type === 'ESSAY' || attempt.quiz.quizType === 'ESSAY';
        if (!isEssay) continue;
        
        // Hanya proses nomor soal yang dipilih oleh guru jika questionIds dikirim
        if (questionIds && Array.isArray(questionIds) && questionIds.length > 0 && !questionIds.includes(question.id)) {
          continue;
        }

        const studentAnswer = answers.find(a => a.questionId === question.id);
        const studentText = studentAnswer?.answerText || '';
        const reference = question.referenceAnswer || '';

        const aiSetting = await prisma.systemSetting.findUnique({ where: { key: 'ai_grading_prompt' } });
        const defaultPrompt = `Anda adalah asisten guru bahasa profesional di SMK. Evaluasi jawaban esai siswa berikut secara objektif berdasarkan kunci jawaban referensi guru.

Pertanyaan: "${question.questionText}"
Kunci Referensi Guru: "${reference}"
Jawaban Siswa: "${studentText}"

Petunjuk Evaluasi:
1. Bandingkan ketepatan makna dan konten jawaban siswa dengan referensi.
2. Tentukan skor dari 0 sampai 100:
   - 100: Sempurna / makna sangat tepat.
   - 75-90: Sebagian besar benar / hanya ada typo atau kekurangan minor.
   - 40-60: Setengah benar / pemahaman sebagian.
   - 10-30: Kurang tepat tetapi ada usaha relevan.
   - 0: Kosong / tidak menjawab / salah total.
3. Berikan ulasan singkat (1-2 kalimat) yang konstruktif.
4. WAJIB di baris terakhir tulis persis:
SKOR: [angka 0-100]`;

        let prompt = (aiSetting?.value || defaultPrompt)
          .replace('{{reference}}', reference)
          .replace('{{studentText}}', studentText);

        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 300,
              }
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Gagal menghubungi Google AI (${res.statusText})`;
            throw new Error(errMsg);
          }

          const aiData = await res.json();
          const aiResponseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'AI tidak memberikan respons evaluasi.';
          
          // Parsing Skor AI yang sangat andal
          let suggestedScore = 0;
          const matchStrict = aiResponseText.match(/(?:SKOR|NILAI|SCORE|GRADE)\s*[:=]?\s*(\d{1,3})/i);
          if (matchStrict && matchStrict[1]) {
            suggestedScore = parseInt(matchStrict[1], 10);
          } else {
            const matchBracket = aiResponseText.match(/\[(\d{1,3})\]/);
            if (matchBracket && matchBracket[1]) {
              suggestedScore = parseInt(matchBracket[1], 10);
            } else {
              const numbers = aiResponseText.match(/\b(100|[1-9]?[0-9])\b/g);
              if (numbers && numbers.length > 0) {
                suggestedScore = parseInt(numbers[numbers.length - 1], 10);
              } else {
                suggestedScore = studentText.trim().length > 0 ? 75 : 0;
              }
            }
          }
          suggestedScore = Math.max(0, Math.min(100, suggestedScore));

          evaluations.push({
            questionId: question.id,
            questionText: question.questionText,
            studentText,
            reference,
            aiFeedback: aiResponseText,
            suggestedScore,
          });
        } catch (e: any) {
          console.error(`AI Grading Error for Question ${question.id}:`, e);
          return NextResponse.json({ 
            message: `Gagal memproses AI: ${e.message || 'Koneksi ke Gemini terganggu.'}` 
          }, { status: 500 });
        }
      }

      return NextResponse.json({ evaluations }, { status: 200 });
    }

    if (action === 'SAVE_GRADE') {
      const updateData: any = {
        score: Number(score),
        totalCorrect: Number(totalCorrect),
        status: 'GRADED'
      };
      if (updatedAnswers && Array.isArray(updatedAnswers)) {
        updateData.answers = updatedAnswers;
      }
      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: updateData
      });
      return NextResponse.json({ message: 'Nilai kuis berhasil disimpan.' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Aksi tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in koreksi-kuis attempt action:', error);
    return NextResponse.json({ message: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

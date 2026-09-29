const fs = require('fs');
const file = 'src/app/api/guru/modules/[id]/quiz/route.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  "import { PrismaClient, QuestionType } from '@prisma/client';",
  "import { PrismaClient, QuestionType } from '@prisma/client';\nimport { cutAudio } from '@/lib/audio-cutter';\nimport path from 'path';\nimport { v4 as uuidv4 } from 'uuid';"
);

// 2. Handle audio cutting before transaction
const bodyDestructure = `const { title, timeLimitMinutes, passingScore, randomizeOptions, randomizeQuestions, antiCheatMode, allowRetake, maxRetakes, showAnswers, showScore, questions } = body;`;
const beforeTransaction = `
    const masterAudioUrl = body.audioUrl || null;
    let processedQuestions = [...questions];

    if (quizType === 'LISTENING_AUTO' && masterAudioUrl) {
      const inputPath = path.join(process.cwd(), 'public', masterAudioUrl);
      
      if (fs.existsSync(inputPath)) {
        for (let i = 0; i < processedQuestions.length; i++) {
          const q = processedQuestions[i];
          if (typeof q.audioStartTime === 'number' && typeof q.audioEndTime === 'number') {
            const outputFilename = \`cut_\${uuidv4()}.mp3\`;
            const outputRelativePath = \`/uploads/audio/\${outputFilename}\`;
            const outputPath = path.join(process.cwd(), 'public', 'uploads', 'audio', outputFilename);
            
            try {
              console.log(\`[AUTO CUT] Memotong soal \${i+1} dari \${q.audioStartTime} ke \${q.audioEndTime}\`);
              await cutAudio(inputPath, outputPath, q.audioStartTime, q.audioEndTime);
              q.audioUrl = outputRelativePath; // Assign hasil potongan untuk siswa
            } catch (err) {
              console.error(\`Gagal memotong audio soal \${i+1}:\`, err);
            }
          }
        }
      }
    }
`;
content = content.replace(bodyDestructure, bodyDestructure + '\n' + beforeTransaction);

// 3. Update transaction to use processedQuestions
content = content.replace(
  "for (let i = 0; i < questions.length; i++) {",
  "for (let i = 0; i < processedQuestions.length; i++) {"
);
content = content.replace(
  "const q = questions[i];",
  "const q = processedQuestions[i];"
);
content = content.replace(
  "type: (quizType === 'LISTENING' && q.type === 'ESSAY') ? QuestionType.ESSAY : (quizType === 'ESSAY' ? QuestionType.ESSAY : QuestionType.MULTIPLE_CHOICE),",
  "type: ((quizType === 'LISTENING' || quizType === 'LISTENING_AUTO') && q.type === 'ESSAY') ? QuestionType.ESSAY : (quizType === 'ESSAY' ? QuestionType.ESSAY : QuestionType.MULTIPLE_CHOICE),"
);
content = content.replace(
  "audioUrl: q.audioUrl || null,",
  "audioUrl: q.audioUrl || null,\n              audioStartTime: q.audioStartTime !== undefined ? Number(q.audioStartTime) : null,\n              audioEndTime: q.audioEndTime !== undefined ? Number(q.audioEndTime) : null,"
);

// 4. Update orderIndex
content = content.replace(
  "orderIndex: quizType === 'MULTIPLE_CHOICE' ? 1 : (quizType === 'ESSAY' ? 2 : 3), // Sort order",
  "orderIndex: quizType === 'MULTIPLE_CHOICE' ? 1 : (quizType === 'ESSAY' ? 2 : (quizType === 'LISTENING' ? 3 : 4)), // Sort order"
);

fs.writeFileSync(file, content);
console.log('API patched for LISTENING_AUTO');

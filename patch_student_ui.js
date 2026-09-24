const fs = require('fs');
const file = 'src/app/siswa/quiz/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Submit mapping
content = content.replace(
  "selectedOptionId: quizData.quizType === 'ESSAY' ? null : (currentAnswers[q.id] || ''),",
  "selectedOptionId: q.type === 'ESSAY' ? null : (currentAnswers[q.id] || ''),"
);
content = content.replace(
  "answerText: quizData.quizType === 'ESSAY' ? (currentAnswers[q.id] || '') : null,",
  "answerText: q.type === 'ESSAY' ? (currentAnswers[q.id] || '') : null,"
);

// 2. Review detail essay check
content = content.replace(
  "{quizData.quizType === 'ESSAY' && (",
  "{item.studentAnswerText !== undefined && item.studentAnswerText !== null && ("
);

// 3. Question Card title
content = content.replace(
  "<span className=\"text-xs text-slate-500 font-medium\">{quizData.quizType === 'ESSAY' ? 'Isian Singkat' : 'Pilihan Ganda'}</span>",
  "<span className=\"text-xs text-slate-500 font-medium\">{currentQuestion.type === 'ESSAY' ? 'Isian Singkat' : 'Pilihan Ganda'}</span>"
);

// 4. Input jawban type
content = content.replace(
  "{quizData.quizType === 'ESSAY' ? (",
  "{currentQuestion.type === 'ESSAY' ? ("
);

fs.writeFileSync(file, content);
console.log('Patched Student UI for mixed quiz types');

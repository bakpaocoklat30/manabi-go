const fs = require('fs');
const file = 'src/app/siswa/quiz/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{result.status !== 'PENDING_GRADING' && result.review && result.review.length > 0 && (",
  "{result.status !== 'PENDING_GRADING' && result.review && result.review.length > 0 && quizData.showAnswers !== false && ("
);

fs.writeFileSync(file, content);
console.log('Patched Student UI for showAnswers');

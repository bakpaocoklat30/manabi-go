const fs = require('fs');
const file = 'src/app/api/quizzes/submit/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "review: isPending ? [] : reviewDetails, // Hide review details if pending",
  "review: (isPending || quiz.showAnswers === false) ? [] : reviewDetails, // Hide review details if pending or disabled"
);

fs.writeFileSync(file, content);
console.log('Patched Submit API for showAnswers');

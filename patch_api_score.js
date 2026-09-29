const fs = require('fs');
const file = 'src/app/api/guru/modules/[id]/quiz/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const { title, timeLimitMinutes, passingScore, randomizeOptions, randomizeQuestions, antiCheatMode, allowRetake, maxRetakes, showAnswers, questions } = body;",
  "const { title, timeLimitMinutes, passingScore, randomizeOptions, randomizeQuestions, antiCheatMode, allowRetake, maxRetakes, showAnswers, showScore, questions } = body;"
);

content = content.replace(
  "showAnswers: typeof showAnswers === 'boolean' ? showAnswers : true,",
  "showAnswers: typeof showAnswers === 'boolean' ? showAnswers : true,\n        showScore: typeof showScore === 'boolean' ? showScore : true,"
);

fs.writeFileSync(file, content);
console.log('API Patched for showScore');

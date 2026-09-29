const fs = require('fs');
const file = 'src/app/api/guru/modules/[id]/quiz/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const { title, timeLimitMinutes, passingScore, randomizeOptions, randomizeQuestions, antiCheatMode, allowRetake, maxRetakes, questions } = body;",
  "const { title, timeLimitMinutes, passingScore, randomizeOptions, randomizeQuestions, antiCheatMode, allowRetake, maxRetakes, showAnswers, questions } = body;"
);

content = content.replace(
  "maxRetakes: maxRetakes ? Number(maxRetakes) : 3,",
  "maxRetakes: maxRetakes ? Number(maxRetakes) : 3,\n        showAnswers: typeof showAnswers === 'boolean' ? showAnswers : true,"
);

fs.writeFileSync(file, content);
console.log('Patched API for showAnswers');

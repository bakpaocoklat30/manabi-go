const fs = require('fs');
const file = 'src/app/api/quizzes/submit/route.ts';
let content = fs.readFileSync(file, 'utf8');

// The DB record needs to store the actual score
content = content.replace(
  "score: quiz.showScore === false ? null : finalScore,",
  "score: finalScore," // Restore to DB save
);

// Hide it in JSON response
content = content.replace(
  "score: finalScore,",
  "score: quiz.showScore === false ? null : finalScore,"
);

fs.writeFileSync(file, content);
console.log('Fixed submit API score type');

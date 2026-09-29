const fs = require('fs');
const file = 'src/app/api/quizzes/submit/route.ts';
let content = fs.readFileSync(file, 'utf8');

// I swapped them previously but apparently not successfully because they both matched "score: quiz.showScore === false ? null : finalScore,"
// Let's replace line 129 explicitly.
content = content.replace(
  "score: quiz.showScore === false ? null : finalScore,\n        totalCorrect,",
  "score: finalScore,\n        totalCorrect,"
);
content = content.replace(
  "score: finalScore,\n        status,",
  "score: quiz.showScore === false ? null : finalScore,\n        status,"
);

fs.writeFileSync(file, content);

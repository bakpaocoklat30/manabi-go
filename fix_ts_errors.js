const fs = require('fs');

// Fix 1: submit route score
const submitFile = 'src/app/api/quizzes/submit/route.ts';
let submitContent = fs.readFileSync(submitFile, 'utf8');
submitContent = submitContent.replace(
  "score: quiz.showScore === false ? null : finalScore,\n        totalCorrect,",
  "score: finalScore,\n        totalCorrect,"
);
fs.writeFileSync(submitFile, submitContent);

// Fix 2: currentTime undefined error
const builderFile = 'src/app/guru/builder/[id]/quiz/page.tsx';
let builderContent = fs.readFileSync(builderFile, 'utf8');
builderContent = builderContent.replace(
  "audioEl.currentTime = q.audioStartTime;",
  "audioEl.currentTime = q.audioStartTime || 0;"
);
fs.writeFileSync(builderFile, builderContent);

console.log('Fixed TS errors.');

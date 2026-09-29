const fs = require('fs');
const file = 'src/app/api/quizzes/submit/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "message: isPending ? 'Jawaban berhasil dikumpulkan. Menunggu koreksi dari guru.' : 'Kuis berhasil dinilai.',",
  "message: isPending ? 'Jawaban berhasil dikumpulkan. Menunggu koreksi dari guru.' : (quiz.showScore === false ? 'Terima kasih, jawaban Anda telah tersimpan.' : 'Kuis berhasil dinilai.'),"
);

content = content.replace(
  "score: finalScore,",
  "score: quiz.showScore === false ? null : finalScore,"
);

content = content.replace(
  "totalCorrect: isPending ? 0 : totalCorrect,",
  "totalCorrect: (isPending || quiz.showScore === false) ? 0 : totalCorrect,"
);

content = content.replace(
  "isPassed: isPending ? false : finalScore >= quiz.passingScore,",
  "isPassed: (isPending || quiz.showScore === false) ? null : finalScore >= quiz.passingScore,"
);

fs.writeFileSync(file, content);
console.log('API submit patched for showScore');

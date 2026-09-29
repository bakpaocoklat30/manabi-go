const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<<<<<<< HEAD[\s\S]*?=======\n([\s\S]*?)>>>>>>> 129591c[^\n]*\n/g;

content = content.replace(regex, (match, p1) => {
  return `            setRandomizeOptions(data.quiz.randomizeOptions !== false);
            setRandomizeQuestions(data.quiz.randomizeQuestions !== false);
            setAntiCheatMode(data.quiz.antiCheatMode || 'WARNING');
            if (data.quiz.allowRetake !== undefined) setAllowRetake(data.quiz.allowRetake);
            if (data.quiz.showAnswers !== undefined) setShowAnswers(data.quiz.showAnswers);
            if (data.quiz.maxRetakes !== undefined) setMaxRetakes(data.quiz.maxRetakes);\n`;
});

fs.writeFileSync(file, content);
console.log('Conflict resolved.');

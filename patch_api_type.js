const fs = require('fs');
const file = 'src/app/api/guru/modules/[id]/quiz/route.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `type: quizType === 'ESSAY' ? QuestionType.ESSAY : QuestionType.MULTIPLE_CHOICE, // Force to match parent quizType so they don't get mixed up!`;
const replacement = `type: (quizType === 'LISTENING' && q.type === 'ESSAY') ? QuestionType.ESSAY : (quizType === 'ESSAY' ? QuestionType.ESSAY : QuestionType.MULTIPLE_CHOICE),`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Patched API type saving');

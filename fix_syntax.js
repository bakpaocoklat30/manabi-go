const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const [maxRetakes,\n          audioUrl: quizAudioUrl, setMaxRetakes] = useState(3);',
  'const [maxRetakes, setMaxRetakes] = useState(3);'
);

fs.writeFileSync(file, content);
console.log('Fixed syntax error');

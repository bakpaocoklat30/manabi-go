const fs = require('fs');
const file = 'src/app/siswa/quiz/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "allowRetake: boolean;",
  "allowRetake: boolean;\n  showAnswers?: boolean;"
);

fs.writeFileSync(file, content);
console.log('Patched Interface');

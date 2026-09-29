const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('Scissors,')) {
  content = content.replace(
    "import {",
    "import { Scissors,"
  );
  fs.writeFileSync(file, content);
  console.log('Imported Scissors successfully.');
} else {
  console.log('Scissors is already imported.');
}

const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { Scissors, useParams",
  "import { useParams"
);

content = content.replace(
  "ArrowLeft, Plus, Trash2",
  "Scissors, ArrowLeft, Plus, Trash2"
);

fs.writeFileSync(file, content);
console.log('Fixed import correctly.');

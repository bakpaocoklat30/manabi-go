const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "if (audioEl.currentTime >= q.audioEndTime) {",
  "if (audioEl.currentTime >= (q.audioEndTime || 0)) {"
);

fs.writeFileSync(file, content);
console.log('Fixed TS undefined endtime check.');

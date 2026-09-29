const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replaceAll(
  "const audioEl = document.getElementById(`audio-player-${qIndex}`);",
  "const audioEl = document.getElementById(`audio-player-${qIndex}`) as HTMLAudioElement;"
);

fs.writeFileSync(file, content);
console.log('Fixed TS casting.');

const fs = require('fs');
const file = 'src/app/api/guru/modules/[id]/quiz/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { QuestionType } from '@prisma/client';",
  "import { QuestionType } from '@prisma/client';\nimport { cutAudio } from '@/lib/audio-cutter';\nimport path from 'path';\nimport fs from 'fs';\nimport { v4 as uuidv4 } from 'uuid';"
);

fs.writeFileSync(file, content);
console.log('Fixed imports');

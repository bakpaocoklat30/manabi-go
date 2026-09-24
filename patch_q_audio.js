const fs = require('fs');
const file = 'src/app/siswa/quiz/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            {currentQuestion.imageUrl && (`;

const replacement = `            {currentQuestion.audioUrl && (
              <div className="mb-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase mb-2 block">Putar Rekaman Berikut:</span>
                <audio controls src={currentQuestion.audioUrl} className="w-full h-10" controlsList="nodownload" />
              </div>
            )}

            {currentQuestion.imageUrl && (`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Patched question audio');

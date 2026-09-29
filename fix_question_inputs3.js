const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{quizType === 'LISTENING' && \(\s*<div className="mb-2">[\s\S]*?catch\s*\(err\)\s*\{\s*alert\('Gagal mengunggah audio'\);\s*\}\s*\}\s*\}\} \/>\s*<\/label>\s*<\/div>\s*<\/div>\s*\)\}/;

const match = content.match(regex);
if (match) {
  const replacement = match[0] + `\n              {quizType === 'LISTENING_AUTO' && (
                <div className="mb-2 grid grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-700 uppercase mb-1">Mulai (Detik)</label>
                    <input type="number" min="0" step="1" value={q.audioStartTime ?? ''} onChange={(e) => {
                      const newQ = [...questions];
                      newQ[qIndex].audioStartTime = Number(e.target.value);
                      setQuestions(newQ);
                    }} className="w-full text-xs p-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-white text-indigo-900" placeholder="Contoh: 0" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-700 uppercase mb-1">Selesai (Detik)</label>
                    <input type="number" min="0" step="1" value={q.audioEndTime ?? ''} onChange={(e) => {
                      const newQ = [...questions];
                      newQ[qIndex].audioEndTime = Number(e.target.value);
                      setQuestions(newQ);
                    }} className="w-full text-xs p-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-white text-indigo-900" placeholder="Contoh: 15" />
                  </div>
                  {(q.audioStartTime !== undefined && q.audioEndTime !== undefined && quizAudioUrl) && (
                    <div className="col-span-2 text-xs font-medium text-indigo-800 bg-indigo-100 p-2.5 rounded-xl border border-indigo-200 flex items-center justify-between mt-1">
                      <span>Preview Potongan:</span>
                      <audio controls src={\`\${quizAudioUrl}#t=\${q.audioStartTime},\${q.audioEndTime}\`} className="h-8 w-64" />
                    </div>
                  )}
                </div>
              )}`;
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Successfully patched inputs with regex match!');
} else {
  console.log('Failed again.');
}

const fs = require('fs');
const file = 'src/app/siswa/quiz/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Bar: Status Navigasi & Timer */}`;

const replacement = `<div className="max-w-4xl mx-auto space-y-6 pb-16">
      {quizData.audioUrl && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            Audio Utama Kuis (Listening)
          </span>
          <audio controls src={quizData.audioUrl} className="w-full h-10 outline-none" controlsList="nodownload" />
        </div>
      )}

      {/* Header Bar: Status Navigasi & Timer */}`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Patched global audio');

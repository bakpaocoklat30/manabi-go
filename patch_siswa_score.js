const fs = require('fs');
const file = 'src/app/siswa/quiz/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add showScore to interface
content = content.replace(
  "showAnswers?: boolean;",
  "showAnswers?: boolean;\n  showScore?: boolean;"
);

// 2. Icon logic
const oldIconLogic = `{result.status === 'PENDING_GRADING' ? (
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              ) : result.isPassed ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <RotateCcw className="w-8 h-8 text-amber-400" />
              )}`;
const newIconLogic = `{result.status === 'PENDING_GRADING' ? (
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              ) : quizData.showScore === false ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : result.isPassed ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <RotateCcw className="w-8 h-8 text-amber-400" />
              )}`;

content = content.replace(oldIconLogic, newIconLogic);

// 3. Score display logic
const oldScoreDisplay = `{result.status === 'PENDING_GRADING' ? (
                <>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-blue-950/60 border-blue-800 text-blue-300">
                    Menunggu Koreksi Guru
                  </span>
                  <h3 className="text-2xl font-black text-white font-mono mt-4">
                    Jawaban Tersimpan
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">
                    Guru akan meninjau dan menilai esai Anda.
                  </p>
                </>
              ) : (`;

const newScoreDisplay = `{result.status === 'PENDING_GRADING' ? (
                <>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-blue-950/60 border-blue-800 text-blue-300">
                    Menunggu Koreksi Guru
                  </span>
                  <h3 className="text-2xl font-black text-white font-mono mt-4">
                    Jawaban Tersimpan
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">
                    Guru akan meninjau dan menilai esai Anda.
                  </p>
                </>
              ) : quizData.showScore === false ? (
                <>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-emerald-950/60 border-emerald-800 text-emerald-300">
                    Kuis Selesai
                  </span>
                  <h3 className="text-2xl font-black text-white font-mono mt-4">
                    Jawaban Tersimpan
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">
                    Terima kasih, jawaban Anda telah berhasil dikumpulkan.
                  </p>
                </>
              ) : (`;

content = content.replace(oldScoreDisplay, newScoreDisplay);

fs.writeFileSync(file, content);
console.log('Siswa UI patched for showScore');

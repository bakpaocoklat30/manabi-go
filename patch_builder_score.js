const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
content = content.replace(
  "const [showAnswers, setShowAnswers] = useState(true);",
  "const [showAnswers, setShowAnswers] = useState(true);\n  const [showScore, setShowScore] = useState(true);"
);

// 2. Load state
content = content.replace(
  "if (data.quiz.showAnswers !== undefined) setShowAnswers(data.quiz.showAnswers);",
  "if (data.quiz.showAnswers !== undefined) setShowAnswers(data.quiz.showAnswers);\n            if (data.quiz.showScore !== undefined) setShowScore(data.quiz.showScore);"
);

// 3. Save state
content = content.replace(
  "showAnswers,\n          maxRetakes",
  "showAnswers,\n          showScore,\n          maxRetakes"
);

// 4. UI Toggle
const uiTarget = `<div className="flex flex-col">
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-2">Tinjauan Hasil</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} className="rounded border-stone-300 text-purple-600 focus:ring-purple-600 w-4 h-4" />
                      <span className="text-xs font-bold text-stone-700">Tampilkan Jawaban Benar Setelah Selesai</span>
                    </label>
                  </div>`;
const uiReplacement = `<div className="flex flex-col gap-3">
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase">Tinjauan Hasil</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showScore} onChange={(e) => setShowScore(e.target.checked)} className="rounded border-stone-300 text-purple-600 focus:ring-purple-600 w-4 h-4" />
                      <span className="text-xs font-bold text-stone-700">Tampilkan Nilai Seketika</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} className="rounded border-stone-300 text-purple-600 focus:ring-purple-600 w-4 h-4" />
                      <span className="text-xs font-bold text-stone-700">Tampilkan Jawaban Benar Setelah Selesai</span>
                    </label>
                  </div>`;

if (!content.includes('Tampilkan Nilai Seketika')) {
  content = content.replace(uiTarget, uiReplacement);
}

fs.writeFileSync(file, content);
console.log('Builder UI patched for showScore');

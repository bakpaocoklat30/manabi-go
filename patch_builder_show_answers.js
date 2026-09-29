const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
content = content.replace(
  "const [allowRetake, setAllowRetake] = useState(true);",
  "const [allowRetake, setAllowRetake] = useState(true);\n  const [showAnswers, setShowAnswers] = useState(true);"
);

// 2. Load state
content = content.replace(
  "if (data.quiz.allowRetake !== undefined) setAllowRetake(data.quiz.allowRetake);",
  "if (data.quiz.allowRetake !== undefined) setAllowRetake(data.quiz.allowRetake);\n          if (data.quiz.showAnswers !== undefined) setShowAnswers(data.quiz.showAnswers);"
);

// 3. Save state
content = content.replace(
  "allowRetake,\n          maxRetakes,",
  "allowRetake,\n          maxRetakes,\n          showAnswers,"
);

// 4. UI Toggle
const uiTarget = `<div className="flex flex-col">
              <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Ujian Ulang (Retake)</label>`;
const uiReplacement = `<div className="flex flex-col">
              <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Tinjauan Hasil</label>
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} className="rounded border-stone-300 text-purple-600 focus:ring-purple-600" />
                <span className="text-xs font-bold text-stone-700">Tampilkan Jawaban Benar Setelah Selesai</span>
              </label>
            </div>
            
            <div className="flex flex-col">
              <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Ujian Ulang (Retake)</label>`;

if (!content.includes('Tampilkan Jawaban Benar Setelah Selesai')) {
  content = content.replace(uiTarget, uiReplacement);
}

fs.writeFileSync(file, content);
console.log('Patched Builder for showAnswers');

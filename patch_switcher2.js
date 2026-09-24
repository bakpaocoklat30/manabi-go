const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const switcherUI = `
              {quizType === 'LISTENING' && (
                <div className="mb-4 bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-stone-800">Bentuk Jawaban</h4>
                    <p className="text-[10px] text-stone-500">Pilih format cara siswa menjawab soal mendengarkan ini.</p>
                  </div>
                  <select
                    value={q.type === 'ESSAY' ? 'ESSAY' : 'MULTIPLE_CHOICE'}
                    onChange={(e) => {
                      const newQ = [...questions];
                      newQ[qIndex].type = e.target.value;
                      setQuestions(newQ);
                    }}
                    className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-700 outline-none focus:border-purple-500"
                  >
                    <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                    <option value="ESSAY">Isian Singkat (Teks)</option>
                  </select>
                </div>
              )}
`;

const qTarget = `              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Pertanyaan</label>`;
if (!content.includes("Bentuk Jawaban")) {
  content = content.replace(qTarget, switcherUI + '\\n' + qTarget);
}

const mcTarget = `{(!q.type || q.type === 'MULTIPLE_CHOICE' || q.type === 'LISTENING') && (`;
const mcReplacement = `{(q.type !== 'ESSAY') && (`;
content = content.replace(mcTarget, mcReplacement);

fs.writeFileSync(file, content);
console.log('Patched switcher UI v2');

const fs = require('fs');
const file = 'src/app/siswa/quiz/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `
                    <span>{opt.optionText}</span>
                    <div
                      className={\`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 \${
`;

const replacement = `
                    <div className="flex flex-col gap-3 flex-1 min-w-0 pr-4">
                      {opt.imageUrl && (
                        <img src={opt.imageUrl} alt="Pilihan Jawaban" className="max-h-32 max-w-full object-contain rounded-lg border border-slate-700 bg-slate-900" />
                      )}
                      {opt.optionText && (
                        <span className="text-sm font-medium leading-relaxed">{opt.optionText}</span>
                      )}
                    </div>
                    <div
                      className={\`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 \${
`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('Patched active question options');

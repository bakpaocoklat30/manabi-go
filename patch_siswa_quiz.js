const fs = require('fs');
const file = 'src/app/siswa/quiz/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add audioUrl to interfaces
content = content.replace('antiCheatMode?: string;', 'antiCheatMode?: string;\n  audioUrl?: string;');
content = content.replace('imageUrl?: string;', 'imageUrl?: string;\n  audioUrl?: string;');
content = content.replace('optionText: string;', 'optionText: string;\n  imageUrl?: string;');

// 2. Global Audio UI
const globalAudioUI = `
          {quizData.audioUrl && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm flex flex-col gap-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                Audio Utama Kuis (Listening)
              </span>
              <audio controls src={quizData.audioUrl} className="w-full h-10 outline-none" controlsList="nodownload" />
            </div>
          )}
`;
// Insert before "Header Info Kuis"
content = content.replace('{/* Header Info Kuis */}', globalAudioUI + '\n          {/* Header Info Kuis */}');

// 3. Question Audio UI
const questionAudioUI = `
            {currentQ.audioUrl && (
              <div className="mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase mb-2 block">Putar Rekaman Berikut:</span>
                <audio controls src={currentQ.audioUrl} className="w-full h-10" controlsList="nodownload" />
              </div>
            )}
`;
// Insert before currentQ.imageUrl
content = content.replace('{currentQ.imageUrl && (', questionAudioUI + '\n            {currentQ.imageUrl && (');

// 4. Option Image UI
// The current code maps options and shows optionText.
// We need to render the image if it exists.
const optionReplaceTarget = `
                    <span className="text-sm font-medium text-slate-200">
                      {opt.optionText}
                    </span>
`;
const optionImageRender = `
                    <div className="flex flex-col gap-2">
                      {opt.imageUrl && (
                        <img src={opt.imageUrl} alt="Pilihan Jawaban" className="max-h-32 object-contain rounded-lg border border-slate-700 bg-slate-900" />
                      )}
                      {opt.optionText && (
                        <span className="text-sm font-medium text-slate-200">
                          {opt.optionText}
                        </span>
                      )}
                    </div>
`;
content = content.replace(optionReplaceTarget, optionImageRender);

// 5. Result Details: Also show option image in the Review Details?
// Let's also check if review details has optionText.
const resultOptionTarget = `
                                    <span className="text-sm font-medium text-slate-200">
                                      {opt.optionText}
                                    </span>
`;
content = content.replace(resultOptionTarget, optionImageRender); // replace the second occurrence if any.

fs.writeFileSync(file, content);
console.log('Patch applied to student quiz successfully!');

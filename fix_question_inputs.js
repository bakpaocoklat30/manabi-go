const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{quizType === 'LISTENING' && \(\s*<div className="mb-2">\s*<label className="block text-\[11px\] font-semibold text-stone-500 uppercase mb-1">Audio Soal \(Opsional\)<\/label>\s*<div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-200">\s*<Headphones className="w-4 h-4 text-stone-400" \/>\s*\{q\.audioUrl && \(\s*<AudioPlayer src=\{q\.audioUrl\} className="h-8 max-w-\[220px\]" \/>\s*\)\}\s*<label className="cursor-pointer text-xs font-bold text-cyan-600 hover:text-cyan-700">\s*\{q\.audioUrl \? 'Ganti Audio' : '\+ Tambah Audio Spesifik Soal'\}\s*<input type="file" accept="audio\/\*" className="hidden" onChange=\{async \(e\) => \{\s*if \(e\.target\.files && e\.target\.files\[0\]\) \{\s*try \{\s*const formData = new FormData\(\);\s*formData\.append\('file', e\.target\.files\[0\]\);\s*const res = await fetch\('\/api\/upload\/audio', \{ method: 'POST', body: formData \}\);\s*if \(!res\.ok\) throw new Error\(\);\s*const data = await res\.json\(\);\s*const newQ = \[\.\.\.questions\];\s*newQ\[qIndex\]\.audioUrl = data\.url;\s*setQuestions\(newQ\);\s*\} catch \(err\) \{\s*alert\('Gagal mengunggah audio'\);\s*\}\s*\}\s*\}\} \/>\s*<\/label>\s*<\/div>\s*<\/div>\s*\)\}/;

const replacement = `{quizType === 'LISTENING' && (
                <div className="mb-2">
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Audio Soal (Opsional)</label>
                  <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <Headphones className="w-4 h-4 text-stone-400" />
                    {q.audioUrl && (
                      <AudioPlayer src={q.audioUrl} className="h-8 max-w-[220px]" />
                    )}
                    <label className="cursor-pointer text-xs font-bold text-cyan-600 hover:text-cyan-700">
                      {q.audioUrl ? 'Ganti Audio' : '+ Tambah Audio Spesifik Soal'}
                      <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          try {
                            const formData = new FormData();
                            formData.append('file', e.target.files[0]);
                            const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
                            if (!res.ok) throw new Error();
                            const data = await res.json();
                            const newQ = [...questions];
                            newQ[qIndex].audioUrl = data.url;
                            setQuestions(newQ);
                          } catch (err) {
                            alert('Gagal mengunggah audio');
                          }
                        }
                      }} />
                    </label>
                  </div>
                </div>
              )}
              {quizType === 'LISTENING_AUTO' && (
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

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Successfully patched inputs!');
} else {
  console.log('Failed to match regex.');
}

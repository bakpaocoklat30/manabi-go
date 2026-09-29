const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `{quizType === 'LISTENING_AUTO' && (
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

const intuitiveEditor = `{quizType === 'LISTENING_AUTO' && (
                <div className="mb-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <label className="block text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5"/> Editor Potongan Audio</label>
                  
                  {!quizAudioUrl ? (
                    <div className="text-xs text-indigo-600 bg-white p-3 rounded-lg border border-indigo-200">Silakan unggah Master Audio di atas terlebih dahulu.</div>
                  ) : (
                    <>
                      <audio id={\`audio-player-\${qIndex}\`} src={quizAudioUrl} controls className="w-full h-10 mb-4" />
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                          <button 
                            type="button"
                            onClick={() => {
                              const audioEl = document.getElementById(\`audio-player-\${qIndex}\`);
                              if(audioEl) {
                                const newQ = [...questions];
                                newQ[qIndex].audioStartTime = parseFloat(audioEl.currentTime.toFixed(1));
                                setQuestions(newQ);
                              }
                            }}
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Scissors className="w-3.5 h-3.5" /> 1. Set Mulai di Sini
                          </button>
                          <input type="number" step="0.1" value={q.audioStartTime ?? ''} onChange={(e) => {
                            const newQ = [...questions];
                            newQ[qIndex].audioStartTime = parseFloat(e.target.value);
                            setQuestions(newQ);
                          }} className="w-full text-sm p-2 border border-indigo-200 rounded-lg text-center font-bold text-stone-700 focus:outline-none focus:border-indigo-500" placeholder="0.0" />
                        </div>

                        <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                          <button 
                            type="button"
                            onClick={() => {
                              const audioEl = document.getElementById(\`audio-player-\${qIndex}\`);
                              if(audioEl) {
                                const newQ = [...questions];
                                newQ[qIndex].audioEndTime = parseFloat(audioEl.currentTime.toFixed(1));
                                setQuestions(newQ);
                              }
                            }}
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Scissors className="w-3.5 h-3.5" /> 2. Set Selesai di Sini
                          </button>
                          <input type="number" step="0.1" value={q.audioEndTime ?? ''} onChange={(e) => {
                            const newQ = [...questions];
                            newQ[qIndex].audioEndTime = parseFloat(e.target.value);
                            setQuestions(newQ);
                          }} className="w-full text-sm p-2 border border-indigo-200 rounded-lg text-center font-bold text-stone-700 focus:outline-none focus:border-indigo-500" placeholder="10.5" />
                        </div>
                      </div>

                      {(q.audioStartTime !== undefined && q.audioEndTime !== undefined) && (
                        <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-sm flex items-center justify-between">
                          <div className="text-xs font-bold flex items-center gap-2">
                            <Headphones className="w-4 h-4" />
                            Preview Hasil: \${q.audioStartTime}s - \${q.audioEndTime}s
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const audioEl = document.getElementById(\`audio-player-\${qIndex}\`);
                              if(audioEl) {
                                audioEl.currentTime = q.audioStartTime;
                                audioEl.play();
                                
                                const stopAudio = () => {
                                  if (audioEl.currentTime >= q.audioEndTime) {
                                    audioEl.pause();
                                    audioEl.removeEventListener('timeupdate', stopAudio);
                                  }
                                };
                                audioEl.addEventListener('timeupdate', stopAudio);
                              }
                            }}
                            className="bg-white text-indigo-700 hover:bg-indigo-50 text-xs px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shadow-sm"
                          >
                            ▶️ Putar
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, intuitiveEditor);
  fs.writeFileSync(file, content);
  console.log('Successfully upgraded the intuitive editor!');
} else {
  console.log('Could not find the target string. Maybe it was modified?');
}

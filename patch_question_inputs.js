const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the audio upload block for normal listening with a condition
const uploadBlock = `{quizType === 'LISTENING' && (
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-stone-500 mb-1.5">Audio Soal (MP3)</label>
                            {q.audioUrl ? (
                              <div className="flex items-center gap-2 p-2 border border-stone-200 rounded-xl bg-stone-50">
                                <AudioPlayer src={q.audioUrl} className="flex-1" />
                                <button onClick={() => updateQuestion(qIndex, 'audioUrl', '')} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-stone-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition cursor-pointer group">
                                <Headphones className="w-4 h-4 text-stone-400 group-hover:text-indigo-500" />
                                <span className="text-xs font-bold text-stone-500 group-hover:text-indigo-600">Unggah Audio</span>
                                <input
                                  type="file"
                                  accept="audio/mp3,audio/mpeg"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('audio', file);
                                    const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
                                    const data = await res.json();
                                    if (res.ok) updateQuestion(qIndex, 'audioUrl', data.url);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )}`;

const newBlock = `{quizType === 'LISTENING' && (
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-stone-500 mb-1.5">Audio Soal (MP3)</label>
                            {q.audioUrl ? (
                              <div className="flex items-center gap-2 p-2 border border-stone-200 rounded-xl bg-stone-50">
                                <AudioPlayer src={q.audioUrl} className="flex-1" />
                                <button onClick={() => updateQuestion(qIndex, 'audioUrl', '')} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-stone-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition cursor-pointer group">
                                <Headphones className="w-4 h-4 text-stone-400 group-hover:text-indigo-500" />
                                <span className="text-xs font-bold text-stone-500 group-hover:text-indigo-600">Unggah Audio</span>
                                <input
                                  type="file"
                                  accept="audio/mp3,audio/mpeg"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('audio', file);
                                    const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
                                    const data = await res.json();
                                    if (res.ok) updateQuestion(qIndex, 'audioUrl', data.url);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                        {quizType === 'LISTENING_AUTO' && (
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-stone-500 mb-1.5">Mulai (Detik)</label>
                              <input type="number" min="0" step="1" value={q.audioStartTime ?? ''} onChange={(e) => updateQuestion(qIndex, 'audioStartTime', Number(e.target.value))} className="w-full text-xs p-2 border border-[#E8E2D2] rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-[#FDFBF7]" placeholder="Contoh: 0" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-stone-500 mb-1.5">Selesai (Detik)</label>
                              <input type="number" min="0" step="1" value={q.audioEndTime ?? ''} onChange={(e) => updateQuestion(qIndex, 'audioEndTime', Number(e.target.value))} className="w-full text-xs p-2 border border-[#E8E2D2] rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-[#FDFBF7]" placeholder="Contoh: 15" />
                            </div>
                            {(q.audioStartTime !== undefined && q.audioEndTime !== undefined && quizAudioUrl) && (
                              <div className="col-span-2 text-[10px] text-stone-500 bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center justify-between">
                                <span>Preview Potongan:</span>
                                <audio controls src={\`\${quizAudioUrl}#t=\${q.audioStartTime},\${q.audioEndTime}\`} className="h-6 w-32" />
                              </div>
                            )}
                          </div>
                        )}`;

if (content.includes(uploadBlock)) {
  content = content.replace(uploadBlock, newBlock);
} else {
  console.log('Upload block not found, might need manual search');
}

fs.writeFileSync(file, content);
console.log('Patched question inputs');

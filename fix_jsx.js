const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                  <div className="space-y-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className={\`flex items-center gap-3 p-2 rounded-xl border \${opt.isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-[#E8E2D2] bg-white'}\`}>
                        <input 
                          type="radio" 
                          name={\`correct-\${qIndex}\`}
                          checked={opt.isCorrect}
                          onChange={() => setCorrectOption(qIndex, optIndex)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        
                          <input 
                            type="text" 
                            value={opt.optionText || ''}
                            onChange={e => updateOptionText(qIndex, optIndex, e.target.value)}
                            onPaste={(e) => handleOptionPaste(qIndex, optIndex, e)}
                            placeholder={\`Pilihan \${String.fromCharCode(65 + optIndex)} (Tekan Ctrl+V untuk Paste Gambar)\`}
                            className="flex-1 bg-transparent border-none text-xs focus:ring-0 text-stone-900 outline-none"
                          />
                        </div>
                        {opt.imageUrl && (
                          <div className="mt-2 ml-7 relative inline-block">
                            <img src={opt.imageUrl} alt="Option Image" className="h-16 object-contain border rounded shadow-sm" />
                            <button onClick={() => removeOptionImage(qIndex, optIndex)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                    ))}
                  </div>`;

const replacement = `                  <div className="space-y-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className={\`flex flex-col p-2 rounded-xl border \${opt.isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-[#E8E2D2] bg-white'}\`}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name={\`correct-\${qIndex}\`}
                            checked={opt.isCorrect}
                            onChange={() => setCorrectOption(qIndex, optIndex)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <input 
                            type="text" 
                            value={opt.optionText || ''}
                            onChange={e => updateOptionText(qIndex, optIndex, e.target.value)}
                            onPaste={(e) => handleOptionPaste(qIndex, optIndex, e)}
                            placeholder={\`Pilihan \${String.fromCharCode(65 + optIndex)} (Tekan Ctrl+V untuk Paste Gambar)\`}
                            className="flex-1 bg-transparent border-none text-xs focus:ring-0 text-stone-900 outline-none"
                          />
                        </div>
                        {opt.imageUrl && (
                          <div className="mt-2 ml-7 relative inline-block self-start">
                            <img src={opt.imageUrl} alt="Option Image" className="h-16 object-contain border rounded shadow-sm" />
                            <button onClick={() => removeOptionImage(qIndex, optIndex)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Fixed JSX block');

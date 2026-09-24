const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add upload audio handler
const uploadAudioFunc = `
  const handleAudioUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Gagal mengunggah audio');
    const data = await res.json();
    return data.url;
  };
`;

// Insert after handleSubmit definition
content = content.replace('const handleSubmit = async () => {', uploadAudioFunc + '\n  const handleSubmit = async () => {');

// 2. Add handleOptionPaste
const optionPasteFunc = `
  const handleOptionPaste = (qIndex: number, optIndex: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64String = event.target?.result as string;
            const newQ = [...questions];
            newQ[qIndex].options[optIndex].imageUrl = base64String;
            setQuestions(newQ);
          };
          reader.readAsDataURL(blob);
          e.preventDefault();
        }
      }
    }
  };
  
  const removeOptionImage = (qIndex: number, optIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].options[optIndex].imageUrl = undefined;
    setQuestions(newQ);
  };
`;
content = content.replace('const updateOptionText = (qIndex: number, optIndex: number, text: string) => {', optionPasteFunc + '\n  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {');

// 3. Quiz Level Audio UI
const quizAudioUI = `
          {quizType === 'LISTENING' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Headphones className="w-4 h-4 text-cyan-600" />
                Audio Utama Kuis (Opsional)
              </h3>
              <div className="flex items-center gap-4">
                {quizAudioUrl && (
                  <audio controls src={quizAudioUrl} className="h-10" />
                )}
                <label className="cursor-pointer px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-bold rounded-xl border border-cyan-200 transition">
                  {quizAudioUrl ? 'Ganti Audio' : 'Upload File MP3'}
                  <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNotification(null);
                      try {
                        const url = await handleAudioUpload(e.target.files[0]);
                        setQuizAudioUrl(url);
                        setNotification({ type: 'success', message: 'Audio utama berhasil diunggah' });
                      } catch(err) {
                        setNotification({ type: 'error', message: 'Gagal mengunggah audio' });
                      }
                    }
                  }} />
                </label>
                {quizAudioUrl && (
                  <button onClick={() => setQuizAudioUrl('')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
`;
content = content.replace('{/* Daftar Pertanyaan */}', quizAudioUI + '\n        {/* Daftar Pertanyaan */}');

// 4. Question Level Audio UI
const questionAudioUI = `
                  {quizType === 'LISTENING' && (
                    <div className="mt-3">
                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <Headphones className="w-4 h-4 text-slate-400" />
                        {q.audioUrl && (
                          <audio controls src={q.audioUrl} className="h-8 max-w-[200px]" />
                        )}
                        <label className="cursor-pointer text-xs font-bold text-cyan-600 hover:text-cyan-700">
                          {q.audioUrl ? 'Ganti Audio' : '+ Tambah Audio Spesifik Soal'}
                          <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              try {
                                const url = await handleAudioUpload(e.target.files[0]);
                                const newQ = [...questions];
                                newQ[qIndex].audioUrl = url;
                                setQuestions(newQ);
                              } catch(err) {
                                alert('Gagal unggah audio soal');
                              }
                            }
                          }} />
                        </label>
                        {q.audioUrl && (
                          <button onClick={() => {
                            const newQ = [...questions];
                            newQ[qIndex].audioUrl = undefined;
                            setQuestions(newQ);
                          }} className="text-red-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
`;
content = content.replace('<textarea \n                    value={q.questionText}', questionAudioUI + '\n                  <textarea \n                    value={q.questionText}');

// 5. Option Image UI
const optionImageUI = `
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
`;
// Replace the existing <input type="text"> for options
content = content.replace(/<input \n\s*type="text" \n\s*value=\{opt\.optionText \|\| ''\}\n\s*onChange=\{e => updateOptionText\(qIndex, optIndex, e\.target\.value\)\}\n\s*placeholder=\{`Pilihan \$\{String\.fromCharCode\(65 \+ optIndex\)\}`\}\n\s*className="flex-1 bg-transparent border-none text-xs focus:ring-0 text-stone-900 outline-none"\n\s*\/>\n\s*<\/div>/g, optionImageUI);

fs.writeFileSync(file, content);
console.log('Patch applied successfully!');

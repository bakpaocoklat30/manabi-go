const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. The old listening question audio upload block
const oldQuestionAudio = `{quizType === 'LISTENING' && (
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
              )}`;

const newQuestionAudio = `{quizType === 'LISTENING' && (
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
                <div className="mb-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Mulai (Detik)</label>
                    <input type="number" min="0" step="1" value={q.audioStartTime ?? ''} onChange={(e) => {
                      const newQ = [...questions];
                      newQ[qIndex].audioStartTime = Number(e.target.value);
                      setQuestions(newQ);
                    }} className="w-full text-xs p-2 border border-[#E8E2D2] rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-[#FDFBF7]" placeholder="Contoh: 0" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Selesai (Detik)</label>
                    <input type="number" min="0" step="1" value={q.audioEndTime ?? ''} onChange={(e) => {
                      const newQ = [...questions];
                      newQ[qIndex].audioEndTime = Number(e.target.value);
                      setQuestions(newQ);
                    }} className="w-full text-xs p-2 border border-[#E8E2D2] rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-[#FDFBF7]" placeholder="Contoh: 15" />
                  </div>
                  {(q.audioStartTime !== undefined && q.audioEndTime !== undefined && quizAudioUrl) && (
                    <div className="col-span-2 text-[10px] text-stone-500 bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center justify-between">
                      <span className="font-bold text-indigo-600">Preview Potongan:</span>
                      <audio controls src={\`\${quizAudioUrl}#t=\${q.audioStartTime},\${q.audioEndTime}\`} className="h-6 w-48" />
                    </div>
                  )}
                </div>
              )}`;

content = content.replace(oldQuestionAudio, newQuestionAudio);

// 2. Question type switcher (ESSAY vs MC)
content = content.replace(
  "{quizType === 'LISTENING' && (",
  "{(quizType === 'LISTENING' || quizType === 'LISTENING_AUTO') && ("
);

// 3. Option labels
content = content.replace(
  "quizType === 'LISTENING'\n                      ? 'Opsi Jawaban Listening (Teks / Gambar - Tandai yang Benar)'",
  "(quizType === 'LISTENING' || quizType === 'LISTENING_AUTO')\n                      ? 'Opsi Jawaban Listening (Teks / Gambar - Tandai yang Benar)'"
);

// 4. Add Question button
content = content.replace(
  "quizType === 'LISTENING'\n            ? 'hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50'",
  "(quizType === 'LISTENING' || quizType === 'LISTENING_AUTO')\n            ? 'hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'"
);
content = content.replace(
  "{quizType === 'LISTENING' ? '+ Tambah Soal Listening Baru' : '+ Tambah Soal Baru'}",
  "{(quizType === 'LISTENING' || quizType === 'LISTENING_AUTO') ? '+ Tambah Soal Listening Baru' : '+ Tambah Soal Baru'}"
);
content = content.replace(
  "quizType === 'LISTENING' ? 'bg-cyan-600' : quizType === 'ESSAY' ? 'bg-emerald-600' : 'bg-purple-600'",
  "(quizType === 'LISTENING' || quizType === 'LISTENING_AUTO') ? 'bg-indigo-600' : quizType === 'ESSAY' ? 'bg-emerald-600' : 'bg-purple-600'"
);

// Update main audio uploader in builder (the one that says "Audio Utama Kuis (Opsional)")
const oldMainAudio = `{quizType === 'LISTENING' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D2] shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2 mb-4">
            <Headphones className="w-4 h-4 text-cyan-600" />
            Audio Utama Kuis (Opsional)
          </h3>
          <div className="flex items-center gap-4">
            {quizAudioUrl && (
              <AudioPlayer src={quizAudioUrl} className="h-10 max-w-xs" />
            )}
            <label className="cursor-pointer px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-bold rounded-xl border border-cyan-200 transition">
              {quizAudioUrl ? 'Ganti Audio' : 'Upload File MP3'}
              <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  setNotification(null);
                  try {
                    const formData = new FormData();
                    formData.append('file', e.target.files[0]);
                    const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
                    if (!res.ok) throw new Error('Gagal');
                    const data = await res.json();
                    setQuizAudioUrl(data.url);
                  } catch (err) {
                    setNotification({ type: 'error', message: 'Gagal mengunggah audio utama.' });
                  }
                }
              }} />
            </label>
            {quizAudioUrl && (
              <button onClick={() => setQuizAudioUrl('')} className="p-2 text-stone-400 hover:text-red-500 transition">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-3">Audio ini akan diputar di bagian atas halaman kuis secara global (bukan per soal).</p>
        </div>
      )}`;

content = content.replace(oldMainAudio, oldMainAudio + "\n      {/* (New Master Audio for AUTO is already added) */}");

fs.writeFileSync(file, content);
console.log('Final patch for Builder LISTENING_AUTO applied!');

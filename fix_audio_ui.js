const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `{/* Daftar Soal */}`;

const replacement = `{quizType === 'LISTENING' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D2] shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2 mb-4">
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
                    const formData = new FormData();
                    formData.append('file', e.target.files[0]);
                    const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
                    if (!res.ok) throw new Error('Gagal');
                    const data = await res.json();
                    setQuizAudioUrl(data.url);
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

      {/* Daftar Soal */}`;

if (!content.includes("Audio Utama Kuis")) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Injected quizAudioUI');
}

// And questionAudioUI
const qTarget = `              <div className="mb-2">
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Gambar (Opsional)</label>`;

const qReplacement = `              {quizType === 'LISTENING' && (
                <div className="mb-2">
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Audio Soal (Opsional)</label>
                  <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <Headphones className="w-4 h-4 text-stone-400" />
                    {q.audioUrl && (
                      <audio controls src={q.audioUrl} className="h-8 max-w-[200px]" />
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

              <div className="mb-2">
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Gambar (Opsional)</label>`;

if (!content.includes("Audio Soal (Opsional)")) {
  content = content.replace(qTarget, qReplacement);
  fs.writeFileSync(file, content);
  console.log('Injected questionAudioUI');
}


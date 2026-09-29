const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Default title
content = content.replace(
  "const defaultTitle = quizType === 'LISTENING'",
  "const defaultTitle = quizType === 'LISTENING_AUTO'\n    ? 'Kuis Listening (Potong Otomatis)'\n    : quizType === 'LISTENING'"
);

// 2. Question Interface
content = content.replace(
  "audioUrl?: string;",
  "audioUrl?: string;\n  audioStartTime?: number;\n  audioEndTime?: number;"
);

// 3. Quiz Header (Save button colors etc)
// Add color for LISTENING_AUTO
content = content.replace(
  "quizType === 'LISTENING'",
  "(quizType === 'LISTENING' || quizType === 'LISTENING_AUTO')"
);

// 4. Master Audio upload block
const masterAudioTarget = `{/* Pengaturan Kuis */}`;
const masterAudioBlock = `
      {quizType === 'LISTENING_AUTO' && (
        <div className="bg-white border border-[#E8E2D2] rounded-2xl p-6 shadow-sm space-y-4 mb-6">
          <h3 className="text-sm font-bold text-stone-900 border-b border-[#E8E2D2] pb-2">Master Audio</h3>
          <p className="text-xs text-stone-500">Unggah satu file audio utuh. File ini akan dipotong secara otomatis sesuai durasi tiap butir soal yang Anda tentukan di bawah.</p>
          
          <div className="mt-4">
            {quizAudioUrl ? (
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex flex-col gap-3">
                <AudioPlayer src={quizAudioUrl} />
                <button onClick={() => setQuizAudioUrl('')} className="self-end text-xs font-bold text-red-500 hover:text-red-700">Hapus Master Audio</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer group">
                <Headphones className="w-8 h-8 text-stone-400 group-hover:text-indigo-500 mb-2" />
                <span className="text-xs font-bold text-stone-600 group-hover:text-indigo-600">Klik untuk unggah Master Audio</span>
                <span className="text-[10px] text-stone-400 mt-1">Format: MP3 (Maks 15MB)</span>
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
                    if (res.ok) setQuizAudioUrl(data.url);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Pengaturan Kuis */}`;

content = content.replace(masterAudioTarget, masterAudioBlock);

fs.writeFileSync(file, content);
console.log('Builder patched for LISTENING_AUTO defaults and master audio');

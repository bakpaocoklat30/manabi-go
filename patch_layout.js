const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the sticky header's Save button
const oldSaveButton = `<button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Simpan Kuis</span>
        </button>`;
content = content.replace(oldSaveButton, "");

// 2. Replace the advanced settings layout
const oldSettingsTarget = `<div className="md:col-span-3 flex gap-6">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
              <input type="checkbox" checked={randomizeOptions} onChange={e => setRandomizeOptions(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
              Acak Urutan Opsi
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
              <input type="checkbox" checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
              Acak Urutan Soal
            </label>

            <div className="flex flex-col">
              <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Anti-Cheat (Deteksi Tab)</label>
              <select value={antiCheatMode} onChange={e => setAntiCheatMode(e.target.value)} className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:border-purple-500">
                <option value="OFF">Mati (Bebas Pindah Tab)</option>
                <option value="WARNING">Peringatan & Dicatat</option>
                <option value="AUTO_SUBMIT">Kumpul Otomatis (3x Pindah)</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Tinjauan Hasil</label>
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} className="rounded border-stone-300 text-purple-600 focus:ring-purple-600" />
                <span className="text-xs font-bold text-stone-700">Tampilkan Jawaban Benar Setelah Selesai</span>
              </label>
            </div>
            
            <div className="flex flex-col">
              <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Ujian Ulang (Retake)</label>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={allowRetake} onChange={(e) => setAllowRetake(e.target.checked)} className="rounded border-stone-300 text-purple-600 focus:ring-purple-600" />
                <span className="text-xs font-bold text-stone-700">Izinkan Siswa Mengulang Kuis</span>
              </label>
              {allowRetake && (
                <div className="pl-6">
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Maksimal Pengulangan (termasuk percobaan pertama)</label>
                  <input 
                    type="number" min="1" max="10" 
                    value={maxRetakes} 
                    onChange={(e) => setMaxRetakes(Number(e.target.value))} 
                    className="w-full text-xs p-2 border border-[#E8E2D2] bg-[#FDFBF7] rounded-xl font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>

          </div>`;

const newSettingsLayout = `<div className="md:col-span-3 mt-2 flex flex-col md:flex-row gap-4 items-start">
            <details className="flex-1 group border border-[#E8E2D2] rounded-xl bg-[#FDFBF7] overflow-hidden [&_summary::-webkit-details-marker]:hidden w-full shadow-sm">
              <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-xs text-stone-800 hover:bg-stone-100 transition select-none">
                <span className="flex items-center gap-2">⚙️ Pengaturan Lanjutan Kuis</span>
                <ChevronDown className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-5 border-t border-[#E8E2D2] bg-white grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                      <input type="checkbox" checked={randomizeOptions} onChange={e => setRandomizeOptions(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                      Acak Urutan Opsi
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                      <input type="checkbox" checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                      Acak Urutan Soal
                    </label>
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-2">Anti-Cheat (Deteksi Tab)</label>
                    <select value={antiCheatMode} onChange={e => setAntiCheatMode(e.target.value)} className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:border-purple-500">
                      <option value="OFF">Mati (Bebas Pindah Tab)</option>
                      <option value="WARNING">Peringatan & Dicatat</option>
                      <option value="AUTO_SUBMIT">Kumpul Otomatis (3x Pindah)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-2">Tinjauan Hasil</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} className="rounded border-stone-300 text-purple-600 focus:ring-purple-600 w-4 h-4" />
                      <span className="text-xs font-bold text-stone-700">Tampilkan Jawaban Benar Setelah Selesai</span>
                    </label>
                  </div>
                  
                  <div className="flex flex-col border-t border-dashed border-[#E8E2D2] pt-4 mt-2">
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-2">Ujian Ulang (Retake)</label>
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input type="checkbox" checked={allowRetake} onChange={(e) => setAllowRetake(e.target.checked)} className="rounded border-stone-300 text-purple-600 focus:ring-purple-600 w-4 h-4" />
                      <span className="text-xs font-bold text-stone-700">Izinkan Siswa Mengulang Kuis</span>
                    </label>
                    {allowRetake && (
                      <div className="pl-6">
                        <label className="block text-[10px] font-bold text-stone-500 mb-1.5">Maks. Pengulangan (Termasuk awal)</label>
                        <input 
                          type="number" min="1" max="10" 
                          value={maxRetakes} 
                          onChange={(e) => setMaxRetakes(Number(e.target.value))} 
                          className="w-full text-xs p-2.5 border border-[#E8E2D2] bg-[#FDFBF7] rounded-xl font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </details>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 h-[50px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Kuis</span>
            </button>
          </div>`;

if (!content.includes('Pengaturan Lanjutan Kuis')) {
  content = content.replace(oldSettingsTarget, newSettingsLayout);
  fs.writeFileSync(file, content);
  console.log('Layout patched successfully.');
} else {
  console.log('Layout already patched.');
}


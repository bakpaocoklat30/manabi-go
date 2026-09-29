const fs = require('fs');
const file = 'src/app/guru/builder/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldListeningBtn = `<Link 
              href={\`/guru/builder/\${moduleId}/quiz?type=LISTENING\`}
              className="flex items-center gap-3 p-4 bg-[#FDFBF7] hover:bg-cyan-50 border border-[#E8E2D2] hover:border-cyan-200 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-stone-700 group-hover:text-cyan-700">Buat Kuis Listening</span>
                <span className="text-xs text-stone-500">Soal mendengarkan audio Bahasa Jepang</span>
              </div>
            </Link>`;

const newListeningBtns = `${oldListeningBtn}
            
            <Link 
              href={\`/guru/builder/\${moduleId}/quiz?type=LISTENING_AUTO\`}
              className="flex items-center gap-3 p-4 bg-[#FDFBF7] hover:bg-indigo-50 border border-[#E8E2D2] hover:border-indigo-200 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <Scissors className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-stone-700 group-hover:text-indigo-700">Buat Kuis Listening (Potong Otomatis)</span>
                <span className="text-xs text-stone-500">Upload 1 master audio lalu potong per detik</span>
              </div>
            </Link>`;

if (!content.includes('LISTENING_AUTO')) {
  content = content.replace(oldListeningBtn, newListeningBtns);
  // Add Scissors to lucide imports
  content = content.replace("Headphones,", "Headphones, Scissors,");
  fs.writeFileSync(file, content);
  console.log('Added LISTENING_AUTO menu button');
}

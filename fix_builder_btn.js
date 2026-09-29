const fs = require('fs');
const file = 'src/app/guru/builder/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<Link\s+href=\{\`\/guru\/builder\/\$\{moduleId\}\/quiz\?type=LISTENING\`\}\s+className="inline-flex items-center gap-1\.5 px-3 py-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 text-\[11px\] font-bold rounded-xl transition-all shadow-sm"\s+>\s+<Headphones className="w-3\.5 h-3\.5" \/>\s+<span>Buat Kuis Listening<\/span>\s+<\/Link>/g;

const newBtns = `<Link
            href={\`/guru/builder/\${moduleId}/quiz?type=LISTENING\`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 text-[11px] font-bold rounded-xl transition-all shadow-sm"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Buat Kuis Listening</span>
          </Link>
          <Link
            href={\`/guru/builder/\${moduleId}/quiz?type=LISTENING_AUTO\`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold rounded-xl transition-all shadow-sm"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Kuis Listening (Auto-Cut)</span>
          </Link>`;

if (regex.test(content)) {
  content = content.replace(regex, newBtns);
  
  if (!content.includes('Scissors,')) {
    content = content.replace('Headphones,', 'Headphones, Scissors,');
  }
  
  fs.writeFileSync(file, content);
  console.log('Button added successfully.');
} else {
  console.log('Could not find the target button.');
}

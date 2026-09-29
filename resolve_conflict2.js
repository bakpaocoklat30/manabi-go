const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix imports
const importConflict = /<<<<<<< HEAD\n\s*ArrowLeft, Plus, Trash2, Loader2, Save, X, Headphones, CheckCircle2, AlertCircle, HelpCircle, ImageIcon, Pencil, CheckSquare\n=======\n\s*ArrowLeft, Plus, Trash2, Loader2, Save, X, Headphones, CheckCircle2, AlertCircle, HelpCircle, ChevronDown\n>>>>>>> 799b855[^\n]*\n/g;

content = content.replace(importConflict, '  ArrowLeft, Plus, Trash2, Loader2, Save, X, Headphones, CheckCircle2, AlertCircle, HelpCircle, ImageIcon, Pencil, CheckSquare, ChevronDown\n');

// 2. Fix sticky button conflict
const buttonConflict = /<<<<<<< HEAD\n\s*<button[\s\S]*?<\/button>\n=======\n\s*\n>>>>>>> 799b855[^\n]*\n/g;
content = content.replace(buttonConflict, '\n');

// 3. Update the moved save button to have dynamic colors
const movedButtonOld = `className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 h-[50px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start"`;
const movedButtonNew = `className={\`flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 h-[50px] text-white text-xs font-bold rounded-xl shadow-md transition-all self-start \${
              quizType === 'LISTENING'
                ? 'bg-cyan-600 hover:bg-cyan-700'
                : quizType === 'ESSAY'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }\`}`;

content = content.replace(movedButtonOld, movedButtonNew);

fs.writeFileSync(file, content);
console.log('Conflict 2 resolved.');

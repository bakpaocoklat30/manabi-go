const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldHeader = `{quizType === 'LISTENING' ? (
                <>
                  <Headphones className="w-5 h-5 text-cyan-600" />
                  <span>Kuis Listening / Choukai</span>
                </>
              ) : quizType === 'ESSAY' ? (`;

const newHeader = `{quizType === 'LISTENING_AUTO' ? (
                <>
                  <Scissors className="w-5 h-5 text-indigo-600" />
                  <span>Kuis Listening (Potong Otomatis)</span>
                </>
              ) : quizType === 'LISTENING' ? (
                <>
                  <Headphones className="w-5 h-5 text-cyan-600" />
                  <span>Kuis Listening / Choukai</span>
                </>
              ) : quizType === 'ESSAY' ? (`;

content = content.replace(oldHeader, newHeader);

// Also check description below it
const oldDesc = `{quizType === 'LISTENING'
                ? 'Buat soal evaluasi dengan format audio.'
                : quizType === 'ESSAY'
                ? 'Siswa menjawab dengan teks dan dikoreksi oleh AI.'
                : 'Buat soal evaluasi untuk mengukur pemahaman siswa.'}`;

const newDesc = `{(quizType === 'LISTENING' || quizType === 'LISTENING_AUTO')
                ? 'Buat soal evaluasi dengan format audio.'
                : quizType === 'ESSAY'
                ? 'Siswa menjawab dengan teks dan dikoreksi oleh AI.'
                : 'Buat soal evaluasi untuk mengukur pemahaman siswa.'}`;

content = content.replace(oldDesc, newDesc);

fs.writeFileSync(file, content);
console.log('Fixed page header for LISTENING_AUTO');

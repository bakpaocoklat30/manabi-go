const fs = require('fs');
const file = 'src/app/guru/builder/[id]/quiz/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "formData.append('audio', file);",
  "formData.append('file', file);"
);

// Add basic error/success notification since we have setNotification
content = content.replace(
  "if (res.ok) setQuizAudioUrl(data.url);",
  "if (res.ok) {\n                      setQuizAudioUrl(data.url);\n                      setNotification({ type: 'success', message: 'Master Audio berhasil diunggah!' });\n                    } else {\n                      setNotification({ type: 'error', message: 'Gagal mengunggah Master Audio.' });\n                    }"
);

fs.writeFileSync(file, content);
console.log('Fixed master audio upload key.');

const fs = require('fs');
const file = 'prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');

const target = "audioUrl     String?   @db.Text // Audio khusus butir soal ini";
const replacement = "audioUrl     String?   @db.Text // Audio khusus butir soal ini\n  audioStartTime Float?\n  audioEndTime   Float?";

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log('Schema patched successfully.');
} else {
    console.log('Could not find the target string in schema.');
}

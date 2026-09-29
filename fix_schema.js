const fs = require('fs');
const file = 'prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("  audioStartTime   Float?\n  audioEndTime     Float?\n", "");

const qModel = "model Question {";
content = content.replace(
  "audioUrl        String?      @db.Text",
  "audioUrl        String?      @db.Text\n  audioStartTime  Float?\n  audioEndTime    Float?"
);

fs.writeFileSync(file, content);

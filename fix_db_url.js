const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.taskSubmission.findMany({
    include: { student: true }
  });

  let fixed = 0;
  for (const sub of subs) {
    if (sub.driveFileUrl.includes('drive.google.com')) {
      const dirPath = path.join(__dirname, 'public', 'uploads', sub.student.kelasId, sub.moduleItemId);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        const matchingFile = files.find(f => f.startsWith(sub.student.identifier + '_'));
        if (matchingFile) {
          const localUrl = "/uploads/" + sub.student.kelasId + "/" + sub.moduleItemId + "/" + matchingFile;
          await prisma.taskSubmission.update({
            where: { id: sub.id },
            data: { driveFileUrl: localUrl }
          });
          fixed++;
        }
      }
    }
  }
  console.log("Fixed " + fixed + " submissions back to local URLs.");
}

main().catch(console.error).finally(() => prisma.$disconnect());

import fs from 'fs';
import path from 'path';

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

console.log('Copying public folder to .next/standalone/public...');
copyFolderSync('public', '.next/standalone/public');

console.log('Copying .next/static folder to .next/standalone/.next/static...');
copyFolderSync('.next/static', '.next/standalone/.next/static');

console.log('Static assets copied successfully!');

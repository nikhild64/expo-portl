import fs from 'fs';
import path from 'path';

function renameFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      renameFiles(fullPath);
    } else if (file.endsWith('.test.ts')) {
      const newPath = path.join(dir, file.replace('.test.ts', '.jest.ts'));
      fs.renameSync(fullPath, newPath);
      console.log(`Renamed: ${fullPath} -> ${newPath}`);
    } else if (file.endsWith('.test.tsx')) {
      const newPath = path.join(dir, file.replace('.test.tsx', '.jest.tsx'));
      fs.renameSync(fullPath, newPath);
      console.log(`Renamed: ${fullPath} -> ${newPath}`);
    }
  }
}

console.log('Renaming test files under src/ ...');
renameFiles(path.join(process.cwd(), 'src'));
console.log('Renaming completed successfully!');

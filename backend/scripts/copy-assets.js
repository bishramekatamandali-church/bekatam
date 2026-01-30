/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const copyRecursiveSync = (src, dest) => {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
};

const srcAssets = path.resolve(__dirname, '..', 'assets');
const destAssets = path.resolve(__dirname, '..', 'dist', 'assets');

copyRecursiveSync(srcAssets, destAssets);
console.log('Copied assets ->', destAssets);

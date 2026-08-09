import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), '..');
const outputDir = path.join(rootDir, '.netlify-dist');

const publicEntries = [
  'index.html',
  'pages',
  'css',
  'js',
  'img',
  'docs',
  'data',
  'robots.txt',
  'sitemap.xml',
  '_headers'
];

for (const entry of publicEntries) {
  if (!fs.existsSync(path.join(rootDir, entry))) {
    throw new Error(`Arquivo público obrigatório ausente: ${entry}`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const entry of publicEntries) {
  fs.cpSync(path.join(rootDir, entry), path.join(outputDir, entry), {
    recursive: true,
    preserveTimestamps: true
  });
}

const forbiddenEntries = ['.pages.yml', 'scripts', 'tests', 'package.json', 'netlify.toml'];
for (const entry of forbiddenEntries) {
  if (fs.existsSync(path.join(outputDir, entry))) {
    throw new Error(`Arquivo interno incluído no artefato público: ${entry}`);
  }
}

const pdfCount = fs.readdirSync(path.join(outputDir, 'docs'), { recursive: true })
  .filter(entry => entry.toLowerCase().endsWith('.pdf')).length;

if (pdfCount !== 31) {
  throw new Error(`Artefato público deveria conter 31 PDFs, mas contém ${pdfCount}.`);
}

console.log(`Artefato do Netlify preparado em .netlify-dist (${pdfCount} PDFs).`);

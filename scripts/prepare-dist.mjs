import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), '..');
const outputDir = path.join(rootDir, '.cpanel-dist');

const publicEntries = [
  'index.html',
  'pages',
  'css/reset.css',
  'css/style.css',
  'css/variables.css',
  'js/main.js',
  'js/transparencia.js',
  'img',
  'docs',
  'data',
  'robots.txt',
  'sitemap.xml',
  'apache/.htaccess'
];

for (const entry of publicEntries) {
  if (!fs.existsSync(path.join(rootDir, entry))) {
    throw new Error(`Arquivo público obrigatório ausente: ${entry}`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const entry of publicEntries) {
  const destination = entry === 'apache/.htaccess' ? '.htaccess' : entry;
  fs.mkdirSync(path.dirname(path.join(outputDir, destination)), { recursive: true });
  fs.cpSync(path.join(rootDir, entry), path.join(outputDir, destination), {
    recursive: true,
    preserveTimestamps: true
  });
}

fs.cpSync(path.join(rootDir, 'apache', 'data.htaccess'), path.join(outputDir, 'data', '.htaccess'));
fs.cpSync(path.join(rootDir, 'apache', 'docs.htaccess'), path.join(outputDir, 'docs', '.htaccess'));

const forbiddenEntries = ['admin', 'supabase', 'scripts', 'tests', 'package.json', 'netlify.toml', '.env', '.env.local', 'js/supabase-api.js', 'js/supabase-config.js'];
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

console.log(`Artefato do cPanel preparado em ${path.basename(outputDir)} (${pdfCount} PDFs).`);

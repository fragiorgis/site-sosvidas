import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), '..');
const errors = [];
const warnings = [];

function walk(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['.git', '.netlify', '.netlify-dist', 'node_modules'].includes(entry.name)) return [];
      return walk(absolute, extension);
    }
    return entry.isFile() && absolute.endsWith(extension) ? [absolute] : [];
  });
}

function cleanReference(reference) {
  return reference.split('#')[0].split('?')[0];
}

function isExternal(reference) {
  return /^(?:[a-z]+:|\/\/|#)/i.test(reference);
}

function resolveReference(sourceFile, reference) {
  const clean = cleanReference(reference);
  if (!clean) return null;

  let absolute = clean.startsWith('/')
    ? path.join(rootDir, clean.slice(1))
    : path.resolve(path.dirname(sourceFile), clean);

  if (clean.endsWith('/')) absolute = path.join(absolute, 'index.html');
  if (!path.extname(absolute) && !fs.existsSync(absolute)) absolute = `${absolute}.html`;
  return absolute;
}

function validateReference(sourceFile, reference) {
  if (!reference || isExternal(reference)) return;
  const absolute = resolveReference(sourceFile, reference);
  if (!absolute) return;

  const relativeSource = path.relative(rootDir, sourceFile);
  const relativeTarget = path.relative(rootDir, absolute);
  if (relativeTarget.startsWith('..')) {
    errors.push(`${relativeSource} referencia caminho fora do site: ${reference}`);
  } else if (!fs.existsSync(absolute)) {
    errors.push(`${relativeSource} referencia arquivo inexistente: ${reference}`);
  }
}

for (const htmlFile of walk(rootDir, '.html')) {
  const content = fs.readFileSync(htmlFile, 'utf8');
  const references = [...content.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)];
  references.forEach(match => validateReference(htmlFile, match[1]));
}

for (const cssFile of walk(path.join(rootDir, 'css'), '.css')) {
  const content = fs.readFileSync(cssFile, 'utf8');
  const references = [...content.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)];
  references.forEach(match => validateReference(cssFile, match[1].trim()));
}

const transparencyHtmlPath = path.join(rootDir, 'pages', 'transparencia.html');
const transparencyHtml = fs.readFileSync(transparencyHtmlPath, 'utf8');

if (!transparencyHtml.includes('id="documentos-transparencia"')) {
  errors.push('transparencia.html não possui o contêiner de documentos.');
}
if (!transparencyHtml.includes('type="module" src="../js/transparencia.js"')) {
  errors.push('transparencia.html não carrega o módulo de transparência.');
}
if (/href=["']\.\.\/docs\//.test(transparencyHtml)) {
  errors.push('transparencia.html ainda contém links de PDF codificados manualmente.');
}
if ((transparencyHtml.match(/id="documentos-transparencia"/g) || []).length !== 1) {
  errors.push('O contêiner de documentos deve existir exatamente uma vez.');
}

const transparencyScript = fs.readFileSync(path.join(rootDir, 'js', 'transparencia.js'), 'utf8');
if (/\.innerHTML\s*=/.test(transparencyScript)) {
  errors.push('transparencia.js não pode inserir conteúdo editorial com innerHTML.');
}

const secretPatterns = [
  { name: 'token GitHub', regex: /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/ },
  { name: 'chave privada', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'access key AWS', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'chave secreta Supabase', regex: /sb_secret_[A-Za-z0-9_-]{20,}/ },
  { name: 'service role Supabase preenchida', regex: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#]+/ }
];
const securityFiles = [
  ...walk(path.join(rootDir, 'pages'), '.html'),
  ...walk(path.join(rootDir, 'admin'), '.html'),
  ...walk(path.join(rootDir, 'js'), '.js'),
  path.join(rootDir, 'index.html'),
  path.join(rootDir, 'data', 'transparencia.json'),
  path.join(rootDir, 'netlify.toml')
];

for (const securityFile of securityFiles) {
  const content = fs.readFileSync(securityFile, 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.regex.test(content)) {
      errors.push(`${path.relative(rootDir, securityFile)} contém possível ${pattern.name}.`);
    }
  }
}

for (const required of [
  '_headers',
  'netlify.toml',
  'package.json',
  'admin/index.html',
  'css/admin.css',
  'data/transparencia.json',
  'js/admin.js',
  'js/supabase-api.js',
  'js/supabase-config.js',
  'js/transparencia.js',
  'scripts/validate-transparencia.mjs',
  'scripts/prepare-dist.mjs',
  'supabase/migrations/202608090001_transparencia.sql'
]) {
  if (!fs.existsSync(path.join(rootDir, required))) errors.push(`Arquivo obrigatório ausente: ${required}`);
}

const headers = fs.readFileSync(path.join(rootDir, '_headers'), 'utf8');
for (const header of [
  'Content-Security-Policy:',
  'Referrer-Policy:',
  'Permissions-Policy:',
  'X-Content-Type-Options:'
]) {
  if (!headers.includes(header)) errors.push(`Cabeçalho de segurança ausente: ${header}`);
}

if (!fs.existsSync(path.join(rootDir, 'robots.txt'))) warnings.push('robots.txt não encontrado.');
if (!fs.existsSync(path.join(rootDir, 'sitemap.xml'))) warnings.push('sitemap.xml não encontrado.');

const adminScript = fs.readFileSync(path.join(rootDir, 'js', 'admin.js'), 'utf8');
if (/\.innerHTML\s*=/.test(adminScript)) errors.push('admin.js não pode inserir conteúdo editorial com innerHTML.');

const supabaseConfig = fs.readFileSync(path.join(rootDir, 'js', 'supabase-config.js'), 'utf8');
if (!supabaseConfig.includes('https://csgvhdjypxufcsjvmubd.supabase.co')) {
  errors.push('Configuração pública do Supabase aponta para projeto inesperado.');
}
if (!headers.includes('https://csgvhdjypxufcsjvmubd.supabase.co')) {
  errors.push('CSP não permite conexão com o projeto Supabase configurado.');
}

warnings.forEach(warning => console.warn(`AVISO: ${warning}`));
if (errors.length > 0) {
  errors.forEach(error => console.error(`ERRO: ${error}`));
  console.error(`Validação do site reprovada com ${errors.length} erro(s).`);
  process.exitCode = 1;
} else {
  const htmlCount = walk(rootDir, '.html').length;
  console.log(`Validação do site aprovada: ${htmlCount} páginas HTML e referências locais verificadas.`);
}

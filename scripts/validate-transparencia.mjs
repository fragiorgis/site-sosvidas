import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_PDF_BYTES = 20 * 1024 * 1024;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MARKUP = /<\/?[a-z][^>]*>/i;

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), '..');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function listPdfFiles(directory, root = directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return listPdfFiles(absolute, root);
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.pdf') return [];
    return [`/${path.relative(root, absolute).split(path.sep).join('/')}`];
  });
}

function validateText(value, field, errors, { required = true, max = 500 } = {}) {
  if (typeof value !== 'string') {
    errors.push(`${field} deve ser texto.`);
    return;
  }

  const trimmed = value.trim();
  if (required && !trimmed) errors.push(`${field} é obrigatório.`);
  if (trimmed.length > max) errors.push(`${field} excede ${max} caracteres.`);
  if (MARKUP.test(trimmed)) errors.push(`${field} não pode conter HTML.`);
}

function resolvePdfPath(rootDir, publicPath) {
  const docsRoot = path.resolve(rootDir, 'docs');
  const absolute = path.resolve(rootDir, `.${publicPath}`);
  const insideDocs = absolute === docsRoot || absolute.startsWith(`${docsRoot}${path.sep}`);
  return { absolute, insideDocs };
}

function validatePdf(publicPath, context, rootDir, errors, warnings, maxPdfBytes) {
  if (typeof publicPath !== 'string' || !publicPath) {
    errors.push(`${context}.arquivo é obrigatório.`);
    return;
  }

  if (!publicPath.startsWith('/docs/')) {
    errors.push(`${context}.arquivo deve começar com /docs/.`);
    return;
  }

  if (!publicPath.toLowerCase().endsWith('.pdf')) {
    errors.push(`${context}.arquivo deve terminar com .pdf.`);
    return;
  }

  if (publicPath.includes('..') || publicPath.includes('\\') || /[?#]/.test(publicPath)) {
    errors.push(`${context}.arquivo contém caminho ou caracteres não permitidos.`);
    return;
  }

  try {
    const decoded = decodeURIComponent(publicPath);
    if (decoded.includes('..') || decoded.includes('\\')) {
      errors.push(`${context}.arquivo contém caminho codificado não permitido.`);
      return;
    }
  } catch {
    errors.push(`${context}.arquivo possui codificação inválida.`);
    return;
  }

  const { absolute, insideDocs } = resolvePdfPath(rootDir, publicPath);
  if (!insideDocs) {
    errors.push(`${context}.arquivo aponta para fora de /docs/.`);
    return;
  }

  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    errors.push(`${context}.arquivo não existe: ${publicPath}.`);
    return;
  }

  const stats = fs.statSync(absolute);
  if (stats.size === 0) errors.push(`${context}.arquivo está vazio: ${publicPath}.`);
  if (stats.size > maxPdfBytes) {
    errors.push(`${context}.arquivo excede o limite de ${Math.floor(maxPdfBytes / 1024 / 1024)} MB: ${publicPath}.`);
  } else if (stats.size > 5 * 1024 * 1024) {
    warnings.push(`${publicPath} excede o alvo recomendado de 5 MB (${(stats.size / 1024 / 1024).toFixed(1)} MB).`);
  }

  const handle = fs.openSync(absolute, 'r');
  const header = Buffer.alloc(5);
  fs.readSync(handle, header, 0, 5, 0);
  fs.closeSync(handle);
  if (header.toString('ascii') !== '%PDF-') {
    errors.push(`${context}.arquivo não possui assinatura PDF válida: ${publicPath}.`);
  }
}

export function validateTransparency(data, options = {}) {
  const rootDir = path.resolve(options.rootDir || defaultRoot);
  const maxPdfBytes = options.maxPdfBytes || MAX_PDF_BYTES;
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const referencedPdfs = new Set();
  let documentCount = 0;
  let publishedDocumentCount = 0;

  if (!isPlainObject(data)) {
    return {
      errors: ['A raiz do JSON deve ser um objeto.'],
      warnings,
      counts: { sections: 0, documents: 0, publishedDocuments: 0 }
    };
  }

  if (!Array.isArray(data.secoes)) {
    return {
      errors: ['secoes deve ser uma lista.'],
      warnings,
      counts: { sections: 0, documents: 0, publishedDocuments: 0 }
    };
  }

  data.secoes.forEach((section, sectionIndex) => {
    const sectionContext = `secoes[${sectionIndex}]`;
    if (!isPlainObject(section)) {
      errors.push(`${sectionContext} deve ser um objeto.`);
      return;
    }

    if (!UUID_V4.test(section.id || '')) errors.push(`${sectionContext}.id deve ser UUID v4 válido.`);
    else if (ids.has(section.id)) errors.push(`${sectionContext}.id está duplicado: ${section.id}.`);
    else ids.add(section.id);

    validateText(section.titulo, `${sectionContext}.titulo`, errors, { max: 140 });
    validateText(section.destaque ?? '', `${sectionContext}.destaque`, errors, { required: false, max: 60 });
    validateText(section.descricao ?? '', `${sectionContext}.descricao`, errors, { required: false, max: 1200 });

    if (section.destaque && typeof section.titulo === 'string' && !section.titulo.includes(section.destaque)) {
      errors.push(`${sectionContext}.destaque deve ser um trecho exato do título.`);
    }
    if (!Number.isInteger(section.ordem)) errors.push(`${sectionContext}.ordem deve ser número inteiro.`);
    if (typeof section.publicada !== 'boolean') errors.push(`${sectionContext}.publicada deve ser verdadeiro ou falso.`);
    if (!Array.isArray(section.documentos)) {
      errors.push(`${sectionContext}.documentos deve ser uma lista.`);
      return;
    }

    section.documentos.forEach((documentData, documentIndex) => {
      documentCount += 1;
      const context = `${sectionContext}.documentos[${documentIndex}]`;
      if (!isPlainObject(documentData)) {
        errors.push(`${context} deve ser um objeto.`);
        return;
      }

      if (!UUID_V4.test(documentData.id || '')) errors.push(`${context}.id deve ser UUID v4 válido.`);
      else if (ids.has(documentData.id)) errors.push(`${context}.id está duplicado: ${documentData.id}.`);
      else ids.add(documentData.id);

      validateText(documentData.titulo, `${context}.titulo`, errors, { max: 180 });
      validateText(documentData.descricao, `${context}.descricao`, errors, { max: 800 });
      validateText(documentData.selo ?? '', `${context}.selo`, errors, { required: false, max: 80 });
      if (!Number.isInteger(documentData.ordem)) errors.push(`${context}.ordem deve ser número inteiro.`);
      if (typeof documentData.publicado !== 'boolean') errors.push(`${context}.publicado deve ser verdadeiro ou falso.`);

      if (documentData.publicado === true) publishedDocumentCount += 1;
      if (typeof documentData.arquivo === 'string') {
        if (referencedPdfs.has(documentData.arquivo)) {
          warnings.push(`${context}.arquivo reutiliza um PDF já referenciado: ${documentData.arquivo}.`);
        }
        referencedPdfs.add(documentData.arquivo);
      }
      validatePdf(documentData.arquivo, context, rootDir, errors, warnings, maxPdfBytes);
    });
  });

  const allPdfs = listPdfFiles(path.join(rootDir, 'docs'), rootDir);
  allPdfs
    .filter(pdf => !referencedPdfs.has(pdf))
    .sort()
    .forEach(pdf => warnings.push(`PDF não referenciado no JSON: ${pdf}.`));

  return {
    errors,
    warnings,
    counts: {
      sections: data.secoes.length,
      documents: documentCount,
      publishedDocuments: publishedDocumentCount
    }
  };
}

export function validateFile(jsonPath = path.join(defaultRoot, 'data', 'transparencia.json'), options = {}) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (error) {
    return {
      errors: [`Não foi possível ler o JSON: ${error.message}`],
      warnings: [],
      counts: { sections: 0, documents: 0, publishedDocuments: 0 }
    };
  }

  return validateTransparency(data, { ...options, rootDir: options.rootDir || defaultRoot });
}

function printResult(result) {
  result.warnings.forEach(warning => console.warn(`AVISO: ${warning}`));

  if (result.errors.length > 0) {
    result.errors.forEach(error => console.error(`ERRO: ${error}`));
    console.error(`Validação reprovada com ${result.errors.length} erro(s).`);
    return false;
  }

  console.log(
    `Validação aprovada: ${result.counts.sections} seções, ` +
    `${result.counts.documents} documentos (${result.counts.publishedDocuments} publicados).`
  );
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = validateFile();
  if (!printResult(result)) process.exitCode = 1;
}

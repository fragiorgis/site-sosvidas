import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SUPABASE_STORAGE_BUCKET,
  SUPABASE_URL
} from '../js/supabase-config.js';
import { validateTransparency } from './validate-transparencia.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), '..');
const dryRun = process.argv.includes('--dry-run');

export function buildMigrationRecords(data, root = rootDir) {
  const sections = [];
  const documents = [];

  for (const section of data.secoes) {
    sections.push({
      id: section.id,
      title: section.titulo.trim(),
      highlight: (section.destaque || '').trim(),
      description: (section.descricao || '').trim(),
      position: section.ordem,
      published: section.publicada
    });

    for (const documentData of section.documentos) {
      const relativePdf = documentData.arquivo.replace(/^\/docs\//, '');
      const absolutePdf = path.join(root, 'docs', ...relativePdf.split('/'));
      const stats = fs.statSync(absolutePdf);
      documents.push({
        row: {
          id: documentData.id,
          section_id: section.id,
          title: documentData.titulo.trim(),
          description: documentData.descricao.trim(),
          badge: (documentData.selo || '').trim(),
          storage_path: `legacy/${relativePdf}`,
          original_name: path.basename(relativePdf),
          file_size: stats.size,
          mime_type: 'application/pdf',
          position: documentData.ordem,
          published: documentData.publicado,
          archived_at: null
        },
        absolutePdf
      });
    }
  }
  return { sections, documents };
}

async function parseResponse(response) {
  const text = await response.text();
  if (response.ok) return text ? JSON.parse(text) : null;
  let message = text || `HTTP ${response.status}`;
  try {
    const body = JSON.parse(text);
    message = body.message || body.error || body.hint || message;
  } catch {
    // Usa a resposta textual.
  }
  throw new Error(message);
}

function serviceHeaders(serviceKey, extra = {}) {
  const headers = {
    apikey: serviceKey,
    ...extra
  };
  if (serviceKey.startsWith('eyJ')) headers.Authorization = `Bearer ${serviceKey}`;
  return headers;
}

async function upsertRows(table, rows, serviceKey) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=id`, {
    method: 'POST',
    headers: serviceHeaders(serviceKey, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    }),
    body: JSON.stringify(rows)
  });
  await parseResponse(response);
}

async function uploadPdf(documentData, serviceKey) {
  const encodedPath = documentData.row.storage_path.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${encodedPath}`,
    {
      method: 'POST',
      headers: serviceHeaders(serviceKey, {
        'Content-Type': 'application/pdf',
        'x-upsert': 'true'
      }),
      body: fs.readFileSync(documentData.absolutePdf)
    }
  );
  await parseResponse(response);
}

async function verifyMigration(serviceKey) {
  const headers = serviceHeaders(serviceKey);
  const [sectionsResponse, documentsResponse] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/transparency_sections?select=id`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/transparency_documents?select=id`, { headers })
  ]);
  const [sections, documents] = await Promise.all([
    parseResponse(sectionsResponse),
    parseResponse(documentsResponse)
  ]);
  return { sections: sections.length, documents: documents.length };
}

export async function migrate() {
  const data = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'transparencia.json'), 'utf8'));
  const validation = validateTransparency(data, { rootDir, maxPdfBytes: 25 * 1024 * 1024 });
  if (validation.errors.length) throw new Error(`Conteúdo local inválido:\n${validation.errors.join('\n')}`);

  const records = buildMigrationRecords(data, rootDir);
  console.log(`Migração preparada: ${records.sections.length} categorias e ${records.documents.length} PDFs.`);
  if (dryRun) {
    console.log('Dry-run concluído. Nenhum dado externo foi alterado.');
    return;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('Defina SUPABASE_SERVICE_ROLE_KEY apenas no ambiente local antes de migrar.');
  }

  await upsertRows('transparency_sections', records.sections, serviceKey);
  for (let index = 0; index < records.documents.length; index += 1) {
    const documentData = records.documents[index];
    process.stdout.write(`[${index + 1}/${records.documents.length}] ${documentData.row.original_name}... `);
    await uploadPdf(documentData, serviceKey);
    await upsertRows('transparency_documents', [documentData.row], serviceKey);
    console.log('ok');
  }

  const result = await verifyMigration(serviceKey);
  if (result.sections !== records.sections.length || result.documents !== records.documents.length) {
    throw new Error(`Contagem inesperada após migração: ${result.sections} categorias e ${result.documents} documentos.`);
  }
  console.log(`Migração concluída e verificada: ${result.sections} categorias e ${result.documents} documentos.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  migrate().catch(error => {
    console.error(`ERRO: ${error.message}`);
    process.exitCode = 1;
  });
}

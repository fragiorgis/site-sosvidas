import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createStoragePath,
  getPublicPdfUrl,
  slugifyFilename
} from '../js/supabase-api.js';
import { buildMigrationRecords } from '../scripts/migrate-supabase.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(testDir, '..');

test('gera nomes de arquivo previsíveis, seguros e sem sobrescrita', () => {
  assert.equal(slugifyFilename('Balanço ECD 2026.PDF'), 'balanco-ecd-2026.pdf');
  assert.equal(createStoragePath('abc', 'Plano de Ação.pdf', 123), 'documents/abc/123-plano-de-acao.pdf');
  assert.equal(
    getPublicPdfUrl('documents/abc/123-plano-de-acao.pdf'),
    'https://csgvhdjypxufcsjvmubd.supabase.co/storage/v1/object/public/transparencia/documents/abc/123-plano-de-acao.pdf'
  );
});

test('prepara todos os registros atuais para migração idempotente', () => {
  const data = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'transparencia.json'), 'utf8'));
  const records = buildMigrationRecords(data, rootDir);
  assert.equal(records.sections.length, 5);
  assert.equal(records.documents.length, 31);
  assert.equal(new Set(records.sections.map(section => section.id)).size, 5);
  assert.equal(new Set(records.documents.map(documentData => documentData.row.id)).size, 31);
  assert.ok(records.documents.every(documentData => documentData.row.storage_path.startsWith('legacy/')));
  assert.ok(records.documents.every(documentData => documentData.row.file_size > 0));
});

test('migration SQL mantém escrita restrita e arquivos PDF limitados', () => {
  const sql = fs.readFileSync(path.join(rootDir, 'supabase', 'migrations', '202608090001_transparencia.sql'), 'utf8');
  assert.match(sql, /enable row level security/);
  assert.match(sql, /public\.is_transparency_admin\(\)/);
  assert.match(sql, /file_size_limit, allowed_mime_types/);
  assert.match(sql, /26214400/);
  assert.doesNotMatch(sql, /grant delete on public\.transparency_documents/i);
  assert.doesNotMatch(sql, /grant insert on public\.admin_users/i);
});


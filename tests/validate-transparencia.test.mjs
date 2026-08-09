import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  validateFile,
  validateTransparency
} from '../scripts/validate-transparencia.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(testDir, '..');
const dataPath = path.join(rootDir, 'data', 'transparencia.json');
const realData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

function cloneRealData() {
  return structuredClone(realData);
}

test('aprova os dados reais e contabiliza todos os documentos', () => {
  const result = validateTransparency(cloneRealData(), { rootDir });
  assert.deepEqual(result.errors, []);
  assert.equal(result.counts.sections, 5);
  assert.equal(result.counts.documents, 31);
  assert.equal(result.counts.publishedDocuments, 31);
});

test('reprova URL externa e tentativa de sair da pasta docs', () => {
  const external = cloneRealData();
  external.secoes[0].documentos[0].arquivo = 'https://example.com/arquivo.pdf';
  const externalResult = validateTransparency(external, { rootDir });
  assert.ok(externalResult.errors.some(error => error.includes('deve começar com /docs/')));

  const traversal = cloneRealData();
  traversal.secoes[0].documentos[0].arquivo = '/docs/../segredo.pdf';
  const traversalResult = validateTransparency(traversal, { rootDir });
  assert.ok(traversalResult.errors.some(error => error.includes('não permitidos')));
});

test('reprova identificador duplicado', () => {
  const data = cloneRealData();
  data.secoes[0].documentos[1].id = data.secoes[0].documentos[0].id;
  const result = validateTransparency(data, { rootDir });
  assert.ok(result.errors.some(error => error.includes('id está duplicado')));
});

test('reprova HTML nos campos editoriais', () => {
  const data = cloneRealData();
  data.secoes[0].documentos[0].titulo = '<script>alert(1)</script>';
  const result = validateTransparency(data, { rootDir });
  assert.ok(result.errors.some(error => error.includes('não pode conter HTML')));
});

test('reprova arquivo com extensão PDF mas assinatura inválida', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sosvidas-pdf-'));
  fs.mkdirSync(path.join(temporaryRoot, 'docs'));
  fs.writeFileSync(path.join(temporaryRoot, 'docs', 'falso.pdf'), 'isto nao e pdf');

  const data = {
    secoes: [{
      id: '44756513-c507-4e63-a3f4-6d54a8a1565c',
      titulo: 'Teste',
      destaque: '',
      descricao: '',
      ordem: 10,
      publicada: true,
      documentos: [{
        id: '82348a95-df0b-4c77-9070-2e0afd1f81b9',
        titulo: 'Arquivo falso',
        descricao: 'Documento usado apenas durante o teste automatizado.',
        selo: 'Teste',
        arquivo: '/docs/falso.pdf',
        ordem: 10,
        publicado: true
      }]
    }]
  };

  const result = validateTransparency(data, { rootDir: temporaryRoot });
  assert.ok(result.errors.some(error => error.includes('assinatura PDF válida')));
});

test('reprova PDF acima do limite configurado', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sosvidas-size-'));
  fs.mkdirSync(path.join(temporaryRoot, 'docs'));
  fs.writeFileSync(path.join(temporaryRoot, 'docs', 'grande.pdf'), '%PDF-123456789');

  const data = {
    secoes: [{
      id: '44756513-c507-4e63-a3f4-6d54a8a1565c',
      titulo: 'Teste',
      destaque: '',
      descricao: '',
      ordem: 10,
      publicada: true,
      documentos: [{
        id: '82348a95-df0b-4c77-9070-2e0afd1f81b9',
        titulo: 'Arquivo grande',
        descricao: 'Documento usado apenas durante o teste automatizado.',
        selo: 'Teste',
        arquivo: '/docs/grande.pdf',
        ordem: 10,
        publicado: true
      }]
    }]
  };

  const result = validateTransparency(data, { rootDir: temporaryRoot, maxPdfBytes: 8 });
  assert.ok(result.errors.some(error => error.includes('excede o limite')));
});

test('avisa quando há PDF órfão sem impedir conteúdo válido', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sosvidas-orphan-'));
  fs.mkdirSync(path.join(temporaryRoot, 'docs'));
  fs.writeFileSync(path.join(temporaryRoot, 'docs', 'usado.pdf'), '%PDF-1.4');
  fs.writeFileSync(path.join(temporaryRoot, 'docs', 'orfao.pdf'), '%PDF-1.4');

  const data = {
    secoes: [{
      id: '44756513-c507-4e63-a3f4-6d54a8a1565c',
      titulo: 'Teste',
      destaque: '',
      descricao: '',
      ordem: 10,
      publicada: true,
      documentos: [{
        id: '82348a95-df0b-4c77-9070-2e0afd1f81b9',
        titulo: 'Arquivo usado',
        descricao: 'Documento usado apenas durante o teste automatizado.',
        selo: 'Teste',
        arquivo: '/docs/usado.pdf',
        ordem: 10,
        publicado: true
      }]
    }]
  };

  const result = validateTransparency(data, { rootDir: temporaryRoot });
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.some(warning => warning.includes('/docs/orfao.pdf')));
});

test('informa erro de sintaxe ao ler JSON inválido', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sosvidas-json-'));
  const jsonPath = path.join(temporaryRoot, 'invalido.json');
  fs.writeFileSync(jsonPath, '{ invalido');
  const result = validateFile(jsonPath, { rootDir: temporaryRoot });
  assert.ok(result.errors.some(error => error.includes('Não foi possível ler o JSON')));
});

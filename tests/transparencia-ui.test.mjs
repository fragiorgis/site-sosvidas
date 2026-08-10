import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getVisibleSections,
  isSafePdfPath,
  mapSupabaseRows
} from '../js/transparencia.js';

test('aceita somente caminhos PDF internos e seguros', () => {
  assert.equal(isSafePdfPath('/docs/relatorios/balanco-2025.pdf'), true);
  assert.equal(isSafePdfPath('https://example.com/documento.pdf'), false);
  assert.equal(isSafePdfPath('/docs/../segredo.pdf'), false);
  assert.equal(isSafePdfPath('/docs/%2e%2e/segredo.pdf'), false);
  assert.equal(isSafePdfPath('/docs/arquivo.pdf?download=1'), false);
  assert.equal(isSafePdfPath('/docs/arquivo.docx'), false);
  assert.equal(isSafePdfPath('https://csgvhdjypxufcsjvmubd.supabase.co/storage/v1/object/public/transparencia/documents/id/arquivo.pdf'), true);
  assert.equal(isSafePdfPath('https://outro.supabase.co/storage/v1/object/public/transparencia/arquivo.pdf'), false);
});

test('oculta itens não publicados e ordena sem alterar os dados originais', () => {
  const data = {
    secoes: [
      {
        id: 'b',
        titulo: 'Segunda',
        ordem: 20,
        publicada: true,
        documentos: [
          { titulo: 'B', ordem: 20, publicado: true, arquivo: '/docs/b.pdf' },
          { titulo: 'Oculto', ordem: 5, publicado: false, arquivo: '/docs/oculto.pdf' },
          { titulo: 'A', ordem: 10, publicado: true, arquivo: '/docs/a.pdf' }
        ]
      },
      {
        id: 'a',
        titulo: 'Primeira',
        ordem: 10,
        publicada: true,
        documentos: []
      },
      {
        id: 'c',
        titulo: 'Oculta',
        ordem: 1,
        publicada: false,
        documentos: []
      }
    ]
  };

  const result = getVisibleSections(data);
  assert.deepEqual(result.map(section => section.titulo), ['Primeira', 'Segunda']);
  assert.deepEqual(result[1].documentos.map(documentData => documentData.titulo), ['A', 'B']);
  assert.equal(data.secoes[0].documentos.length, 3);
});

test('reprova formato de dados inesperado', () => {
  assert.throws(() => getVisibleSections({ secoes: null }), /Formato inválido/);
});

test('converte linhas públicas do Supabase para o formato seguro da página', () => {
  const data = mapSupabaseRows([
    { id: 'secao', title: 'Financeiro', highlight: '', description: '', position: 10, published: true }
  ], [
    { id: 'doc', section_id: 'secao', title: 'Balanço', description: 'Balanço anual.', badge: '2026', storage_path: 'documents/doc/balanco.pdf', position: 10, published: true, archived_at: null },
    { id: 'old', section_id: 'secao', title: 'Antigo', description: 'Arquivado.', badge: '', storage_path: 'documents/old/antigo.pdf', position: 20, published: true, archived_at: '2026-01-01T00:00:00Z' }
  ]);
  const visible = getVisibleSections(data);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].documentos.length, 1);
  assert.match(visible[0].documentos[0].arquivo, /\/storage\/v1\/object\/public\/transparencia\/documents\/doc\/balanco\.pdf$/);
});

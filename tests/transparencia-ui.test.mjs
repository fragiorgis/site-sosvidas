import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getVisibleSections,
  isSafePdfPath
} from '../js/transparencia.js';

test('aceita somente caminhos PDF internos e seguros', () => {
  assert.equal(isSafePdfPath('/docs/relatorios/balanco-2025.pdf'), true);
  assert.equal(isSafePdfPath('https://example.com/documento.pdf'), false);
  assert.equal(isSafePdfPath('/docs/../segredo.pdf'), false);
  assert.equal(isSafePdfPath('/docs/%2e%2e/segredo.pdf'), false);
  assert.equal(isSafePdfPath('/docs/arquivo.pdf?download=1'), false);
  assert.equal(isSafePdfPath('/docs/arquivo.docx'), false);
  assert.equal(isSafePdfPath('https://csgvhdjypxufcsjvmubd.supabase.co/storage/v1/object/public/transparencia/documents/id/arquivo.pdf'), false);
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

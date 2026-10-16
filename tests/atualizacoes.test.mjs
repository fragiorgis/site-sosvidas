import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selectPosts } from '../js/atualizacoes.js';
const catalog = JSON.parse(fs.readFileSync(new URL('../data/atualizacoes.json', import.meta.url)));

test('catálogo publicado tem fotos locais, fontes válidas e três destaques distintos', () => {
  assert.equal(selectPosts(catalog).length, catalog.posts.length);
  assert.equal(selectPosts(catalog, 'destaques').length, 3);
  assert.equal(new Set(catalog.posts.map(p => p.id)).size, catalog.posts.length);
  assert.equal(new Set(catalog.posts.map(p => p.imagem)).size, catalog.posts.length);
  for (const post of catalog.posts) assert.ok(fs.statSync(new URL(`..${post.imagem}`, import.meta.url)).size > 0);
});
test('oculta rascunhos e rejeita URLs externas, travessia de diretório e datas inválidas', () => {
  const valid = catalog.posts[0];
  for (const change of [{publicado:false},{url:'javascript:alert(1)'},{url:'https://www.instagram.com.evil.test/sos_vidass/p/x/'},{imagem:'/img/instagram/../x.jpg'},{imagem:'https://example.com/x.jpg'},{data:'2026-02-31'},{data:'invalida'}]) {
    assert.equal(selectPosts({posts:[{...valid,...change}]}).length,0);
  }
});
test('ordena por publicação sem alterar o catálogo e mantém todos os posts fora da home', () => {
  const input={posts:[...catalog.posts].reverse()};
  const before=JSON.stringify(input);
  const result=selectPosts(input);
  assert.equal(result[0].data,'2026-10-14');
  assert.equal(JSON.stringify(input),before);
  assert.ok(result.some(p=>p.destaque===false));
  assert.ok(selectPosts(input,'destaques').every(p=>p.destaque===true));
});

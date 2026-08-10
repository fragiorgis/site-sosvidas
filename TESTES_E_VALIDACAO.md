# Testes e validação

## Automação local

```bash
npm run check
npm run build
npm run migrate:supabase:dry
```

O `check` valida:

- 5 categorias e 31 documentos locais;
- UUIDs, limites de texto, caminhos e assinatura dos PDFs;
- links e arquivos do site;
- ausência de chaves secretas conhecidas;
- CSP apontando para o projeto correto;
- ausência de `innerHTML` editorial;
- políticas essenciais da migration;
- mapeamento das linhas do Supabase;
- nomes seguros e migração idempotente.

## Validação do Supabase

Depois de aplicar schema e migrar:

```bash
npm run verify:supabase
npm run verify:supabase:admin
```

Resultado esperado:

```text
Supabase público validado: 5 categorias e 31 documentos visíveis.
Bloqueio anônimo de admin_users confirmado (...).
```

## Matriz funcional

1. Login incorreto: deve recusar sem revelar se o e-mail existe.
2. Usuário Auth fora de `admin_users`: deve recusar o painel.
3. Administrador correto: deve carregar as cinco categorias.
4. Nova categoria oculta: não deve aparecer publicamente.
5. Novo PDF publicado: deve aparecer após atualizar a página pública.
6. PDF falso renomeado: deve ser recusado.
7. Arquivo acima de 25 MB: deve ser recusado.
8. PDF de 14,1 MB existente: deve concluir upload.
9. Ocultar: deve remover da página pública e preservar no painel.
10. Publicar: deve restaurar na página pública.
11. Substituir: deve abrir o novo PDF e preservar o anterior no Storage.
12. Arquivar: deve retirar do público sem excluir fisicamente.
13. Logout: deve impedir retorno ao painel autenticado.

## Testes de autorização via API

Sem login, confirme:

- `GET transparency_sections`: somente publicadas;
- `GET transparency_documents`: somente publicados e não arquivados;
- `GET admin_users`: 401/403;
- `POST/PATCH` nas tabelas: 401/403;
- upload no Storage: 401/403.

Com administrador, confirme criação e update. Não deve existir grant de DELETE nas tabelas editoriais.

## Build publicado

O `.netlify-dist` deve conter `admin/`, `pages/`, `js/`, `css/`, `docs/` e `data/`.

Não deve conter:

- `supabase/`;
- `scripts/`;
- `tests/`;
- `.env.local`;
- `package.json`;
- `netlify.toml`.

## Produção

Após o deploy, confira no navegador:

- console sem erros;
- CSP sem bloqueios do domínio Supabase;
- painel com `Cache-Control: no-store` e `X-Robots-Tag`;
- PDFs retornando 200 e `application/pdf`;
- layout em celular e computador;
- fallback carregando os documentos locais se o domínio Supabase for bloqueado durante um teste controlado.

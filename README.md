# SOS Vidas — site institucional

Site estático da Associação SOS Vidas, publicado no Netlify, com painel próprio para gestão dos documentos de transparência e backend no Supabase.

## Arquitetura

```text
Visitante -> página pública -> Supabase Data API/Storage
Funcionário -> /admin/ -> Supabase Auth -> RLS -> banco/Storage
Desenvolvedor -> GitHub -> validações -> Netlify
```

- O funcionário usa somente `/admin/` com e-mail e senha.
- O cadastro público é desabilitado.
- A escrita exige autenticação e presença em `admin_users`.
- O público consulta somente itens publicados.
- `data/transparencia.json` e `docs/` permanecem como fallback e rollback inicial.
- A chave publishable é pública; chaves secretas nunca entram no frontend.

## Arquivos principais

- `admin/index.html`: painel administrativo.
- `js/admin.js`: fluxo de gestão e upload.
- `js/supabase-api.js`: cliente Auth, REST e Storage sem dependências externas.
- `js/supabase-config.js`: URL e chave pública do projeto.
- `js/transparencia.js`: consulta Supabase com fallback local.
- `supabase/migrations/`: schema, RLS, bucket e auditoria.
- `scripts/migrate-supabase.mjs`: migração idempotente dos 31 PDFs.
- `_headers`: CSP e cabeçalhos de segurança.

## Desenvolvimento local

Pré-requisito: Node.js 24.

```bash
npm run check
npm run build
cd .netlify-dist
python3 -m http.server 8765
```

Abra:

- site: `http://localhost:8765/`
- transparência: `http://localhost:8765/pages/transparencia.html`
- painel: `http://localhost:8765/admin/`

## Comandos

```bash
npm run check                  # conteúdo, site e 15 testes automatizados
npm run build                  # gera .netlify-dist/
npm run migrate:supabase:dry   # valida a migração sem alterar o Supabase
npm run migrate:supabase       # migra usando .env.local
npm run verify:supabase        # valida leitura pública e bloqueio administrativo
```

## Documentação

- [Configuração de produção](CONFIGURACAO_PRODUCAO.md)
- [Operação pelo funcionário](OPERACAO_TRANSPARENCIA.md)
- [Testes e validação](TESTES_E_VALIDACAO.md)
- [Segurança e incidentes](SECURITY.md)

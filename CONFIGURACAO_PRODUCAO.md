# Configuração de produção — Supabase e Netlify

O projeto Supabase configurado no frontend é `csgvhdjypxufcsjvmubd`. A chave presente em `js/supabase-config.js` é publishable e, portanto, não é segredo.

## 1. Criar o schema

1. No Supabase, abra **SQL Editor**.
2. Clique em **New query**.
3. Copie todo o conteúdo de `supabase/migrations/202608090001_transparencia.sql`.
4. Clique em **Run**.
5. Confirme que não houve erro.

A migration cria tabelas, índices, triggers de auditoria, políticas RLS e o bucket público `transparencia`, limitado a PDF e 25 MB.

## 2. Fechar o cadastro público

No Supabase:

1. Abra **Authentication**.
2. Entre em **Providers** ou **Sign In / Providers**.
3. Abra o provedor **Email**.
4. Mantenha login por e-mail e senha habilitado.
5. Desabilite **Allow new users to sign up**.
6. Salve.
7. Em **URL Configuration**, use `https://sosvidas.netlify.app` como Site URL.

## 3. Criar o administrador

1. Abra **Authentication → Users**.
2. Clique em **Add user**.
3. Escolha **Create new user**.
4. Informe o e-mail do responsável e uma senha forte.
5. Marque o e-mail como confirmado/auto confirm.
6. Não compartilhe a senha por mensagem aberta.
7. No SQL Editor, abra `supabase/bootstrap-admin.sql`.
8. Substitua `SUBSTITUA-PELO-EMAIL-DO-ADMINISTRADOR` pelo e-mail criado.
9. Execute o arquivo.
10. O `SELECT` final deve retornar exatamente um usuário.

Para adicionar um segundo administrador, crie outro usuário e execute novamente apenas o `INSERT` com o novo e-mail.

## 4. Migrar os documentos atuais

Use uma chave secret/service role somente na máquina do desenvolvedor:

1. Abra **Project Settings → API Keys**.
2. Copie a chave secreta ou `service_role`.
3. Na raiz do projeto, copie `.env.example` para `.env.local`.
4. Preencha `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`.
5. Nunca faça commit desse arquivo.

Execute:

```bash
npm run migrate:supabase:dry
npm run migrate:supabase
npm run verify:supabase
```

O script pode ser executado novamente: UUIDs e caminhos antigos são preservados e os registros são atualizados sem duplicação.

Depois da migração, remova a chave de `.env.local` ou apague apenas esse arquivo local. Não configure a service role no Netlify.

## 5. Conferência no Supabase

- **Table Editor → transparency_sections:** 5 linhas.
- **Table Editor → transparency_documents:** 31 linhas.
- **Storage → transparencia → legacy:** 31 PDFs.
- **Authentication → Users:** somente os usuários predefinidos.
- **Table Editor → admin_users:** o UUID do administrador.

## 6. Publicação no Netlify

O Netlify já está conectado à branch `main` com:

- build: `npm run build`
- publish: `.netlify-dist`
- Node: `24.15.0`

Não são necessárias variáveis do Supabase no Netlify. A aplicação usa somente URL e chave publishable, que já estão no artefato público.

Antes de enviar para produção:

```bash
npm run check
npm run build
git status
```

Após o push, valide o deploy em **Netlify → Deploys**. Não exclua o deploy anterior; ele funciona como rollback.

## 7. URLs finais

- site: `https://sosvidas.netlify.app/`
- transparência: `https://sosvidas.netlify.app/pages/transparencia.html`
- painel: `https://sosvidas.netlify.app/admin/`

## 8. Rotação e desligamento

- Para bloquear um administrador, remova primeiro a linha correspondente de `admin_users` e depois desabilite/exclua o usuário no Auth.
- Se a publishable key for rotacionada, atualize `js/supabase-config.js` e a origem da CSP se o domínio mudar.
- Se uma chave secret/service role vazar, rotacione-a imediatamente no Supabase; ela não deve existir no GitHub ou Netlify.

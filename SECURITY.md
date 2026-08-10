# Segurança

## Modelo de acesso

- O site público usa somente a chave publishable do Supabase.
- A chave publishable identifica o projeto, mas não ignora RLS.
- Usuários administrativos são predefinidos no Auth e autorizados em `admin_users`.
- Cadastro público deve permanecer desabilitado.
- Nenhuma chave secret/service role pode chegar ao navegador, GitHub ou Netlify.

## Controles implementados

- RLS em todas as tabelas públicas.
- Leitura anônima somente de categorias/documentos publicados.
- Escrita condicionada a `is_transparency_admin()`.
- Bucket limitado a `application/pdf` e 25 MB.
- Verificação no navegador de extensão, MIME, tamanho e assinatura `%PDF-`.
- Renderização com `textContent`, sem HTML editorial.
- Sessão no `sessionStorage` e refresh controlado.
- CSP restrita ao projeto `csgvhdjypxufcsjvmubd`.
- Painel com `no-store` e `noindex`.
- Arquivamento lógico em vez de exclusão física.
- Auditoria de inserts e updates com usuário e snapshots.

## Segredos

Segredos proibidos no repositório:

- senha do banco;
- chave secret/service role;
- JWT secret;
- connection string;
- senha do administrador.

O arquivo `.env.local` está ignorado pelo Git. A migration usa a chave administrativa somente para a carga inicial.

## Revogação de acesso

1. No SQL Editor, remova a autorização:

```sql
delete from public.admin_users where user_id = 'UUID-DO-USUARIO';
```

2. Em **Authentication → Users**, desabilite ou exclua o usuário.
3. Se houver suspeita de vazamento de senha, redefina a senha antes de reativar.

## Incidente com chave secreta

1. Rotacione a chave no Supabase imediatamente.
2. Verifique logs de Auth, API, banco e Storage.
3. Remova a chave de arquivos locais inseguros.
4. Se entrou no Git, trate o histórico como comprometido e reescreva-o.
5. Confirme que o Netlify possui apenas o código estático esperado.

## Backup e recuperação

- O JSON e os 31 PDFs locais permanecem como fallback inicial.
- O Git e deploys anteriores do Netlify permitem rollback de frontend.
- PDFs substituídos não são apagados automaticamente.
- `transparency_audit_log` preserva metadados anteriores e posteriores.
- Exporte periodicamente tabelas e Storage antes de remover o fallback local.

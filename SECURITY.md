# Segurança e recuperação

O site público é estático. A distribuição do cPanel contém apenas arquivos necessários à navegação; não inclui painel administrativo, senhas, código do antigo banco, scripts de implantação ou repositório Git. As regras de `apache/.htaccess` ativam HTTPS e cabeçalhos de segurança. `data/` usa revalidação de cache e `docs/` usa cache curto.

Os documentos publicados são públicos por definição. Antes de adicionar um PDF, confirme que ele pode ser divulgado e execute a validação local. Não publique credenciais, `.env`, cópias de banco ou arquivos do WordPress antigo em `public_html`.

A cópia do site anterior fica fora da pasta pública em `/home/sosvidasrporg/backup-site-2026-09-29/public_html`. O MySQL e as contas de e-mail permanecem no cPanel. Para restaurar, devolva essa cópia à pasta pública e confirme o domínio e o e-mail. O futuro CMS deve ter autenticação própria, trilha de auditoria e rotina de backup antes de ser liberado.

# Migração de sosvidasrp.org.br para o cPanel

Plano e inventário verificados em 29/09/2026.

## Estado encontrado

- `sosvidasrp.org.br` já aponta para o cPanel (`64.31.38.170`); `www` aponta para o domínio principal. O site público mostra uma página provisória do Site Publisher. Não é preciso mudar DNS para publicar no cPanel.
- `/home/sosvidasrporg/public_html` contém essa página e uma instalação WordPress. Há uma cópia recuperável em `/home/sosvidasrporg/backup-site-2026-09-29/public_html`, fora da área pública. O banco MySQL existente permanece intacto.
- O cPanel também atende quatro contas de e-mail. MX, `mail`, SPF, DKIM, webmail e FTP permanecem como estão; a troca dos arquivos do site não altera esses serviços.
- A conta tem limite de 1 GB de disco e 7,81 GB de tráfego mensal. O pacote público do novo site tem cerca de 49 MB e contém 31 PDFs.
- O novo site está na Netlify em `sosvidas.netlify.app`. Os dois domínios personalizados foram cadastrados lá, mas nunca tiveram o DNS direcionado à Netlify.
- O projeto Supabase antigo ficou pausado, foi restaurado para conferência e continha os mesmos 31 documentos em caminhos `legacy/`. O site novo deixa de consultá-lo. O serviço remoto fica preservado temporariamente para recuperação de dados.

## Conteúdo que será publicado

Sete páginas HTML (`index.html` e seis páginas em `pages/`), estilos, scripts públicos, imagens, `data/transparencia.json`, 31 PDFs, `robots.txt`, `sitemap.xml` e regras Apache de HTTPS/segurança/cache. O painel antigo e credenciais não fazem parte da publicação.

## Sequência de publicação

1. Executar `npm run build:cpanel` e revisar `.cpanel-dist/`.
2. Enviar as alterações para o repositório público `fragiorgis/site-sosvidas`.
3. Em **Git Version Control** do cPanel, clonar `https://github.com/fragiorgis/site-sosvidas.git` fora de `public_html`, por exemplo em `/home/sosvidasrporg/git-site-sosvidas`. A primeira implantação foi validada em `/home/sosvidasrporg/site-new-2026-09-29`; a `.cpanel.yml` agora publica os arquivos públicos em `/home/sosvidasrporg/public_html`.
4. Conferir nessa pasta o `index.html`, seis arquivos em `pages/`, o JSON, 31 PDFs e os três `.htaccess`. Se possível, criar um subdomínio temporário com raiz nessa pasta para testar no navegador, inclusive HTTPS e os links dos PDFs.
5. O conteúdo antigo de `public_html` foi movido para `/home/sosvidasrporg/old-public-html-2026-09-29`, fora da área pública. Há também a cópia independente em `backup-site-2026-09-29`. O banco MySQL e o e-mail não foram tocados.
6. Atualizar o Git no cPanel e implantar novamente. Confirmar `https://sosvidasrp.org.br/`, as seis páginas, 31 PDFs, `robots.txt`, sitemap e o redirecionamento de `www` para o domínio principal. Recolocar `.well-known` e `cgi-bin` se necessários para o serviço.
7. Depois da validação, remover os domínios personalizados da Netlify e desconectar a publicação automática. Manter um rollback até o novo site ficar estável. Não apagar o projeto antigo do Supabase antes de conferir que não há dados exclusivos nele.

## CMS no cPanel — etapa posterior

O painel antigo gerenciava **somente categorias e PDFs da transparência**. Textos, fotos, eventos e demais páginas são HTML estático.

Para permitir edição pela administradora no cPanel, recomendo um CMS pequeno em PHP e MySQL, instalado em `/admin` e isolado do WordPress antigo:

1. Começar por transparência: categorias, ordem, visibilidade e upload/substituição de PDF.
2. Usar contas individuais, senhas com hash, sessão segura, proteção contra CSRF, consultas preparadas e validação de arquivo PDF. Guardar originais fora de `public_html` e servir somente os publicados.
3. Criar tabelas próprias e trilha de auditoria no MySQL, com backup antes de cada mudança. O banco WordPress antigo não deve ser reaproveitado sem análise.
4. Para não quebrar o front-end, gerar `data/transparencia.json` validado e atualizar os PDFs publicados de forma atômica. Depois, incluir eventos/fotos e blocos de texto se a associação precisar editar essas partes sem desenvolvedor.
5. Testar permissões, publicação, reversão e backup em uma área de teste antes de abrir o painel à administradora.

Até esse CMS existir, não há interface de edição para a administradora. As alterações devem passar pelo repositório, validação e implantação Git.

## Retorno

Se a publicação falhar, mover os arquivos novos para fora de `public_html` e restaurar o conteúdo de `/home/sosvidasrporg/backup-site-2026-09-29/public_html`. O banco MySQL antigo continua no cPanel. DNS e e-mail não precisam ser alterados no retorno.

# Publicação no cPanel

A produção usa `https://sosvidasrp.org.br/` e `/home/sosvidasrporg/public_html`. O DNS e os e-mails já estão no cPanel.

O repositório Git é a origem das versões. Antes de implantar, execute `npm run check` e revise o pacote de `npm run build:cpanel`. A configuração `.cpanel.yml` copia somente HTML, CSS, JavaScript público, imagens, PDFs, JSON, sitemap, robots e `.htaccess`. Nunca coloque o repositório inteiro nem arquivos `.env` em `public_html`.

No cPanel, **Git Version Control → Update from Remote → Deploy HEAD Commit** implanta o commit selecionado. A primeira implantação foi validada em `/home/sosvidasrporg/site-new-2026-09-29`; agora o destino é `/home/sosvidasrporg/public_html`. O conteúdo anterior foi preservado em duas pastas fora da área pública. Não edite diretamente o clone gerenciado pelo cPanel: alterações devem ser feitas no repositório de origem.

Após a troca, confira a página inicial, as seis páginas internas, os 31 PDFs, a ausência de `/admin`, o redirecionamento de `www`, HTTPS e cabeçalhos de segurança. O certificado é gerenciado em **SSL/TLS Status**. Consulte [MIGRACAO_DOMINIO.md](MIGRACAO_DOMINIO.md) para a sequência e o retorno.

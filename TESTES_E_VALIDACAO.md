# Verificações do site estático

Execute `npm run check` antes de publicar. Esse comando confere os 31 PDFs e seus metadados, referências locais das páginas, ausência de conteúdo editorial inserido como HTML e testes de visibilidade/ordenação dos documentos. Execute `npm run build:cpanel` para produzir o pacote da hospedagem e confirme que ele não contém painel, arquivos internos ou referências ao Supabase.

Após a implantação, abra `https://sosvidasrp.org.br/` e as seis páginas internas. Confira os links de navegação, imagens, `data/transparencia.json`, os 31 PDFs, `robots.txt`, `sitemap.xml`, HTTPS e o redirecionamento de `www`. Confira também o recebimento de e-mail, embora os registros DNS não sejam alterados.

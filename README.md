# SOS Vidas — site institucional

Site público estático da Associação SOS Vidas. O destino de produção é o cPanel de `sosvidasrp.org.br`. A versão pública contém sete páginas HTML, estilos, imagens, 31 PDFs e `data/transparencia.json`. A página de transparência lê esse arquivo local; não há login ou dependência do Supabase no site publicado.

## Estrutura

- `index.html` e `pages/`: conteúdo e páginas públicas.
- `css/`, `img/` e `js/main.js`: apresentação e navegação.
- `data/transparencia.json`, `docs/` e `js/transparencia.js`: categorias e documentos de transparência.
- `apache/`: regras de HTTPS, segurança e cache para o cPanel.
- `.cpanel.yml`: implantação dos arquivos públicos pelo Git do cPanel.
- `scripts/`: validação do conteúdo e preparação do pacote público.

O painel antigo de administração e a integração com Supabase foram retirados do projeto em 29/09/2026. O CMS no cPanel ainda será desenvolvido; até lá, atualizar o site exige alterar os arquivos do repositório e publicar uma nova versão. Consulte [MIGRACAO_DOMINIO.md](MIGRACAO_DOMINIO.md) para a sequência de implantação e o desenho do CMS.

## Verificação local

Requer Node.js 24.

```bash
npm run check
npm run build:cpanel
cd .cpanel-dist
python3 -m http.server 8765
```

Abra `http://localhost:8765/` e `http://localhost:8765/pages/transparencia.html`.

`npm run build:cpanel` gera `.cpanel-dist/`, sem arquivos internos. A publicação do cPanel usa os mesmos arquivos públicos por meio de `.cpanel.yml`. O comando `npm run build` mantém o artefato da Netlify apenas durante a transição.

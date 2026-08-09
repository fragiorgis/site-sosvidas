# SOS Vidas — site institucional

Site estático da Associação SOS Vidas, com gestão dos documentos de Transparência por Pages CMS, GitHub e Netlify.

## Arquitetura

```text
Editor por e-mail -> Pages CMS -> GitHub -> validações -> Netlify -> site público
```

- O Pages CMS é somente a interface de edição.
- GitHub é a fonte de verdade para código, JSON e PDFs.
- O Netlify executa todas as validações antes de publicar.
- O site público não consulta Pages CMS ou GitHub durante a visita.
- Falha do CMS impede edição, mas não derruba o site.

## Arquivos principais

- `.pages.yml`: formulário e limites do Pages CMS.
- `data/transparencia.json`: seções e documentos exibidos.
- `js/transparencia.js`: renderização segura da página.
- `scripts/validate-transparencia.mjs`: valida JSON, caminhos e conteúdo dos PDFs.
- `scripts/validate-site.mjs`: valida arquivos, referências e controles essenciais.
- `scripts/prepare-dist.mjs`: cria o artefato público sem expor testes e configuração.
- `tests/`: testes automatizados.
- `netlify.toml`: build e publicação.
- `_headers`: cabeçalhos HTTP de segurança e cache.

## Desenvolvimento local

Pré-requisitos:

- Node.js 24;
- Python 3 apenas para o servidor HTTP local.

```bash
npm run check
npm run build
cd .netlify-dist
python3 -m http.server 8765
```

Abra `http://localhost:8765/pages/transparencia.html`.

Não abra a página diretamente com `file://`, pois o navegador bloqueia a leitura do JSON local.
Para desenvolver sem gerar o artefato, também é possível servir a raiz do repositório depois de `npm run check`.

## Comandos

```bash
npm run validate:content  # JSON, UUIDs, paths, existência, tamanho e assinatura dos PDFs
npm run validate:site     # links locais, integração da página, headers e segredos óbvios
npm test                  # 11 testes automatizados
npm run check             # todas as verificações acima
npm run build             # valida e gera o artefato público em .netlify-dist/
```

## Documentação

- [Configuração de produção](CONFIGURACAO_PRODUCAO.md)
- [Operação pelo funcionário](OPERACAO_TRANSPARENCIA.md)
- [Testes e validação](TESTES_E_VALIDACAO.md)
- [Segurança e incidentes](SECURITY.md)

## Regra principal

Nunca coloque no repositório um rascunho, credencial ou documento ainda não autorizado para divulgação. Se o repositório for público, um arquivo enviado ao Git poderá permanecer no histórico mesmo depois de apagado.

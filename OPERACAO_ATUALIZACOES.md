# Fotos e publicações selecionadas do Instagram

A seleção é manual, conforme decisão de 15/10/2026. Não existe conexão automática, token, API Meta, banco ou CMS. O Instagram continua sendo a fonte; as fotografias são servidas pelo próprio cPanel.

## Atualizar a seleção

1. Escolha uma publicação do perfil `https://www.instagram.com/sos_vidass/` e salve a foto autorizada em `img/instagram/`, com nome descritivo em minúsculas e hífens. Use JPG, PNG ou WebP. Evite repetir a mesma fotografia em blocos próximos.
2. Edite `data/atualizacoes.json`. Copie um objeto de `posts` e altere `id`, `titulo`, `resumo`, `data` (data da publicação, YYYY-MM-DD), `categoria`, `imagem`, `alt` (descrição visual), `url` (link original), `publicado` e `destaque`.
3. A home mostra os três itens publicados mais recentes com `destaque: true`. Eventos mostra até 60 itens publicados, em ordem decrescente de data. `publicado: false` retira um item da seleção sem apagar seu registro.
4. Rode `npm run build:cpanel`, revise Início e Eventos e publique pelo fluxo Git do cPanel. Nunca coloque tokens ou links temporários de CDN no catálogo.
5. Para atualizar diretamente no cPanel, faça uma cópia de segurança, envie a imagem em `public_html/img/instagram/` e edite `public_html/data/atualizacoes.json` no Gerenciador de Arquivos. Preserve o JSON válido. Depois replique a alteração no GitHub: o próximo deploy sobrescreve esse arquivo.

A atualização do catálogo alimenta as duas páginas, sem alterar o HTML. As imagens fixas de Sobre, Serviços e do destaque principal continuam referenciadas nos respectivos HTMLs. Um novo post no Instagram não aparece sozinho no site.

## Fotografias e procedência

Todas consultadas em 15/10/2026, seleção solicitada pelo responsável pelo site. As legendas curtas são resumos editoriais. Não foram incluídas histórias clínicas, notas de falecimento ou dados particulares dos atendidos.

| Arquivo | Fonte | Uso |
|---|---|---|
| dia-das-criancas.webp | https://www.instagram.com/sos_vidass/p/DefK_5Cj77k/ | Início e Eventos |
| dia-do-idoso.webp | https://www.instagram.com/sos_vidass/p/DeNFyM1j0nu/ | Destaque inicial e Eventos |
| doacoes-acacias.webp | https://www.instagram.com/sos_vidass/p/DeKnLzUvll6/ | Início e Eventos |
| certificados-cursos.jpg | https://www.instagram.com/sos_vidass/reel/DdWfiRkueLG/ | Início e Eventos; capa de vídeo |
| oficina-artesanato.jpg | https://www.instagram.com/sos_vidass/reel/Db4GKvJvrXI/ | Serviços e Eventos; capa de vídeo |
| educacao-digital.jpg | https://www.instagram.com/sos_vidass/reel/DcPQhTrv3mz/ | Serviços; capa de vídeo |
| equipe-parcerias.jpg | https://www.instagram.com/sos_vidass/p/DdZurxmvkzK/ | Sobre |

O post Acácias possui o rótulo “Conteúdo de IA” no Instagram; o arquivo foi preservado tal como publicado. Capas dos vídeos têm resolução original de 640 px; não foram artificialmente ampliadas ou reconstruídas.

## Comportamento e limites

- O JavaScript usa somente conteúdo textual, caminhos locais de imagem e links permitidos do perfil da SOS Vidas.
- O JSON é solicitado sem cache; a política existente do diretório data exige revalidação.
- Em falha de rede/formato ou com JavaScript desligado, o link para o perfil continua disponível. Não existe dependência de widgets externos nem alteração de CSP.
- A agenda antiga tinha julho/agosto como eventos futuros; foi substituída por registros com fonte e orientação para consultar a programação.
- Identidade existente preservada: cores azul/amarelo/rosa, fonte e navegação; a seleção usa fotos quadradas, texto legível e colunas responsivas.

## Pendências editoriais externas

A bio do Instagram ainda aponta para `sosvidas.netlify.app`, desativado. A administradora deve substituir pelo domínio `https://sosvidasrp.org.br/`. O post fixado informa WhatsApp (16) 99435-8796, diferente do WhatsApp usado no site. Confirmar com a instituição antes de alterar os canais de contato em todas as páginas.

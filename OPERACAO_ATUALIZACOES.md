# Fotos e publicações selecionadas do Instagram

A seleção é manual, conforme decisão de 15/10/2026. A rotina semanal no Codex está pausada; executar novas revisões somente quando o responsável solicitar. Não existe conexão automática, token, API Meta, banco ou CMS. O Instagram continua sendo a fonte; as fotografias são servidas pelo próprio cPanel.

## Atualizar a seleção

1. Escolha uma publicação do perfil `https://www.instagram.com/sos_vidass/` e salve a foto autorizada em `img/instagram/`, com nome descritivo em minúsculas e hífens. Use JPG, PNG ou WebP. Evite repetir a mesma fotografia em blocos próximos.
2. Edite `data/atualizacoes.json`. Copie um objeto de `posts` e altere `id`, `titulo`, `resumo`, `data` (data da publicação, YYYY-MM-DD), `categoria`, `imagem`, `alt` (descrição visual), `url` (link original), `publicado` e `destaque`.
3. A home mostra os três itens publicados mais recentes com `destaque: true`. Eventos mostra até 60 itens publicados, em ordem decrescente de data. `publicado: false` retira um item da seleção sem apagar seu registro.
4. Rode `npm run build:cpanel`, revise Início e Eventos e publique pelo fluxo Git do cPanel. Nunca coloque tokens ou links temporários de CDN no catálogo.
5. Para atualizar diretamente no cPanel, faça uma cópia de segurança, envie a imagem em `public_html/img/instagram/` e edite `public_html/data/atualizacoes.json` no Gerenciador de Arquivos. Preserve o JSON válido. Depois replique a alteração no GitHub: o próximo deploy sobrescreve esse arquivo.

A atualização do catálogo alimenta as duas páginas, sem alterar o HTML. Os campos opcionais `imagemInicio` e `altInicio` permitem usar outra foto do mesmo carrossel nos destaques da home. Eventos usa `imagem` e `alt`. Manter fotografias distintas em todas as áreas.

As imagens fixas de Sobre, Serviços e do destaque principal continuam referenciadas nos respectivos HTMLs. Um novo post no Instagram não aparece sozinho no site.

## Fotografias e procedência

Todas consultadas em 15/10/2026, seleção solicitada pelo responsável pelo site. As legendas curtas são resumos editoriais. Não foram incluídas histórias clínicas, notas de falecimento ou dados particulares dos atendidos.

| Arquivo | Fonte | Uso |
|---|---|---|
| dia-das-criancas.webp | https://www.instagram.com/sos_vidass/p/DefK_5Cj77k/ | Eventos |
| dia-do-idoso.webp | https://www.instagram.com/sos_vidass/p/DeNFyM1j0nu/ | Eventos |
| doacoes-acacias.webp | https://www.instagram.com/sos_vidass/p/DeKnLzUvll6/ | Eventos |
| certificados-cursos.jpg | https://www.instagram.com/sos_vidass/reel/DdWfiRkueLG/ | Eventos; capa de vídeo |
| oficina-artesanato.jpg | https://www.instagram.com/sos_vidass/reel/Db4GKvJvrXI/ | Eventos; capa de vídeo |
| educacao-digital.jpg | https://www.instagram.com/sos_vidass/reel/DcPQhTrv3mz/ | Serviços; capa de vídeo |
| equipe-parcerias.jpg | https://www.instagram.com/sos_vidass/p/DdZurxmvkzK/ | Quem somos na home |

O post Acácias possui o rótulo “Conteúdo de IA” no Instagram; o arquivo foi preservado tal como publicado. Capas dos vídeos têm resolução original de 640 px; não foram artificialmente ampliadas ou reconstruídas.

## Comportamento e limites

- O JavaScript usa somente conteúdo textual, caminhos locais de imagem e links permitidos do perfil da SOS Vidas.
- O JSON é solicitado sem cache; a política existente do diretório data exige revalidação.
- Em falha de rede/formato ou com JavaScript desligado, o link para o perfil continua disponível. Não existe dependência de widgets externos nem alteração de CSP.
- A agenda antiga tinha julho/agosto como eventos futuros; foi substituída por registros com fonte e orientação para consultar a programação.
- Identidade existente preservada: cores azul/amarelo/rosa, fonte e navegação; a seleção usa fotos quadradas, texto legível e colunas responsivas.

## Pendências editoriais externas

A bio do Instagram ainda aponta para `sosvidas.netlify.app`, desativado. A administradora deve substituir pelo domínio `https://sosvidasrp.org.br/`. O post fixado informa WhatsApp (16) 99435-8796, diferente do WhatsApp usado no site. Confirmar com a instituição antes de alterar os canais de contato em todas as páginas.

## Revisão visual e sazonal de 15/10/2026

- O hero da home voltou a `img/galeria/roda-conversa.jpg`; Serviços usa a roda externa `img/galeria/foto4.jpg` nas atividades em grupo.
- A foto `equipe-acolhimento.jpg` foi retirada do projeto e de todas as páginas. O deploy a move para fora de `public_html`; sua URL antiga responde 410. Não reutilizar essa imagem.
- Eventos apresenta períodos sazonais, sem prometer datas nem quantidades de atendidos. Datas específicas exigem confirmação da equipe.
- Cinco novas fotos foram selecionadas dos carrosséis e de uma publicação institucional. Imagens alternativas preservam o link e a data do post, variando a fotografia entre Início e Eventos.

| Arquivo | Fonte | Uso |
|---|---|---|
| idosos-convivencia.webp | https://www.instagram.com/sos_vidass/p/DeNFyM1j0nu/?img_index=2 | Destaque do encontro na home |
| criancas-alegria.webp | https://www.instagram.com/sos_vidass/p/DefK_5Cj77k/?img_index=2 | Destaque da celebração na home |
| herois-brincadeira.webp | https://www.instagram.com/sos_vidass/p/DefI8YyDymX/?img_index=5 | Home |
| herois-encontro.webp | https://www.instagram.com/sos_vidass/p/DefI8YyDymX/?img_index=6 | Eventos |
| visita-institucional.webp | https://www.instagram.com/sos_vidass/p/DdILcjbgJbE/ | Sobre |

A publicação da visita institucional está marcada como “Conteúdo de IA” no Instagram. Foi utilizada a imagem publicada, com conversão de formato e compressão para a web, sem reconstruir pessoas ou cenários.

# Atualização dos documentos de transparência

Nesta fase o site é estático. Não existe painel de edição para a administradora. Um responsável técnico atualiza os arquivos do repositório e publica pelo Git do cPanel.

1. Coloque o PDF em `docs/` e registre ou atualize o item em `data/transparencia.json`. O campo `arquivo` deve ser um caminho `/docs/...pdf` existente. Use `publicado: false` para ocultar um item sem apagar seu histórico no repositório.
2. Execute `npm run check`. O validador confere estrutura, caminhos, assinatura PDF e tamanho. Corrija todos os erros antes de publicar.
3. Revise a página de transparência localmente com `npm run build:cpanel` e um servidor HTTP local.
4. Faça commit, envie ao GitHub, use **Update from Remote** e **Deploy HEAD Commit** no cPanel. Confirme a página e abra o PDF publicado.

Um CMS próprio no cPanel está planejado em [MIGRACAO_DOMINIO.md](MIGRACAO_DOMINIO.md). Quando estiver pronto e testado, a administradora poderá usar `/admin` sem editar JSON ou Git.

# Segurança e resposta a incidentes

## Controles obrigatórios

- GitHub e Netlify do administrador com 2FA; passkey é preferível.
- Códigos de recuperação guardados offline.
- Repositório exclusivo da SOS Vidas.
- GitHub Apps instalados em **Only select repositories** e somente neste repositório.
- Funcionário acessa apenas Pages CMS por convite individual.
- Nenhuma senha, token, chave ou `.env` no Git.
- Repositório público recebe somente documentos já autorizados.
- Revisão trimestral de Apps, tokens, chaves SSH e colaboradores.
- Backup periódico por clone do Git.

## Permissões do Pages CMS

O GitHub App do Pages CMS atualmente solicita escrita em Administration, Actions e Contents no repositório instalado. Essa permissão é ampla. O repositório dedicado é o limite de impacto principal.

Pare a instalação se:

- a tela estiver selecionada como **All repositories**;
- forem solicitadas permissões novas não previstas;
- o App não estiver identificado como o Pages CMS oficial;
- a instituição não aceitar os termos e a política de privacidade.

Referências:

- https://pagescms.org/docs/guides/installing/github-app/
- https://pagescms.org/docs/configuration/collaborators/
- https://pagescms.org/terms/
- https://pagescms.org/privacy/

## Repositório público

Código e PDFs publicados já são material público, mas o histórico Git também será público. Nunca envie:

- rascunhos;
- documentos para publicação futura;
- documentos pessoais;
- lista de beneficiários;
- credenciais;
- backups;
- arquivos de configuração da conta.

Apagar um commit normal não garante eliminação de cópias, caches ou clones.

## Incidente de conteúdo incorreto sem sigilo

1. No Netlify, publique o último deploy correto.
2. Suspenda novas edições se necessário.
3. Reverta ou corrija o commit no GitHub.
4. Aguarde um deploy válido.
5. Teste a página e o PDF.
6. Registre causa, horário e correção.

## Incidente com dado pessoal ou sigiloso

1. Avise imediatamente o responsável institucional e o administrador.
2. Não apenas oculte o cartão.
3. Remova o arquivo da versão atual e publique.
4. Revogue o editor se houver suspeita de acesso indevido.
5. Suspenda o GitHub App se necessário.
6. Avalie remoção do histórico Git, caches e deploys anteriores.
7. Preserve evidências e procure orientação jurídica/LGPD.

Reescrever histórico é uma operação excepcional e destrutiva; não deve ser feita sem identificar exatamente o arquivo e coordenar todas as cópias do repositório.

## Conta comprometida

### GitHub

1. Troque a senha e encerre sessões.
2. Revogue tokens, chaves SSH e Apps desconhecidos.
3. Suspenda temporariamente Pages CMS e Netlify Apps.
4. Revise commits, regras e webhooks.
5. Restaure a última versão confiável.

### E-mail do editor

1. Revogue o colaborador no Pages CMS.
2. Proteja/recupere a conta de e-mail.
3. Revise commits desde o último acesso conhecido.
4. Convide novamente somente após o incidente ser resolvido.

## Continuidade

Se Pages CMS ficar indisponível, o site continua no ar. O administrador pode alterar o JSON e os PDFs por Git/GitHub. Se o serviço for abandonado, desinstale o App e escolha outra camada editorial; os dados permanecem no repositório.

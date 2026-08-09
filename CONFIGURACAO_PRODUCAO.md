# Configuração de produção — GitHub, Pages CMS e Netlify

Siga na ordem. Não conecte a produção antes de `npm run check` passar localmente.

## 1. Decisões iniciais

Registre:

- nome da organização GitHub da SOS Vidas;
- conta administradora e segundo proprietário de recuperação;
- e-mail funcional do editor;
- aceite institucional dos termos e privacidade do Pages CMS;
- visibilidade do repositório;
- plano real do Netlify: legado ou créditos;
- política de exclusão e responsável pela aprovação dos PDFs.

Recomendação para manter custo zero: organização GitHub Free e repositório público, depois de auditar todos os arquivos. Se o Netlify atual for legado e aceitar repositório privado sem cobrança, a instituição pode optar por privado.

## 2. Proteger sua conta GitHub

1. GitHub → foto do perfil → **Settings**.
2. **Password and authentication**.
3. Ative 2FA.
4. Cadastre uma passkey ou chave de segurança, se possível.
5. Baixe os códigos de recuperação e guarde-os offline.
6. Em **Applications**, remova OAuth Apps/GitHub Apps desconhecidos.
7. Em **SSH and GPG keys**, remova chaves antigas.
8. Não crie Personal Access Token para esta implementação; os GitHub Apps são suficientes.

## 3. Criar organização e repositório

### Organização

1. GitHub → foto do perfil → **Your organizations** → **New organization**.
2. Selecione o plano Free.
3. Use um nome institucional, por exemplo `sosvidas-rp`.
4. Adicione o desenvolvedor como owner.
5. Adicione, se possível, um segundo owner institucional com 2FA apenas para recuperação.
6. Organização → **Settings** → **Authentication security** → exija 2FA.
7. **Settings** → **Member privileges** → GitHub Apps → permita instalações somente por owners.

O funcionário editor não precisa ser membro da organização.

### Repositório

1. Na organização, crie `sosvidas-site`.
2. Escolha Public após a auditoria dos arquivos.
3. Não inicialize com README, `.gitignore` ou licença; esses arquivos já existem localmente.
4. Não envie a pasta universitária inteira. A raiz do repositório deve ser a pasta atual `sosvidas/`.

## 4. Publicar o código no GitHub

No Terminal:

```bash
cd /Users/felipe/projects/university/pratica-extensionista-iv/sosvidas
npm run check
git init -b main
git add .
git status
git commit -m "feat: adiciona gestão da transparência com Pages CMS"
git remote add origin https://github.com/ORGANIZACAO/sosvidas-site.git
git push -u origin main
```

Substitua `ORGANIZACAO` pelo nome real.

Antes do `git commit`, revise `git status`. A lista deve conter somente os arquivos dentro de `sosvidas/`. Não continue se aparecer `.env`, credencial, rascunho ou pasta universitária externa.

Se o repositório local já existir, não execute `git init`; confira `git remote -v` e adicione apenas o remote correto.

## 5. Proteger a branch de produção

Depois do primeiro push:

1. Repositório → **Settings** → **Rules** → **Rulesets**.
2. Crie um branch ruleset para `main` e deixe **Enforcement: Active**.
3. Ative bloqueio de force push.
4. Restrinja exclusão da branch.
5. Não exija pull request para todo push.
6. Não exija commit assinado no MVP.
7. Não crie bypass amplo.

Pages CMS precisa gravar diretamente em `main`. Requisitos de pull request ou assinatura podem bloquear o funcionário. Se escolher regras adicionais, teste primeiro com o GitHub App.

## 6. Instalar e configurar Pages CMS

### Avaliação prévia

Leia e obtenha aceite institucional:

- https://pagescms.org/terms/
- https://pagescms.org/privacy/
- https://pagescms.org/docs/guides/installing/github-app/

O App atualmente solicita escrita em Administration, Actions e Contents dentro do repositório instalado. Essa é a razão para usar repositório exclusivo.

### Instalação

1. Acesse `https://app.pagescms.org/`.
2. Entre com sua conta GitHub administradora.
3. Escolha instalar o GitHub App.
4. Selecione a organização da SOS Vidas.
5. Marque **Only select repositories**.
6. Selecione somente `sosvidas-site`.
7. Revise as permissões exibidas.
8. Instale e retorne ao Pages CMS.
9. Abra `sosvidas-site` e a branch `main`.
10. Confirme que `.pages.yml` foi reconhecido.
11. Abra **Transparência** e verifique as cinco seções e 31 documentos.

Pare imediatamente se a instalação estiver em **All repositories** ou solicitar acesso a projetos pessoais.

### Convite do funcionário

1. Dentro do repositório no Pages CMS, abra a área de colaboradores.
2. Convide o e-mail funcional do funcionário.
3. O funcionário aceita o convite sem criar GitHub.
4. Confirme que ele consegue editar conteúdo e mídia.
5. Confirme que não consegue administrar `.pages.yml`, colaboradores ou cache.

Use a identidade padrão do App nos commits. Não habilite `identity: user` em repositório público, pois o e-mail do funcionário pode ficar no histórico Git.

## 7. Prova de conceito obrigatória do upload

Antes de considerar o CMS aprovado:

1. Use um PDF já autorizado e público de aproximadamente 14,8 MB.
2. Crie uma seção temporária com **Exibir seção no site** desligado.
3. Adicione um documento temporário e envie o PDF.
4. Salve apenas uma vez.
5. Confirme no GitHub:
   - PDF íntegro;
   - JSON válido;
   - commits gerados;
   - nenhuma alteração fora de `docs/` e `data/transparencia.json`.
6. Meça quantos deploys/15 créditos a operação produziu.
7. Confirme que o editor consegue repetir o fluxo.
8. Remova o item temporário depois do teste.

Critério de aprovação: upload, commit e deploy funcionam sem GitHub para o funcionário e sem exceder a cota. Se o upload falhar, pare a implantação do CMS e reavalie a alternativa; não reduza a segurança nem compartilhe sua conta.

## 8. Conectar o site Netlify existente ao GitHub

Use o projeto existente para preservar `https://sosvidas.netlify.app/` e qualquer domínio futuro. Não crie outro site.

1. Entre no Netlify.
2. Abra o projeto atual da SOS Vidas.
3. Vá a **Project configuration** → **Build & deploy** → **Continuous deployment** → **Repository**.
4. Escolha vincular um repositório ou **Manage repository** → **Link to a different repository**.
5. Escolha GitHub.
6. Na instalação do Netlify GitHub App, use **Only select repositories**.
7. Selecione somente `sosvidas-site`.
8. Escolha a branch `main` como produção.
9. Mantenha base/package directory vazios, porque o site está na raiz do repositório.
10. Confirme:
    - Build command: `npm run build`;
    - Publish directory: `.netlify-dist`;
    - Node: `24.15.0`.
11. Salve e dispare o primeiro deploy.

O `netlify.toml` versionado já define esses valores e prevalece sobre configurações conflitantes da interface.

O build copia somente os arquivos públicos para `.netlify-dist`. Testes, scripts, configuração do CMS e documentação operacional não são publicados pelo Netlify.

Não desconecte o domínio e não altere o nome do projeto durante essa etapa.

## 9. Validar o primeiro deploy

No log, procure:

```text
Validação aprovada: 5 seções, 31 documentos (31 publicados).
Validação do site aprovada: 7 páginas HTML e referências locais verificadas.
tests 11
pass 11
```

Depois confira:

- página inicial;
- `/pages/transparencia`;
- cinco seções e contagens 12, 4, 8, 6 e 1;
- todos os 31 links;
- JSON em `/data/transparencia.json`;
- um PDF de cada pasta;
- cabeçalhos de segurança no navegador ou por `curl -I`;
- mapa da página de contato, para confirmar compatibilidade com CSP;
- script de copiar PIX na página Doações;
- menu mobile e galeria.

## 10. Monitoramento no plano gratuito

1. Netlify → **Usage & billing**: registre se a conta é Legacy ou Credit-based.
2. Se for Credit-based, confira créditos restantes após a publicação.
3. Mantenha recarga automática e upgrade desativados sem autorização.
4. Confira o GitHub Check/Status do Netlify nos commits.
5. Revise o painel de deploy após alterações do funcionário.
6. Configure alertas de uso disponíveis para o e-mail de cobrança.

Na documentação atual, notificações de deploy por e-mail são recurso Pro/Enterprise. No Free, use os checks/status do GitHub, o painel do Netlify e as notificações de uso/cobrança.

O plano gratuito atual por créditos possui 300 créditos/mês; deploy de produção consome 15, tráfego 20/GB e 10 mil requisições consomem 2. A conta pode ser legada se criada antes de 4 de setembro de 2025.

Referência: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/

## 11. Treinamento e aceite

O funcionário deve executar sem condução:

1. login pelo convite;
2. correção de texto;
3. inclusão de documento;
4. ocultação e reexibição;
5. conferência na produção;
6. identificação de erro e acionamento do administrador.

Entregue `OPERACAO_TRANSPARENCIA.md` e registre o aceite.

## 12. Rollback

Se uma publicação incorreta chegar ao ar:

1. Netlify → **Deploys**.
2. Abra o último deploy correto.
3. Use **Publish deploy**.
4. No GitHub, reverta ou corrija o commit causador.
5. Aguarde o novo deploy válido.
6. Teste novamente.

O rollback do Netlify é temporário se um novo commit de produção for enviado. A correção no GitHub é obrigatória.

## 13. Revisões periódicas

### Mensal

- créditos, banda e deploys;
- tamanho de novos PDFs;
- falhas de build.

### Trimestral

- Pages CMS e Netlify instalados somente no repositório correto;
- colaboradores ativos;
- tokens e chaves SSH;
- backup local atualizado.

### Semestral

- teste de rollback;
- segundo owner/recovery;
- atividade e termos do Pages CMS;
- necessidade de migrar hospedagem ou PDFs.

## 14. Critério de conclusão

A configuração externa estará concluída quando:

- repositório exclusivo criado e protegido;
- código publicado em `main`;
- dois GitHub Apps limitados ao repositório;
- Pages CMS reconhecendo o schema;
- funcionário convidado e testado sem GitHub;
- upload de 14,8 MB aprovado;
- Netlify existente ligado ao Git;
- build/testes aprovados;
- 31 PDFs conferidos;
- rollback demonstrado;
- cotas e responsáveis registrados.

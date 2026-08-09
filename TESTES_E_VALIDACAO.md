# Testes e validação

## Validação completa local

Na raiz do repositório:

```bash
npm run check
```

Resultado esperado:

- `Validação aprovada: 5 seções, 31 documentos`;
- `Validação do site aprovada: 7 páginas HTML`;
- `tests 11` e `pass 11`;
- código de saída `0`.

Os três PDFs atuais acima de 5 MB geram avisos, não falhas. Nenhum pode ultrapassar 20 MB.

## Verificações executadas

### Conteúdo

- sintaxe e estrutura do JSON;
- UUID v4 único para seções e documentos;
- campos obrigatórios e limites de caracteres;
- proibição de HTML nos textos editoriais;
- números de ordem e flags de publicação;
- caminhos somente sob `/docs/`;
- bloqueio de URL externa, traversal, query e fragmento;
- existência física do PDF;
- assinatura `%PDF-`;
- limite de 20 MB;
- aviso para arquivos acima de 5 MB;
- aviso para PDF sem referência no JSON.

### Site

- referências locais de HTML e CSS;
- contêiner e módulo de Transparência;
- ausência dos links antigos codificados no HTML;
- ausência de `innerHTML` no módulo editorial;
- arquivos de CMS/build/headers obrigatórios;
- cabeçalhos de segurança;
- padrões óbvios de token, chave privada e AWS key.

### Casos automatizados

- caminho PDF seguro e caminhos maliciosos;
- ocultação e ordenação;
- formato de dados inesperado;
- conjunto real com 31 PDFs;
- URL externa e `../`;
- UUID duplicado;
- HTML malicioso;
- PDF falso;
- PDF maior que o limite;
- PDF órfão;
- JSON inválido.

## Servidor local

```bash
npm run build
cd .netlify-dist
python3 -m http.server 8765
```

Abra:

```text
http://localhost:8765/pages/transparencia.html
```

Checklist manual:

- cinco seções e 31 documentos;
- contagens 12, 4, 8, 6 e 1;
- palavras destacadas em rosa;
- descrições das emendas;
- ordem igual à página anterior;
- todos os botões PDF abrem nova aba;
- layout em 320 px e desktop;
- foco de teclado visível;
- mensagem de erro ao bloquear `data/transparencia.json`;
- mensagem adequada com JavaScript desativado.

Para encerrar o servidor, pressione `Ctrl+C` e retorne à raiz com `cd ..`.

## Teste do build do Netlify

O Netlify executa `npm run build`, que chama as mesmas verificações. No primeiro deploy, confirme no log:

```text
Validação aprovada: 5 seções, 31 documentos (31 publicados).
Validação do site aprovada: 7 páginas HTML e referências locais verificadas.
tests 11
pass 11
Artefato do Netlify preparado em .netlify-dist (31 PDFs).
```

O diretório `.netlify-dist` deve conter somente o site público. Ele não deve conter `scripts/`, `tests/`, `.pages.yml`, `package.json` ou `netlify.toml`.

## Teste negativo controlado

Faça somente em branch técnica ou deploy preview:

1. altere temporariamente um caminho do JSON para `/docs/inexistente.pdf`;
2. execute `npm run build`;
3. confirme código diferente de zero e mensagem `arquivo não existe`;
4. desfaça a alteração;
5. execute `npm run check` novamente.

Não envie o teste inválido para a branch de produção.

## Verificação depois do deploy

Substitua a URL se o domínio mudar:

```bash
curl -I https://sosvidas.netlify.app/pages/transparencia
curl -I https://sosvidas.netlify.app/data/transparencia.json
curl -I https://sosvidas.netlify.app/docs/institucional/cartao-cnpj.pdf
```

Confirme status `200`, `Content-Security-Policy`, `X-Content-Type-Options` e política de cache do JSON.

Depois, faça o teste funcional real pelo Pages CMS:

1. convite para e-mail sem GitHub;
2. edição de texto;
3. ocultar e reexibir item;
4. upload autorizado de aproximadamente 14,8 MB;
5. publicação automática;
6. revogação do colaborador.

O teste de upload hospedado é obrigatório porque não pode ser reproduzido apenas no ambiente local.

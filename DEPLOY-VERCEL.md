# Publicar o portfólio na Vercel

## Situação verificada

O portfólio está preparado para **hospedagem estática na Vercel**, mantendo React, TypeScript, Vinext e Vite. O build foi executado localmente com Node 24.18.0. Nenhum commit, push ou deploy foi feito.

O build original usa os plugins Sites/Cloudflare e gera um Worker em `dist/server`. Esse Worker não é uma Vercel Function, e a presença de `next` no package.json não transforma sua saída em `.next` compatível com o preset Next.js.

A versão instalada do Vinext (`1.0.0-beta.5`) suporta `output: "export"`. O build específico para Vercel ativa essa opção, usa o plugin Vinext sem o adaptador Cloudflare e gera `dist/client/index.html`, `404.html`, CSS, JavaScript de hidratação e assets. A página `/` foi confirmada como estática pelo prerender do próprio Vinext. Não há banco de dados, APIs, autenticação ou dados por requisição no grafo da página atual.

Não foi necessário adicionar Nitro ou outra dependência. As interações continuam no JavaScript do navegador. Se o site passar a depender de APIs, autenticação ou SSR, será necessário reavaliar o adaptador de servidor; esta configuração não fornece essas funções.

## Configuração da Vercel

O arquivo `vercel.json` já define:

- Framework Preset: **Other** (`framework: null`).
- Build Command: **`npm run build:vercel`**.
- Output Directory: **`dist/client`**.
- Install Command: **`npm ci --include=dev --include=optional`**.
- Node.js: **24.x**, fixado em `package.json` e no metadado raiz do lockfile.
- Root Directory: a raiz que contém `package.json`, `vite.config.ts` e `vercel.json`.
- Variáveis de ambiente: nenhuma necessária para o portfólio atual. O script define `PORTFOLIO_STATIC_EXPORT=1` somente no processo de build.

Não selecione Next.js, não execute `next build` e não configure `.next`, `out`, `public` ou `dist/server` como saída. O diretório de saída desta versão do Vinext foi confirmado no código instalado e na compilação executada: é `dist/client`.

## Alterações de preparação

- `vercel.json`: configuração explícita da hospedagem estática.
- `vite.config.ts`: modo de exportação sem adaptadores Cloudflare/Sites; o fluxo original continua disponível nos demais comandos.
- `next.config.ts`: `output: "export"` somente para esse modo. Essa opção é lida pelo Vinext.
- `scripts/build-vercel.mjs`: executa o build e valida o artefato.
- `scripts/run-static-build.mjs`: chama o CLI instalado do Vinext. No Windows, evita o encerramento forçado de sucesso que causou um abort nativo após o prerender. Erros continuam retornando falha; no Linux o encerramento original não é alterado.
- `scripts/verify-static-export.mjs`: verifica HTML, CSS, hidratação, caminhos, capitalização e hashes dos assets; rejeita referência/diagnóstico na saída.
- `package.json` e `package-lock.json`: comando adicional e Node 24.x; dependências e versões preservadas.
- `diagnostics/font-comparison.tsx`: código da comparação preservado fora de `app`; a página `/comparacao-fontes` não faz mais parte das rotas.
- `.gitignore` e `.vercelignore`: referências e diagnóstico permanecem locais. Os assets aprovados em `public` continuam na entrega.
- `scripts/check-portfolio.mjs`: hashes de aprovação fixados no teste, permitindo executá-lo também em um clone sem a pasta local de referências.

Nenhum arquivo visual da home, fonte, retrato, animação ou cursor foi modificado nesta etapa.

## Verificações realizadas e limites

- `npm.cmd run build:vercel`: compilação e prerender concluídos com código de saída 0.
- Artefato verificado com 31 arquivos, incluindo home e 404; nenhuma pasta de referências nem rota de comparação de fontes.
- `node scripts/verify-static-export.mjs --http`: servidor temporário servindo **somente dist/client**, sem dev server. Os 18 caminhos de produção retornaram 200 e bytes idênticos aos arquivos do artefato; comparação/referências/diagnóstico retornaram 404.
- Conferidos os nomes exatos dos arquivos, incluindo espaços no nome da fonte Centaur, @font-face, imagens e cursores escolhidos dinamicamente pelo JavaScript.
- ESLint, TypeScript e testes de física, revelação e dispersão passaram.
- Conferida a presença dos pacotes opcionais Linux no lockfile, necessários ao toolchain nativo.

O artefato está pronto para importação, mas **ainda não foi executado na infraestrutura da Vercel/Linux**. Não houve instalação limpa em Linux nem deploy remoto. O Vinext permanece em versão beta. Os testes HTTP não comprovam aceitação das fontes pelo decodificador de um navegador nem validação visual; essa conferência permanece pendente por indisponibilidade do acesso automatizado ao navegador.

`npm run build` continua sendo o build original para Cloudflare/Sites. `npm start` também continua sendo o preview do Worker e não deve ser usado para servir a exportação estática. Cada build reescreve `dist`; execute novamente `build:vercel` antes de verificar ou publicar seu artefato.

## Conferir localmente

No PowerShell, na raiz do projeto:

```powershell
npm.cmd run build:vercel
node scripts/verify-static-export.mjs --http
```

Para visualizar manualmente o artefato, usando o Python já instalado:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory dist/client
```

Abra `http://127.0.0.1:4173`. Se a porta estiver ocupada, escolha outra e use a porta exibida. Esse servidor não executa SSR. Pare com Ctrl+C ao terminar.

Confira a entrada completa e o pulo, fontes combinadas, projetos, scroll, retrato, cursores e redução de movimento em desktop/mobile. Em Network, confirme ausência de 404 para assets; `/comparacao-fontes` e os diretórios locais devem retornar 404.

## Publicar pelo GitHub — ações futuras

Esta pasta ainda não contém repositório Git. Os comandos abaixo são instruções para quando você decidir publicar; não foram executados nesta preparação.

1. No GitHub, crie um repositório vazio. Não inicialize README ou .gitignore no GitHub, pois eles já existem localmente. Ele pode ser privado.
2. Na raiz do projeto, execute os comandos abaixo, substituindo usuário e repositório. Antes do commit, confira `git status` para revisar os arquivos. `node_modules`, `dist`, estado local, referências e diagnóstico estão ignorados.

```powershell
git init
git add .
git status
git commit -m "Prepara portfolio para Vercel"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

3. Na Vercel, escolha **Add New → Project**, conecte o GitHub e importe esse repositório.
4. Escolha a raiz correta e confira **Other**, Node **24.x**, Build Command `npm run build:vercel`, Output Directory `dist/client` e o comando de instalação acima. A configuração deve vir de `vercel.json`; corrija qualquer preset Next.js detectado automaticamente. Não adicione variáveis ou segredos para este portfólio.
5. Somente quando decidir publicar, clique **Deploy**. No log, confirme a rota `/` estática e a mensagem `Exportação validada`.
6. Abra o endereço `.vercel.app` e faça a conferência visual. Verifique fontes/imagens/cursores na aba Network e confirme que `/comparacao-fontes` não existe.
7. Após conectar o GitHub, novos pushes na branch de produção podem disparar novos deploys automaticamente.

## Fontes oficiais consultadas

- [Vinext: suporte e exportação estática](https://github.com/cloudflare/vinext#project-status). A documentação e o código da versão instalada também foram inspecionados.
- [Vercel: configuração de build e diretório público](https://vercel.com/docs/builds/configure-a-build).
- [Vercel: configuração por vercel.json e framework null/Other](https://vercel.com/docs/project-configuration/vercel-json).
- [Vercel: versões de Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
- [Vercel: integração com GitHub](https://vercel.com/docs/git/vercel-for-github).

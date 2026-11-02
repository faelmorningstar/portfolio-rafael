# Revisão do portfólio — estado atual

## Tipografia definitiva

A combinação usa `public/Centaur MT Oldstyle Figures Bold Italic.otf` nas maiúsculas e `public/Alchemion-Demo.ttf` nas minúsculas. Os arquivos originais não foram modificados, movidos ou duplicados.

- Centaur: OTF/OpenType, peso interno 700, itálico confirmado nos metadados.
- Alchemion: TTF/TrueType, peso 400, estilo normal.
- Ambas contêm letras básicas e acentos portugueses em maiúsculas e minúsculas.
- Unicode-range reserva A–Z, U+00C0–00D6 e U+00D8–00DE para Centaur. Alchemion atende os demais intervalos.
- O componente DisplayText marca grupos de capitais para usar 700/italic, enquanto os outros caracteres mantêm 400/normal. Isso permite respeitar os dois estilos reais dentro do mesmo texto. Não há síntese artificial de negrito/itálico nos elementos de destaque.
- Georgia/serif continua como alternativa para símbolos ausentes na Alchemion (hífen, barra, ponto e travessão). O fallback não é o destino previsto das letras maiúsculas/minúsculas.

## Escrita e escopo

Os títulos usam Rafael Amaral Silva, Solve, Coagula, Projetos e Contato. Nenhum desses títulos tem text-transform para maiúsculas. Marcas e competências mantêm sua grafia original, incluindo OulDesign, Quick Filler, Project Pixel, FRONT-END, PYTHON / APIs e NEXT.JS / TYPESCRIPT.

A combinação continua restrita aos elementos que usavam Alchemion. Parágrafos, legendas, botões, rodapé e outras famílias não foram alterados. Os tamanhos e alturas de linha existentes foram mantidos nesta troca, pois as estimativas de métricas não indicaram necessidade de ajuste adicional.

## Arquivos desta etapa

- `app/globals.css`: registro da Centaur com peso/estilo próprios, faces com unicode-range, classe das capitais e desativação de síntese nos destaques.
- `components/display-text.tsx`: separação das capitais em spans, preservando texto real e selecionável.
- `app/page.tsx`: escrita solicitada e aplicação do componente nos destaques, nomes dos projetos e competências.
- `app/comparacao-fontes/page.tsx`: comparação atualizada para Centaur, Alchemion, combinação e Georgia; carregamento e provas de pixels respeitam 700/italic nas capitais e 400/normal nas minúsculas.
- `REVISAO-PORTFOLIO.md`: registro atual das alterações e limitações.
- Diagnósticos temporários em `.sites-runtime` foram atualizados para os arquivos atuais; não fazem parte da aplicação.

Não restam declarações ou referências à fonte removida na aplicação. Não há preload para o arquivo removido. A busca no CSS servido e no HTML da comparação também não encontrou essa referência.

## Verificações realizadas

- ESLint, TypeScript e compilação de produção Vinext/Vite: passaram.
- Testes existentes do agendador de efeitos e integridade dos assets: passaram.
- Inspeção dos metadados reais de peso e estilo e das tabelas de glifos.
- Teste dos intervalos unicode-range: sem interseção; capitais portuguesas e minúsculas cobertas pelos respectivos arquivos.
- Renderização HTML do componente: texto original preservado, somente maiúsculas marcadas, marcas/competências intactas.
- HTTP 200 para página principal, comparação e fontes. Bytes das fontes servidas idênticos aos arquivos locais, conferidos por SHA-256.
- HTML inicial contém a nova escrita. CSS servido não referencia o arquivo removido.
- Estimativas estáticas com avanços reais dos glifos e fallback Georgia em 1440, 375 e 320 px: títulos e nomes cabem nas colunas; competências cabem na altura reservada. Essas estimativas não substituem o motor de layout do navegador.

## Verificação visual pendente

O browser access host permanece indisponível. O agente não consultou Rendered Fonts nem confirmou visualmente sobreposição/corte ou a fonte efetivamente pintada em desktop/mobile.

Abra http://localhost:5173/comparacao-fontes. A página usa o mesmo CSS e o mesmo DisplayText do portfólio. Ao abrir, executa FontFace.load para testar aceitação dos arquivos pelo navegador e compara pixels de capitais e minúsculas com as famílias diretas e Georgia. Os resultados aparecem no próprio navegador. Esses testes ainda não foram observados pelo agente.

Conferir manualmente em 1440, 375 e 320 px:

- Iniciais Centaur e minúsculas Alchemion, incluindo ÁÉÍÓÚ ÃÕ Ç e áéíóú ãõ ç.
- Nenhum corte/overlap dos títulos, sobretudo iniciais itálicas; foco e scroll preservados.
- F12 → Elements → Computed → Rendered Fonts para identificar os arquivos que desenham as letras. O valor de font-family isolado não comprova isso.

## Executar

O servidor existente foi verificado em http://localhost:5173. Se estiver parado, execute `npm.cmd run dev` e use a porta exibida pelo terminal.

Comandos de verificação: `npm.cmd run lint`, `node node_modules/typescript/bin/tsc --noEmit --incremental false`, `node scripts/check-portfolio.mjs` e `npm.cmd run build`.

## Efeitos e conteúdo preservados

Cromo, retratos aprovados, chuva restrita à hero, transformação de entrada, cursores, seleção de projetos, dispersão do contato e anéis foram preservados. A chuva encerra com a entrada ou ao pular; a redução de movimento mantém o estado final. Os assets aprovados não foram alterados.

Os projetos continuam aguardando mídias e links reais de demonstração/repositórios. Não há destinos inventados. LinkedIn e GitHub gerais foram preservados.

Duração/dispersão: EFFECT_SETTINGS em app/portfolio-effects.tsx. Cromo: --chrome em app/globals.css.

Esta pasta não contém repositório Git. Nenhum commit, push ou publicação foi executado.

## Três melhorias estéticas — hero, trajetória e retrato final

### Hero após a entrada

- A rotação angular que antes existia somente no contato foi extraída para createAngularMotion em lib/portfolio-motion.ts e reutilizada pelos dois locais.
- HeroRings usa os mesmos anéis SVG, com fatores distintos para anel externo, interno e símbolos. Não há rotação automática nem transformação na fotografia.
- O reflexo é um arco prateado estreito, sem blur, que acompanha o ângulo por interpolação e perde intensidade ao sair.
- A hero só habilita a interação após conclusão, pulo ou alternativa final da entrada. Durante carregamento e transformação, o estado interativo permanece desabilitado. O visual e os tempos da entrada não foram redesenhados.
- Transição angular contínua com atan2(sin, cos), inércia e encerramento dos quadros em repouso. Pausa fora da tela/aba oculta; eventos e recursos são limpos ao desmontar. Sem hover ou com redução de movimento, os anéis ficam estáticos.

### Trajetória pelo scroll

- app/use-trajectory-reveal.ts usa IntersectionObserver e Web Animations API, sem capturar eventos de rolagem.
- Desktop: Solve/texto, anéis, frase, Coagula/texto, com intervalos de 110 ms. Mobile: cada bloco começa ao entrar na área visível, sem intervalo artificial.
- Duração de 560 ms, deslocamento de 24 px e escala .97 somente no invólucro dos anéis. O canvas dos Magic Rings não disputa essa transformação.
- A revelação acontece uma vez por montagem/carregamento. Animações pausam se seu elemento sair da tela ou a aba ficar oculta.
- A ocultação inicial só é instalada pelo JavaScript depois de conferir suporte às APIs; o HTML original continua visível sem JS. Redução de movimento mostra os blocos diretamente.
- Solve e Coagula tiveram aumento moderado do tamanho, com medidas responsivas e sem alteração das fontes combinadas.

### Recorte do contato

- A base tem máscara circular própria; os fragmentos ficam em canvas irmão fora dessa máscara.
- Imagem proporcional a 68% do palco, centralizada, com máscara de raio 38%. Essa margem preserva rosto e chifres; não há distorção de proporção.
- Na preparação, flood fill remove apenas a transparência do preto quase puro conectado às bordas (máximo RGB 3, diferença máxima entre canais 2). RGB não é modificado, e preto interno isolado é preservado. O arquivo original permanece intacto.
- A base é progressivamente apagada nas regiões que passam para os fragmentos. No retorno, as contribuições voltam à base; em repouso, a base é desenhada integralmente e não há fragmentos.
- Leituras de pixels somente na preparação e no redimensionamento. Fonte preparada em resolução nativa; DPR limitado por tamanho de tela.
- A alternativa HTML sem efeito também tem máscara circular e composição lighten limitada ao recorte, nivelando o preto ao fundo da seção. Com JS, a camada preparada substitui essa alternativa; em dispositivos estáticos, o efeito faz somente o desenho inicial.

### Arquivos

Produção: app/page.tsx, app/globals.css, app/portfolio-effects.tsx, app/use-trajectory-reveal.ts e lib/portfolio-motion.ts. As fontes, os assets aprovados e o componente DisplayText não foram modificados.

Testes: scripts/check-portfolio.mjs atualizado; scripts/check-trajectory-reveal.mjs e scripts/check-portrait-runtime.mjs adicionados. Nenhuma dependência foi adicionada.

### Verificações efetivamente realizadas

- ESLint, TypeScript e build Vinext/Vite: passaram.
- Física real compartilhada: repouso sem giro automático, passagem nos dois sentidos de -π/+π, velocidades distintas, desaceleração e término da intensidade do reflexo.
- Hook real de revelação com observadores controlados: sequência desktop, entrada individual mobile, uma execução, pausa por visibilidade, limpeza e alternativas com redução/sem suporte.
- Efeito real do contato com canvas/eventos controlados: dispersão, força maior no dragão, ocultação da base, retorno sem fragmentos, pausa fora da tela/aba, limpeza, ausência de leituras por quadro e estados estáticos.
- Imagem real 1254×1254: nenhum canal RGB modificado pela limpeza; nenhum pixel com brilho acima de 30 ficou fora do recorte calculado. Amostra do recorte inspecionada fora do navegador, preservando rosto e chifres. Essa amostra não é captura da página.
- Estimativas de métricas para 1440, 375 e 320 px passaram, incluindo o aumento de Solve/Coagula.
- HTTP 200 da página e imagens; conferida a ordem dos quatro blocos, a chuva como filha da hero e a camada dos fragmentos fora da máscara. HTML entregue não tem a classe de ocultação de revelação.

### Limitações e conferência manual

O browser access host segue indisponível. Não foram confirmados visualmente o site, console, scroll horizontal, revelação em rolagem real, pular/rever a entrada nem a interação real com mouse/touch em desktop/mobile. Os testes de canvas/observadores são de lógica e ciclo de vida, não de pintura do navegador.

Abra http://localhost:5173 e recarregue para rever a entrada; repita usando Pular animação. Depois, mova o cursor ao redor do retrato da hero nos dois sentidos e retire para conferir desaceleração/reflexo. Na trajetória, confira a sequência e retorne pelo scroll para confirmar que não reaparece. No contato, disperse os dois lados e retire o cursor para conferir retorno. Repita em 375/320 px e com redução de movimento, verificando ausência de cortes e rolagem horizontal.

Comandos adicionais: node scripts/check-trajectory-reveal.mjs e node scripts/check-portrait-runtime.mjs. Sem commit, push ou publicação.

## Preparação para Vercel

O destino preparado é hospedagem estática do Vinext, com `npm run build:vercel`, Output Directory `dist/client`, Framework Other e Node 24.x. O fluxo original Cloudflare/Sites foi mantido nos demais comandos. A documentação e o código da versão instalada foram conferidos; não foi presumida compatibilidade com o preset Next.js.

Build e prerender locais concluídos com código 0. Saída verificada: 31 arquivos, home e 404, sem referências ou comparação de fontes. Servidor temporário do artefato validou 18 caminhos, incluindo fontes com espaços, imagens e cursores; arquivos corretos por SHA-256 e rotas locais com 404. Lint, TypeScript e testes passaram. Manifestos e lockfile consistentes; nenhuma dependência nova.

A comparação de fontes foi preservada em `diagnostics/font-comparison.tsx`, fora das rotas e ignorada no Git/Vercel. A pasta de referências permanece local, também ignorada. O teste de integridade dos assets usa hashes fixos e não depende dessa pasta.

O CLI beta apresentou um abort de encerramento no Windows após gerar a saída; o runner específico evita o process.exit(0) forçado somente nessa plataforma, deixando o encerramento natural. Erros continuam propagados; no Linux o comportamento original do CLI é mantido.

Não houve deploy nem instalação/build limpo em Linux. A aceitação das fontes e o visual em navegador continuam sem validação automatizada. Exportação estática não fornece APIs, SSR ou autenticação por requisição. O passo a passo GitHub → Vercel, as configurações e as fontes oficiais consultadas estão em `DEPLOY-VERCEL.md`. Nenhum commit ou push foi executado.

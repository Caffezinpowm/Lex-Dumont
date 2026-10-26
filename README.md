# Lei Espacial · Dumont Station

Visualizador **não oficial** da Lei Espacial da **Dumont Station / Gaby Station** (Space Station 14). O site transforma o conteúdo do guidebook do servidor em uma referência rápida, pesquisável e legível, sem alterar o texto legal.

> **Aviso:** este projeto não é afiliado à Dumont Station, à Gaby Station, à Space Station 14 ou à Goob Station. Em caso de divergência, o **guidebook dentro do jogo** é a referência oficial. O conteúdo reproduzido pertence ao repositório de origem.

---

## Sumário

- [Recursos](#recursos)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Instalação e uso](#instalação-e-uso)
- [Build e pré-visualização](#build-e-pré-visualização)
- [Deploy](#deploy)
  - [Netlify](#netlify)
  - [GitHub Pages](#github-pages)
  - [Outros servidores estáticos](#outros-servidores-estáticos)
- [Rotas](#rotas)
- [Dados](#dados)
- [Busca](#busca)
- [Acessibilidade](#acessibilidade)
- [Tema e favoritos](#tema-e-favoritos)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Fontes e licenças](#fontes-e-licenças)
- [Limitações e próximos passos](#limitações-e-próximos-passos)

---

## Recursos

- **Busca global** em crimes, modificadores, verbetes do código e documentos.
  - Ignora acentos e diferenças de maiúsculas/minúsculas.
  - Tolera pequenos erros de digitação.
  - Encontra códigos como `3-03` e `m-04`.
  - Resultados agrupados por tipo, com trechos destacados.
  - Navegação por teclado e atalhos `/`, `Ctrl+K` e `Cmd+K`.
- **Crimes**
  - Filtros de nível com seleção múltipla, filtro textual e visões em cartões ou tabela.
  - Agrupamento por nível e por série.
  - Página de detalhe com texto integral, pena, nível, série, crimes equivalentes, verbetes relacionados, anterior/próximo e cópia de link, código e pena.
- **Guia rápido**
  - Matriz de níveis × séries com as lacunas de numeração preservadas.
  - Resumo de penas e atalhos para os crimes correspondentes.
- **Modificadores**
  - Separação entre agravantes, atenuantes e regras que exigem decisão manual.
  - Página de detalhe com exemplos e referências.
  - Calculadora opcional de regras com resultado textual copiável — apenas soma as regras selecionadas, sem substituir a decisão do Comando.
- **Código espacial e documentos**
  - Índice por capítulos e páginas de leitura com sumário lateral, âncoras, cópia de trechos e impressão.
- **Favoritos** persistidos em `localStorage`, com contagem no cabeçalho e página dedicada.
- **Tema escuro por padrão**, alternância para claro e respeito à preferência do sistema quando não há escolha salva.
- **Navegação responsiva** com sidebar no desktop, menu móvel acessível, breadcrumbs e “voltar ao topo”.
- **Acessibilidade**: foco visível, navegação por teclado, nomes acessíveis, alvos de toque adequados, contraste WCAG AA, suporte a `prefers-reduced-motion` e estilos de impressão.
- **Roteamento real** com History API, fallback para hospedagem estática e suporte a subdiretórios.

## Stack

- [Vite](https://vite.dev/) para desenvolvimento e build.
- TypeScript sem framework de UI.
- CSS próprio, dividido por responsabilidade.
- [marked](https://marked.js.org/) para Markdown e [DOMPurify](https://github.com/cure53/DOMPurify) para sanitização.
- Fontes WOFF2 auto-hospedadas.
- Sem backend e sem banco de dados: o site é totalmente estático.

## Requisitos

- **Node.js 20.19+ ou 22.12+** (exigência do Vite 7).
- npm 10+.
- Navegador moderno com ES2022, History API, `inert` e `color-mix()` (Chrome/Edge 111+, Firefox 113+, Safari 16.2+).

## Instalação e uso

```bash
# instalar dependências
npm install

# servidor de desenvolvimento com recarregamento
npm run dev

# verificação de tipos
npm run typecheck
```

O servidor de desenvolvimento abre por padrão em `http://localhost:5173/`.

## Build e pré-visualização

```bash
# build de produção (typecheck + Vite + fallback 404.html)
npm run build

# servir o build localmente
npm run preview
```

O build gera `dist/`. A pré-visualização fica em `http://localhost:4173/` por padrão. Ao pré-visualizar um build de subdiretório, defina o mesmo `VITE_BASE_PATH` também no comando de preview.

O `build` executa três etapas:

1. `tsc --noEmit` valida os tipos.
2. `vite build` gera os arquivos otimizados.
3. `node scripts/copy-404.mjs` copia `dist/index.html` para `dist/404.html`, necessário para rotas profundas no GitHub Pages.

## Deploy

### Netlify

O repositório já inclui `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Também existe `public/_redirects` com a mesma regra, copiada para `dist/`. Basta conectar o repositório à Netlify; nenhuma variável de ambiente é necessária para publicar na raiz do domínio.

### GitHub Pages

1. Gere o build com o caminho correto do repositório:

   ```bash
   # Linux/macOS
   VITE_BASE_PATH=/nome-do-repositorio/ npm run build

   # PowerShell
   $env:VITE_BASE_PATH = "/nome-do-repositorio/"; npm run build
   ```

2. Publique o conteúdo de `dist/` na branch configurada para Pages (por exemplo, `gh-pages`).

3. Use `dist/404.html` como fallback. Ele contém a aplicação e resolve rotas profundas no cliente. Observação: o GitHub Pages responde com status HTTP 404 nessas rotas, embora a página seja exibida corretamente. Para um domínio próprio na raiz, gere o build sem `VITE_BASE_PATH`.

O `VITE_BASE_PATH` deve começar e terminar com `/`. Ele afeta assets, links internos e o roteador.

### Outros servidores estáticos

Configure um fallback de SPA que devolva `index.html` para qualquer rota não encontrada. Sem esse fallback, apenas a página inicial e os arquivos existentes funcionarão em acesso direto.

## Rotas

| Rota | Conteúdo |
| --- | --- |
| `/` | Visão geral, destaques, níveis e atalhos |
| `/crimes` | Lista e filtros de crimes |
| `/crimes/3-03` | Detalhe de um crime |
| `/guia-rapido` | Matriz de níveis × séries |
| `/modificadores` | Agravantes, atenuantes e calculadora |
| `/modificadores/m-04` | Detalhe de um modificador |
| `/codigo` | Índice do código espacial |
| `/codigo/homicidio` | Verbete do código |
| `/documentos` | Índice de documentos |
| `/documentos/contrabando` | Documento completo |
| `/favoritos` | Itens salvos localmente |
| qualquer outra rota | Página 404 com atalhos |

Os identificadores de crimes e modificadores são os códigos da fonte (por exemplo, `3-03` e `m-04`). Os identificadores de verbetes e documentos vêm diretamente do JSON (por exemplo, `homicidio` e `contrabando`).

## Dados

A única fonte de conteúdo é [`public/space-law.json`](public/space-law.json). Nenhum texto legal é duplicado no código.

O arquivo contém:

- metadados da fonte (`fonte`): repositório, branch, caminhos e licença;
- `niveis`: níveis de gravidade e penas-base;
- `modificadores`: agravantes, atenuantes e regras manuais;
- `codigo_espacial`: capítulos e verbetes;
- `documentos`: documentos completos;
- `guia_rapido`: séries, níveis, células e descrição;
- `moeda` e `unidade_pena` para formatar penas.

Para atualizar o conteúdo:

1. Substitua `public/space-law.json` pelo arquivo atualizado, mantendo a mesma estrutura.
2. Rode `npm run build`.
3. Confira as contagens e os detalhes no site.

O visualizador **não inventa, completa nem renumera** o conteúdo. Lacunas como `4-02`, `5-02` e `5-05` são preservadas, assim como capítulos sem numeração reconhecida. A validação de carregamento falha de forma explícita se a estrutura obrigatória estiver ausente ou se o guia rápido referenciar um nível desconhecido.

## Busca

A busca é implementada localmente em TypeScript, sem serviço externo. Ela indexa:

- nome, código, descrição e texto legal dos crimes;
- nome, código, modificação e descrição dos modificadores;
- título e conteúdo dos verbetes;
- título, resumo e conteúdo dos documentos.

Características:

- normalização de acentos, caixa, pontuação e espaços;
- correspondência exata e parcial, com tolerância a erros de digitação;
- bônus para correspondências no título e no código;
- agrupamento por tipo e trechos com destaque;
- navegação com `↑`/`↓`, `Enter` para abrir e `Esc` para fechar;
- atalhos `/`, `Ctrl+K` e `Cmd+K`;
- estado vazio com sugestões de termos.

## Acessibilidade

O site foi auditado com axe-core (WCAG 2.1 A/AA) nas rotas principais, nos temas escuro e claro e em viewport móvel, incluindo a busca aberta, sem violações.

Cuidados implementados:

- estrutura semântica com landmarks, headings e listas;
- skip link para o conteúdo;
- foco visível e ordem de tabulação previsível;
- menus e busca com gerenciamento de foco, `Escape`, `inert` e restauração de foco;
- nomes acessíveis em botões de ícone e favoritos;
- contraste de texto AA, inclusive nas cores dos níveis;
- alvos de toque de pelo menos 24×24 px (a maioria com 44 px);
- respeito a `prefers-reduced-motion`;
- estilos de impressão que ocultam navegação e controles;
- página de erro de carregamento com instrução de recuperação.

## Tema e favoritos

- O tema inicial é escuro. Se o sistema preferir claro e não houver escolha salva, o tema claro é aplicado.
- A escolha manual é salva em `localStorage` na chave `space-law:theme`.
- A meta `theme-color` acompanha o tema ativo.
- Favoritos usam a chave `space-law:favorites:v1` e aceitam crimes e modificadores.
- Limpar dados do navegador remove tema e favoritos; não há sincronização entre dispositivos.

## Estrutura do projeto

```text
.
├─ index.html                 # shell HTML, tema inicial e boot
├─ netlify.toml               # build e fallback de SPA na Netlify
├─ scripts/
│  └─ copy-404.mjs            # cópia pós-build para GitHub Pages
├─ public/
│  ├─ space-law.json          # fonte única de conteúdo
│  ├─ licenses/               # textos OFL das fontes
│  ├─ favicon.svg
│  ├─ robots.txt
│  └─ _redirects
├─ src/
│  ├─ main.ts                 # boot, roteador e interações globais
│  ├─ types.ts                # contratos do JSON e do domínio
│  ├─ data/                   # carregamento, busca e relações
│  ├─ lib/                    # router, markdown, tema, favoritos, utilidades
│  ├─ pages/                  # uma página por rota
│  ├─ ui/                     # layout, busca global, componentes e ícones
│  ├─ styles/                 # base, shell, páginas, detalhes, leitura, etc.
│  └─ assets/fonts/           # WOFF2 auto-hospedados
└─ vite.config.ts             # base path, portas e alvo do build
```

## Fontes e licenças

### Conteúdo legal

O texto legal é reproduzido do repositório [Project-Dumont/Dumont-Station](https://github.com/Project-Dumont/Dumont-Station), branch `dumont`, sob **AGPL-3.0-or-later**, conforme os metadados de `space-law.json`. Os caminhos de origem estão registrados no campo `fonte.caminhos`.

O código deste visualizador é distribuído sob a licença do projeto de origem. Este site é um projeto independente e não oficial.

### Tipografia

As fontes são auto-hospedadas e distribuídas sob a **SIL Open Font License 1.1**:

- **Inter** — Rasmus Andersson. Licença: [`public/licenses/Inter-OFL.txt`](public/licenses/Inter-OFL.txt).
- **Space Grotesk** — Florian Karsten. Licença: [`public/licenses/SpaceGrotesk-OFL.txt`](public/licenses/SpaceGrotesk-OFL.txt).
- **JetBrains Mono** — JetBrains. Licença: [`public/licenses/JetBrainsMono-OFL.txt`](public/licenses/JetBrainsMono-OFL.txt).

Os arquivos WOFF2 estão em `src/assets/fonts/`; os textos integrais das licenças acompanham o build em `/licenses/`.

### Ícones

Os ícones são SVGs desenhados no próprio projeto (`src/ui/icons.ts`), sem dependência de bibliotecas externas.

## Limitações e próximos passos

Limitações atuais:

- Não há backend, autenticação ou edição de conteúdo pelo site.
- Favoritos e tema são locais ao navegador.
- A busca é estática e carrega o índice inteiro no cliente; isso é adequado ao volume atual (67 crimes, 15 modificadores, 48 verbetes e 9 documentos).
- O fallback do GitHub Pages exibe a página correta, mas com status HTTP 404 em rotas profundas.
- A calculadora de modificadores não aplica automaticamente decisões que a lei deixa para o Comando.

Melhorias futuras possíveis:

- Gerar páginas estáticas por rota para SEO e status HTTP corretos em qualquer hospedagem.
- Adicionar testes automatizados de renderização, busca e acessibilidade no CI.
- Criar um validador de esquema mais rígido para atualizações do JSON.
- Oferecer exportação/importação de favoritos e um seletor de servidor, caso o projeto passe a cobrir mais de uma estação.
- Adicionar PWA/offline com cache do JSON e dos assets.
- Incluir um histórico de versões da lei e um diff entre atualizações.
- Melhorar a calculadora com cenários salvos e explicações passo a passo.

---

Feito para consulta durante a partida. **Em caso de dúvida, o guidebook dentro do jogo vence.**

# Análise completa – Revela: layout, apresentação e visibilidade

Este documento consolida a análise do projeto REVELA para **modificações futuras**, com foco em:
- **Layout e identidade visual**
- **Apresentação ao usuário (UX/UI)**
- **Visibilidade no Google (SEO)**
- **Visibilidade em programas de IA (descoberta por assistentes e buscadores)**

**Importante:** Nenhum push ou deploy foi feito. As alterações sugeridas são apenas recomendações até você autorizar.

---

## 1. Resumo executivo

| Área | Estado atual | Prioridade de melhoria |
|------|----------------|------------------------|
| SEO técnico (meta, OG, sitemap, robots) | Bom | Ajustes pontuais |
| Conteúdo público (páginas indexáveis) | Limitado (só home) | Alta |
| Layout / design system | Consistente mas básico | Média |
| Apresentação ao usuário (landing) | Clara, falta destaque e FAQ visível | Média |
| Descoberta por IA | Boa base (robots, meta) | Melhorar conteúdo e estrutura |

---

## 2. Layout e identidade visual

### 2.1 O que está bom
- Paleta definida: `#1A2B32` (fundo), `#E8DCC0` (texto/accents), `#00A88F` (CTA).
- Uso consistente em home, header e footer.
- Logo (`revela3.png`) presente no hero e no header.
- Responsividade (breakpoints sm/md/lg) na landing.

### 2.2 Onde melhorar

**Design system no código**
- Cores e espaçamentos estão **inline** (`style={{ backgroundColor: '#1A2B32' }}`) em vários componentes.  
- **Caminho:** Centralizar em Tailwind (ex.: `tailwind.config.js` com cores nomeadas: `revela-dark`, `revela-cream`, `revela-teal`) e usar classes em vez de `style` para manter consistência e facilitar mudanças futuras.

**Documentação de design**
- `DESIGN_NOTES.md` ainda fala em “Primary: Azul (#3B82F6)” e “Background: Branco”, enquanto o app usa verde-teal e fundo escuro.  
- **Caminho:** Atualizar `DESIGN_NOTES.md` com a paleta real (e, se quiser, link para componentes ou Figma).

**Hierarquia visual na landing**
- Hero: logo grande, slogan, dois botões e blocos de texto; tudo com peso visual parecido.  
- **Caminho:** Definir um único “hero message” (ex.: “Compare fotos antes e depois com privacidade total”) em tamanho maior e deixar slogan/descrição em segundo plano; considerar subtítulo curto sob o CTA principal.

**Footer**
- Hoje só copyright.  
- **Caminho:** Incluir links úteis (FAQ, Sobre, Contato, Termos, Privacidade) para usuário e para SEO (páginas internas linkadas).

---

## 3. Apresentação ao usuário (UX/UI)

### 3.1 Pontos positivos
- Fluxo claro: Home → Login/Signup → Dashboard → Novo projeto / Projetos.
- Header fixo na área logada com logo, idioma, configurações e sair.
- Botões de CTA evidentes (verde para “Criar conta”, outline para “Entrar”).
- Seções “Por que Revela?”, “Como funciona” e CTA final bem estruturadas.
- Suporte a mais de um idioma (pt-BR / en-US).

### 3.2 Melhorias sugeridas

**FAQ visível na home**
- O **FAQ existe só no Schema.org** (JSON-LD); o usuário não vê perguntas e respostas na página.  
- **Caminho:** Adicionar uma seção “Perguntas frequentes” na home (accordion ou lista) com as mesmas (ou mais) perguntas do Schema. Isso melhora UX e reforça SEO.

**Navegação na landing (não logada)**
- Só o seletor de idioma no canto; não há link “Entrar” ou “Criar conta” no topo.  
- **Caminho:** Incluir um header simples na home com logo + “Entrar” + “Criar conta” para acesso rápido sem scroll.

**Primeiro impacto (above the fold)**
- Muita informação no primeiro ecrã (logo, slogan, dois botões, três parágrafos).  
- **Caminho:** Reduzir texto acima da dobra; manter um título forte, um subtítulo e os dois CTAs; mover descrições longas para logo abaixo do fold.

**Consistência de componentes**
- Na home usam-se `<button>` com estilos inline; noutras partes do app há `Button` do UI.  
- **Caminho:** Usar o mesmo `Button` (ou variantes) em toda a landing para manter comportamento (focus, acessibilidade) e estilo.

**Feedback e confiança**
- Não há menção a segurança, LGPD ou “usado por X profissionais”.  
- **Caminho:** Frase curta sob os CTAs (ex.: “Dados no seu dispositivo. Sem nuvem obrigatória.”) e, se possível, um pequeno bloco “Para quem é” (médicos, dentistas, esteticistas) com ícones ou texto.

**Acessibilidade**
- Já há `aria-label` em vários controles e `<main>`/`<section>` em várias páginas.  
- **Caminho:** Garantir que toda a área principal de cada rota esteja dentro de `<main>` (ex.: dashboard); considerar “skip link” (Saltar para conteúdo) para leitores de ecrã.

---

## 4. Visibilidade no Google (SEO)

### 4.1 Já implementado (manter)
- Metadata no `layout.tsx`: title, description, keywords, `applicationName`, `manifest`, `themeColor`.
- Open Graph e Twitter Cards com imagem 1200×630, URL canónica.
- `robots`: index/follow e opções para `googleBot` (snippet, imagem).
- `other`: `ai-content-type: informational` (útil para IA).
- `sitemap.ts` com URL da home; `robots.txt` com Sitemap e regras para áreas privadas.
- Structured Data na home: Organization, SoftwareApplication, FAQPage, HowTo, WebSite (com SearchAction).
- Páginas privadas (login, signup, dashboard, projects, etc.) com `noindex, nofollow` nos respectivos layouts.

### 4.2 Melhorias recomendadas

**Sitemap**
- Hoje só a home.  
- **Caminho:** Ao criar FAQ, Sobre, Contato, Recursos, blog ou páginas “para-medicos” etc., adicionar cada URL em `app/sitemap.ts` com `priority` e `changeFrequency` adequados.

**Páginas de conteúdo público**
- Uma única página indexável (home) limita as palavras-chave e temas que o Google pode associar ao site.  
- **Caminho (conforme RESUMO_IMPLEMENTACAO_SEO.md e PLANEJAMENTO_SEO_COMPLETO.md):**
  1. **FAQ** (`/faq`): lista de 20–30 perguntas; manter/estender FAQPage Schema.
  2. **Sobre** (`/sobre`): missão, história, valores; reforçar Organization Schema se necessário.
  3. **Contato** (`/contato`): formulário e/ou email; opcional LocalSchema se houver endereço.
  4. **Recursos** (`/recursos`): funcionalidades, screenshots, comparações.
  5. **Landings por profissão** (`/para-medicos`, `/para-dentistas`, etc.): conteúdo específico por segmento.

**Título e descrição**
- Já orientados para “como comparar fotos antes e depois” e “médicos, dentistas, esteticistas”.  
- **Caminho:** Testar variações (ex.: incluir “grátis”, “privacidade”, “sem nuvem”) em título ou descrição e acompanhar no Search Console (CTR, impressões).

**Imagem OG**
- URL absoluta em `openGraph.images`; em `twitter.images` está `/revela3.png` (relativa).  
- **Caminho:** Usar URL absoluta também no Twitter (ex.: `https://revela.app/revela3.png`) para evitar falhas em alguns clientes.

**SearchAction no WebSite Schema**
- `target` aponta para `https://revela.app/busca?q={search_term_string}`; a rota `/busca` pode não existir.  
- **Caminho:** Implementar uma página de busca interna em `/busca` ou alterar/remover o `SearchAction` para não sugerir uma URL inexistente.

**Componentes não usados**
- `OpenGraphHead` e `SEOHead` não estão importados no App Router; o SEO já é feito por metadata do Next.  
- **Caminho:** Remover esses componentes se não forem necessários ou documentar quando usá-los (evitar duplicação de tags).

---

## 5. Visibilidade em programas de IA (assistentes, buscadores, crawlers)

### 5.1 O que já ajuda
- `robots.txt` permite explicitamente bots de IA (GPTBot, ChatGPT-User, CCBot, anthropic-ai, Claude-Web, PerplexityBot, Google-Extended, Bingbot, facebookexternalhit).
- Meta `ai-content-type: informational` indica conteúdo informativo.
- Conteúdo textual rico na home (descrições, “Por que Revela?”, “Como funciona”).
- Schema.org (Organization, SoftwareApplication, FAQ, HowTo, WebSite) dá contexto semântico que IAs podem usar.

### 5.2 Como melhorar a descoberta por IA

**Conteúdo estruturado e único**
- Quanto mais páginas públicas com texto claro (FAQ, Sobre, Recursos, artigos), mais contexto as IAs têm para citar o Revela em respostas.  
- **Caminho:** Criar as páginas da Fase 1 do SEO (FAQ, Sobre, Contato, Recursos) e, se possível, um blog com artigos úteis (ex.: “Como tirar fotos antes e depois em consultório”).

**Definição explícita do produto**
- Uma frase “O Revela é um aplicativo web gratuito para profissionais de saúde e estética compararem fotos antes e depois, com armazenamento local e sem obrigatoriedade de nuvem” no topo da home ou na página Sobre ajuda IAs a resumir o produto.  
- **Caminho:** Incluir essa frase (ou variante) em `<main>` da home e/ou na página Sobre.

**FAQ visível + Schema**
- Ter o mesmo conteúdo em HTML (seção FAQ) e em FAQPage Schema aumenta a chance de IAs e snippets usarem essas perguntas.  
- **Caminho:** Implementar a seção FAQ na home (ou em `/faq`) e manter o Schema alinhado.

**Sitemap e links internos**
- Sitemap atualizado com todas as páginas públicas e links no footer/site ajudam crawlers de IA a descobrir todo o conteúdo.  
- **Caminho:** Ao criar novas rotas públicas, adicioná-las ao sitemap e linkar a partir do footer ou do menu.

**Evitar bloqueio de IA**
- Manter a política atual de permitir bots de IA no `robots.txt`; não adicionar regras que bloqueiem esses user-agents sem necessidade.

---

## 6. Caminhos de melhoria (priorizados)

### Fase 1 – Rápido e alto impacto (1–2 sprints)
1. **FAQ visível na home**  
   Seção “Perguntas frequentes” com accordion; alinhar textos ao FAQ Schema.
2. **Header na landing**  
   Logo + “Entrar” + “Criar conta” no topo da home.
3. **Footer com links**  
   FAQ, Sobre, Contato (e depois Termos/Privacidade quando existirem); usar componentes Link do Next.
4. **Centralizar cores no Tailwind**  
   Variáveis no `tailwind.config` e troca de `style` por classes nas páginas principais.
5. **Twitter image absoluta**  
   Em `metadata.twitter.images` usar `https://revela.app/revela3.png`.

### Fase 2 – Conteúdo e SEO (2–4 semanas)
6. **Página FAQ** (`/faq`)  
   Conteúdo completo; adicionar ao sitemap e ao footer.
7. **Página Sobre** (`/sobre`)  
   Missão, para quem é, diferenciais; link no footer.
8. **Página Contato** (`/contato`)  
   Formulário ou email; link no footer.
9. **Atualizar sitemap**  
   Incluir `/faq`, `/sobre`, `/contato` (e depois `/recursos`).
10. **SearchAction**  
    Implementar `/busca` ou remover/ajustar no WebSite Schema.

### Fase 3 – Layout e UX (contínuo)
11. **Refinar hero**  
    Menos texto above the fold; um título principal + subtítulo + CTAs.
12. **Design notes**  
    Atualizar `DESIGN_NOTES.md` com paleta e componentes atuais.
13. **Botões da home**  
    Usar `Button` do design system em vez de `<button>` com inline styles.
14. **Acessibilidade**  
    `<main>` em todas as rotas; considerar skip link e revisão de contraste (ex.: ferramenta axe).

### Fase 4 – Escala de conteúdo (médio prazo)
15. **Páginas por profissão**  
    `/para-medicos`, `/para-dentistas`, `/para-esteticistas` com conteúdo específico.
16. **Blog**  
    Estrutura `/blog` e `/blog/[slug]`; primeiros artigos orientados a palavras-chave do planejamento SEO.
17. **Recursos**  
    Página `/recursos` com funcionalidades, capturas de tela e comparações.

---

## 7. Checklist antes de push/deploy

Quando for fazer alterações e publicar, vale conferir:

- [ ] Testes manuais em mobile e desktop (home, login, signup, dashboard).
- [ ] Verificar que páginas privadas continuam com `noindex, nofollow`.
- [ ] Confirmar que `robots.txt` e sitemap refletem as novas URLs (se criadas).
- [ ] Validar Structured Data (Google Rich Results Test ou ferramenta equivalente).
- [ ] Checar Open Graph com Facebook Sharing Debugger ou similar.
- [ ] Atualizar versão ou changelog se aplicável.

---

## 8. Referências no projeto

- **SEO:** `RESUMO_IMPLEMENTACAO_SEO.md`, `PLANEJAMENTO_SEO_COMPLETO.md`
- **Ideias de produto/UX:** `IDÉIAS_MELHORIAS.md`
- **Design:** `DESIGN_NOTES.md` (a atualizar)
- **Estrutura e stack:** `docs/TECHNICAL.md`, `docs/PRD.md`

---

**Documento gerado em:** análise única para suporte a modificações futuras.  
**Push e deploy:** não realizados; aguardando sua autorização para qualquer publicação.

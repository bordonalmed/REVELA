# Sugestões de mudança no layout do Revela

Documento prático com alterações sugeridas na **landing (home)** e em **componentes globais**, mantendo a identidade atual (cores, logo) e melhorando hierarquia, clareza e sensação premium.

---

## 1. Hero (primeira tela)

**Problema atual:** Logo + slogan + dois botões + três parágrafos longos competem no mesmo bloco. Quem chega não sabe em 3 segundos “o que é” e “o que fazer”.

**Sugestões:**

| Onde | Antes | Depois (sugestão) |
|------|--------|-------------------|
| **Título principal** | Só logo + slogan em itálico | Manter logo; **acrescentar um H1 textual** logo abaixo, ex.: “Compare fotos antes e depois com privacidade total” (ou variante das traduções). Fonte maior que o slogan, peso medium/semibold. |
| **Above the fold** | Logo + slogan + 2 botões + 3 parágrafos | **Só** logo + H1 + **uma linha** de subtítulo (ex.: “Para médicos, dentistas e esteticistas”) + os 2 botões. **Mover** os 3 parágrafos de descrição para **abaixo da dobra**, numa seção “O que é o Revela?” logo após o hero. |
| **Botões** | `<button>` com estilos inline | Usar o componente **`Button`** do design system (já existe em `@/components/ui/button`) com variantes (ex.: primary e outline). Deixar CTA principal (Criar conta) mais evidente (tamanho ou contraste). |
| **Espaçamento** | `min-h-screen` com tudo no centro | Manter `min-h-screen`; reduzir quantidade de elementos no centro para o hero respirar (só logo, H1, subtítulo, botões). |

**Resultado desejado:** Em 3 segundos o visitante lê “Compare fotos antes e depois com privacidade total”, vê “Para médicos, dentistas e esteticistas” e os dois CTAs, sem precisar rolar.

---

## 2. Header na landing (topo fixo)

**Problema atual:** Só o seletor de idioma no canto. Quem já conhece o produto não tem “Entrar” ou “Criar conta” no topo.

**Sugestão:**

- Criar um **header fixo** na home (igual ao da área logada, mas simplificado):
  - **Esquerda:** logo (link para `/`).
  - **Direita:** link “Entrar” (`/login`) + botão “Criar conta” (`/signup`) + seletor de idioma.
- Estilo: mesmo fundo semi-transparente e borda do `NavigationHeader` (`rgba(26, 43, 50, 0.95)`, `backdrop-blur`, borda creme sutil).
- Reutilizar o mesmo componente de logo (`SafeImage` + `/revela3.png`).

**Resultado:** Navegação clara em todas as telas públicas e consistência com a área logada.

---

## 3. Nova seção “O que é o Revela?” (logo abaixo do hero)

**Problema atual:** Os três parágrafos longos ficam dentro do hero e deixam a primeira tela carregada.

**Sugestão:**

- **Criar uma seção** entre o hero e “Por que Revela?”.
- Título da seção: “O que é o Revela?” (ou equivalente nas traduções).
- Conteúdo: os três blocos de texto atuais (`description1`, `description2`, `description3`), com mesmo estilo de texto (cor `#E8DCC0`, font-light), em container `max-w-3xl` centralizado.
- Opcional: um subtítulo curto tipo “Ferramenta profissional para comparar antes e depois, com dados no seu dispositivo.”

**Resultado:** Hero limpo; explicação rica logo abaixo, sem poluir a primeira impressão.

---

## 4. Seção “Por que Revela?” (cards)

**Problema atual:** Funciona bem; dá para melhorar levemente a hierarquia e o aspecto “premium”.

**Sugestões:**

- **Título da seção:** Manter; garantir que seja um `<h2>` (já é).
- **Cards:** Manter grid (1 col mobile, 2 sm, 3 lg). Pequenos ajustes:
  - Trocar emojis (📸 🔒 ⚡ etc.) por **ícones** do `lucide-react` (Camera, Lock, Zap, Briefcase, Globe) para visual mais profissional e consistente.
  - Manter borda e fundo atuais; opcional: hover sutil (ex.: `border` um pouco mais visível ou leve aumento de opacidade do fundo).
- **Espaçamento:** Manter `py-12` a `py-24`; está bom.

**Resultado:** Mesma informação, visual mais alinhado a produto profissional.

---

## 5. Seção “Como funciona”

**Problema atual:** Estrutura clara (3 passos); pode ganhar um pouco de destaque.

**Sugestões:**

- Manter os 3 passos com números em círculos verdes.
- Adicionar **uma linha de apoio** abaixo do título, ex.: “Em três passos você organiza e apresenta seus resultados.”
- Opcional: em desktop, usar um layout que mostre os passos numa linha com uma linha conectora entre os círculos (visual de “fluxo”).

**Resultado:** Reforça simplicidade e previsibilidade do uso.

---

## 6. CTA final

**Problema atual:** Já existe; pode ficar mais destacado.

**Sugestões:**

- Dar mais destaque ao **bloco**: fundo levemente diferente (ex.: `rgba(0, 168, 143, 0.08)` ou borda sutil verde-teal) para separar da seção anterior.
- Manter os dois botões (Criar conta + Já tenho conta); usar componente `Button` aqui também.
- Opcional: uma linha de confiança logo abaixo dos botões, ex.: “Dados no seu dispositivo. Sem nuvem obrigatória.” em texto pequeno e discreto.

**Resultado:** CTA final mais visível e com reforço de privacidade.

---

## 7. FAQ na home

**Problema atual:** O FAQ existe só no Schema.org; o usuário não vê perguntas e respostas.

**Sugestão:**

- Inserir uma **seção “Perguntas frequentes”** antes do footer (ou antes do CTA final).
- 5–6 perguntas (as mesmas do `StructuredData` ou um subconjunto): “O que é o Revela?”, “Como funciona a privacidade?”, “Quanto custa?”, “Funciona em quais dispositivos?”, “Para quem é indicado?”.
- **Componente:** accordion (uma pergunta aberta por vez) ou lista com perguntas em negrito e respostas abaixo. Usar as mesmas cores (creme, fundo escuro).
- Manter o Schema FAQ na página para não quebrar SEO.

**Resultado:** Usuário encontra respostas rápidas na página; SEO e rich results continuam aproveitando o FAQ.

---

## 8. Footer

**Problema atual:** Só copyright; não há links úteis nem para o usuário nem para SEO.

**Sugestão:**

- **Linha 1:** Links de texto (mesma cor creme, opacidade ~0.8): “FAQ”, “Sobre”, “Contato” (quando as páginas existirem). Entre eles: separador discreto (|) ou espaço.
- **Linha 2:** Copyright como está.
- Layout: `flex flex-col sm:flex-row` com `justify-between items-center` e gap; em mobile, links e copyright podem ficar empilhados e centralizados.

**Resultado:** Navegação e descoberta de conteúdo melhoram; prepara o terreno para páginas FAQ, Sobre e Contato.

---

## 9. Cores e Tailwind (evitar inline)

**Problema atual:** Muitos `style={{ backgroundColor: '#1A2B32', color: '#E8DCC0' }}` espalhados; difícil manter e evoluir.

**Sugestão:**

- No **`tailwind.config.js`**, em `theme.extend.colors`, adicionar por exemplo:
  - `revela: { dark: '#1A2B32', cream: '#E8DCC0', teal: '#00A88F' }`.
- No **CSS global** (ou onde já existam variáveis), definir se fizer sentido: `--revela-dark`, `--revela-cream`, `--revela-teal`.
- Nos componentes da home e do footer, **substituir** os `style` por classes Tailwind, ex.: `bg-revela-dark`, `text-revela-cream`, `bg-revela-teal`, e opacidades com `text-revela-cream/90`.

**Resultado:** Um único lugar para mudar cores; código mais limpo e consistente.

---

## 10. Ordem sugerida de implementação

| Ordem | Mudança | Impacto | Esforço |
|-------|---------|---------|--------|
| 1 | Cores no Tailwind + trocar inline por classes na home | Manutenção e consistência | Baixo |
| 2 | Header na landing (logo + Entrar + Criar conta + idioma) | Navegação e profissionalismo | Baixo |
| 3 | Hero: H1 + subtítulo + menos texto; mover parágrafos para “O que é o Revela?” | Clareza e primeira impressão | Médio |
| 4 | Botões da home com componente `Button` | Consistência e acessibilidade | Baixo |
| 5 | Seção FAQ visível (accordion ou lista) | UX e SEO | Médio |
| 6 | Footer com links (FAQ, Sobre, Contato) | Navegação e SEO | Baixo |
| 7 | Ícones nos cards “Por que Revela?” (lucide-react) | Visual mais premium | Baixo |
| 8 | CTA final com fundo/borda sutil + linha de confiança | Conversão e confiança | Baixo |

---

## Resumo visual (antes → depois)

**Hero**
- **Antes:** [ Logo | Slogan | Botão 1 | Botão 2 | Parágrafo 1 | Parágrafo 2 | Parágrafo 3 ]
- **Depois:** [ Header: Logo | Entrar | Criar conta | Idioma ] → [ Logo | H1 | Subtítulo | Botão Criar conta | Botão Entrar ] → (rolar) → [ O que é o Revela? → 3 parágrafos ]

**Rodapé**
- **Antes:** Só “© Revela 2024” (ou equivalente).
- **Depois:** “FAQ · Sobre · Contato” + linha abaixo + “© Revela …”.

**Meio da página**
- Incluir seção “Perguntas frequentes” com 5–6 itens antes do CTA final ou do footer.

Se quiser, posso começar pela **ordem 1 e 2** (Tailwind + header na landing) e ir aplicando as mudanças nos arquivos.

# 📱 Guia de Publicação para Redes Sociais - Revela

## ✅ Funcionalidade Implementada

A funcionalidade **"Publicar"** permite exportar comparações antes/depois em formatos otimizados para redes sociais, especialmente Instagram.

---

## 🎯 Formatos Disponíveis

### 1. **Instagram Feed (1:1)** - 1080×1080px
- **Formato**: Quadrado
- **Layout**: Imagens lado a lado
- **Uso**: Ideal para posts no feed do Instagram
- **Características**: 
  - Proporção perfeita para feed
  - Imagens bem balanceadas
  - Marca d'água opcional

### 2. **Instagram Feed (4:5)** - 1080×1350px
- **Formato**: Retangular vertical
- **Layout**: Imagens lado a lado
- **Uso**: Posts retangulares no feed (ocupam mais espaço)
- **Características**:
  - Mais destaque no feed
  - Melhor para imagens verticais
  - Marca d'água opcional

### 3. **Instagram Stories** - 1080×1920px
- **Formato**: Vertical (9:16)
- **Layout**: Duas imagens separadas
- **Uso**: Stories consecutivos (uma para ANTES, outra para DEPOIS)
- **Características**:
  - Gera 2 arquivos separados
  - Cada imagem ocupa tela cheia
  - Perfeito para antes/depois em sequência
  - Marca d'água opcional

### 4. **Instagram Stories (Única)** - 1080×1920px
- **Formato**: Vertical (9:16)
- **Layout**: Imagens empilhadas verticalmente
- **Uso**: Uma única imagem com antes e depois
- **Características**:
  - Uma única imagem
  - Antes no topo, depois embaixo
  - Ideal para comparar em um único story
  - Marca d'água opcional

---

## 🚀 Como Usar

### Passo 1: Visualizar o Projeto
1. Acesse um projeto em `/projects/[id]`
2. Navegue pelas imagens usando as setas
3. Escolha a imagem "antes" e "depois" que deseja publicar

### Passo 2: Abrir Modal de Publicação
1. Clique no botão **"Publicar"** (verde, com ícone de compartilhar)
   - **Desktop**: Botão ao lado de "Exportar"
   - **Mobile/Landscape**: Botão flutuante no canto inferior direito

### Passo 3: Escolher Formato
1. No modal, selecione o formato desejado:
   - Instagram Feed (1:1)
   - Instagram Feed (4:5)
   - Instagram Stories (2 imagens separadas)
   - Instagram Stories (Única)

### Passo 4: Configurar Opções
- **Incluir marca d'água**: Marque/desmarque para incluir ou não o logo Revela
- **Preview**: Veja como ficará a imagem antes de gerar

### Passo 5: Gerar e Baixar
1. Clique em **"Gerar e Baixar"**
2. Aguarde o processamento (alguns segundos)
3. A imagem será baixada automaticamente
   - Para Stories (separado): 2 arquivos serão baixados
   - Para outros formatos: 1 arquivo será baixado

---

## 📋 Características Técnicas

### Qualidade
- **Formato**: JPEG (alta qualidade - 95%)
- **Resolução**: Dimensões exatas para cada rede social
- **Fundo**: Preto (para maior nitidez)
- **Compressão**: Otimizada para redes sociais

### Marca d'água
- **Posição**: Canto inferior direito de cada imagem
- **Tamanho**: 30px de altura (proporcional)
- **Opacidade**: 30% (sutil, não interfere na imagem)
- **Opcional**: Pode ser desabilitada no modal

### Layouts
- **Lado a lado**: Imagens divididas igualmente
- **Vertical**: Antes no topo, depois embaixo
- **Separado**: Duas imagens independentes (apenas Stories)

---

## 💡 Dicas de Uso

### Para Instagram Feed
- Use **1:1** para posts tradicionais
- Use **4:5** para posts que querem mais destaque
- Adicione texto/legenda no Instagram após o upload

### Para Instagram Stories
- **Stories (separado)**: Ideal para mostrar transformação em sequência
  - Primeiro story: ANTES
  - Segundo story: DEPOIS
  - Crie suspense e engajamento
- **Stories (única)**: Ideal para comparação direta
  - Mostra antes e depois na mesma tela
  - Perfeito para resultados rápidos

### Otimização
- **Marca d'água**: Deixe ativada para branding, desative se quiser imagem limpa
- **Qualidade**: Sempre máxima (95%) para melhor resultado
- **Tamanho**: Formatos já otimizados, não precisa redimensionar

---

## 🎨 Exemplos de Uso

### Cenário 1: Post no Feed
1. Escolha **Instagram Feed (1:1)**
2. Ative marca d'água
3. Gere e baixe
4. Faça upload no Instagram
5. Adicione legenda e hashtags

### Cenário 2: Stories em Sequência
1. Escolha **Instagram Stories**
2. Ative marca d'água
3. Gere e baixe (2 arquivos)
4. Faça upload no Instagram:
   - Primeiro: imagem ANTES
   - Segundo: imagem DEPOIS
5. Adicione stickers, texto ou música

### Cenário 3: Story Único
1. Escolha **Instagram Stories (Única)**
2. Ative marca d'água
3. Gere e baixe
4. Faça upload no Instagram
5. Adicione texto comparativo

---

## 🔧 Arquivos Modificados

### 1. `lib/export-utils.ts`
- Adicionada função `exportForSocialMedia()`
- Adicionada função `generateSocialMediaPreview()`
- Adicionada função `getSocialMediaFormats()`
- Tipos: `SocialMediaFormat`

### 2. `components/social-media-export-modal.tsx`
- Novo componente modal
- Seleção de formato
- Preview em tempo real
- Opções de configuração

### 3. `app/projects/[id]/page.tsx`
- Botão "Publicar" adicionado
- Integração com modal
- Suporte desktop e mobile

---

## 📊 Estrutura de Código

### Função Principal
```typescript
exportForSocialMedia(
  beforeImage: string,      // Base64 da imagem antes
  afterImage: string,       // Base64 da imagem depois
  projectName: string,      // Nome do projeto
  format: SocialMediaFormat, // Formato escolhido
  options: {
    includeLogo?: boolean;  // Incluir marca d'água
    includeInfo?: boolean;  // Incluir info do projeto
  }
)
```

### Formatos Suportados
```typescript
type SocialMediaFormat = 
  | 'instagram-feed-1x1'
  | 'instagram-feed-4x5'
  | 'instagram-stories'
  | 'instagram-stories-single';
```

---

## ✅ Checklist de Implementação

- [x] Função de exportação para redes sociais
- [x] 4 formatos diferentes implementados
- [x] Modal de seleção com preview
- [x] Botão "Publicar" na interface
- [x] Suporte desktop e mobile
- [x] Marca d'água opcional
- [x] Preview em tempo real
- [x] Download automático
- [x] Tratamento de erros
- [x] Feedback visual (loading states)

---

## 🚀 Próximos Passos (Fase 2 - Futuro)

### Formatos Animados
- [ ] Instagram Reels (vídeo com transição)
- [ ] TikTok (vídeo com transição)
- [ ] Stories Animado (GIF ou vídeo curto)

### Melhorias
- [ ] Edição básica (filtros, ajustes)
- [ ] Templates pré-definidos
- [ ] Compartilhamento direto (API Instagram)
- [ ] Agendamento de posts

---

## 📝 Notas Técnicas

### Performance
- Preview gerado em tempo real (pode levar 1-2 segundos)
- Exportação final: 2-5 segundos dependendo do tamanho
- Uso de Canvas API nativo (sem dependências externas)

### Compatibilidade
- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile (iOS/Android)

### Limitações
- Imagens muito grandes podem demorar mais para processar
- Preview pode não ser 100% idêntico ao resultado final (devido à compressão)
- Stories separado gera 2 downloads (pode confundir alguns usuários)

---

**Data de Implementação**: 2024
**Status**: ✅ Completo e Funcional (Fase 1)


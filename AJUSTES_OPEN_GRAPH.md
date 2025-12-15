# 🔧 Ajustes Open Graph - Revela

## ✅ Melhorias Implementadas

### 1. URLs Absolutas nas Imagens
- ✅ Alterado de `/revela3.png` para `https://revela.app/revela3.png`
- ✅ Garante que as imagens sejam carregadas corretamente em todas as plataformas sociais
- ✅ Necessário para Facebook, LinkedIn, WhatsApp, etc.

### 2. Propriedades Adicionais Open Graph
- ✅ Adicionado `type: "image/png"` nas imagens
- ✅ Adicionado `secureUrl` para HTTPS explícito
- ✅ Mantidas dimensões corretas (1200x630px - padrão OG)

### 3. Twitter Cards Melhoradas
- ✅ Adicionado `creator` e `site` (preparado para quando tiver conta Twitter)
- ✅ URL absoluta na imagem
- ✅ Descrição mais completa

### 4. Componente OpenGraphHead
- ✅ Criado componente adicional que adiciona tags via JavaScript
- ✅ Garante compatibilidade com todas as plataformas
- ✅ Adiciona tags específicas que podem não estar no Metadata do Next.js

## 📋 Tags Open Graph Configuradas

### Tags Básicas
- `og:type` - website
- `og:locale` - pt_BR
- `og:url` - https://revela.app
- `og:site_name` - Revela
- `og:title` - Revela - App de Fotos Antes e Depois para Profissionais
- `og:description` - Compare fotos antes e depois com privacidade total...

### Tags de Imagem
- `og:image` - https://revela.app/revela3.png
- `og:image:secure_url` - https://revela.app/revela3.png
- `og:image:width` - 1200
- `og:image:height` - 630
- `og:image:type` - image/png
- `og:image:alt` - Revela - Comparação de Fotos Antes e Depois

### Twitter Cards
- `twitter:card` - summary_large_image
- `twitter:title` - Revela - App de Fotos Antes e Depois
- `twitter:description` - Compare fotos antes e depois...
- `twitter:image` - https://revela.app/revela3.png
- `twitter:image:alt` - Revela - Comparação de Fotos Antes e Depois

## 🧪 Como Testar

### 1. Facebook Sharing Debugger
- Acesse: https://developers.facebook.com/tools/debug/
- Cole a URL: https://revela.app
- Clique em "Debugar"
- Verifique se todas as tags estão sendo lidas corretamente

### 2. Twitter Card Validator
- Acesse: https://cards-dev.twitter.com/validator
- Cole a URL: https://revela.app
- Verifique a prévia do card

### 3. LinkedIn Post Inspector
- Acesse: https://www.linkedin.com/post-inspector/
- Cole a URL: https://revela.app
- Verifique a prévia

### 4. WhatsApp Web
- Compartilhe o link no WhatsApp Web
- Verifique se a prévia aparece corretamente

## 📝 Próximos Passos (Opcional)

### 1. Criar Imagem OG Dedicada
- [ ] Criar imagem específica para Open Graph (1200x630px)
- [ ] Incluir logo, título e descrição visual
- [ ] Salvar como `/public/og-image.png` ou `/public/og-image.jpg`
- [ ] Atualizar URLs nas configurações

### 2. Adicionar Facebook App ID
- [ ] Criar App no Facebook Developers
- [ ] Obter App ID
- [ ] Adicionar em `components/open-graph-head.tsx`

### 3. Adicionar Contas Sociais
- [ ] Criar conta Twitter (@revela)
- [ ] Criar conta Facebook
- [ ] Criar conta Instagram
- [ ] Adicionar URLs em `sameAs` do Schema.org

### 4. Open Graph Dinâmico (Futuro)
- [ ] Criar imagens OG dinâmicas por página
- [ ] Usar API Route para gerar imagens OG
- [ ] Implementar para páginas de blog e casos de uso

## 🔍 Verificação

### Checklist
- [x] URLs absolutas nas imagens
- [x] Dimensões corretas (1200x630)
- [x] Type e secureUrl configurados
- [x] Twitter Cards configuradas
- [x] Componente adicional para garantir leitura
- [ ] Testar em Facebook Debugger
- [ ] Testar em Twitter Card Validator
- [ ] Testar em LinkedIn Post Inspector
- [ ] Testar em WhatsApp

## 📚 Referências

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

---

**Última atualização**: Janeiro 2024
**Status**: ✅ Implementado | ⏳ Aguardando Testes


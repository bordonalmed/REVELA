# 📸 Como Usar a Exportação de Imagem

## ✅ Funcionalidade Implementada

### **Exportar Comparação como Imagem Única**

A funcionalidade permite exportar a visualização atual (antes/depois) como uma única imagem PNG.

---

## 🎯 Como Funciona

### Passo a Passo:

1. **Visualize o Projeto**
   - Acesse um projeto em `/projects/[id]`
   - Navegue pelas imagens usando as setas
   - Escolha a imagem "antes" e "depois" que deseja exportar

2. **Clique em "Exportar Imagem"**
   - **Desktop**: Botão verde ao lado de "Editar"
   - **Mobile/Landscape**: Botão flutuante no canto inferior direito

3. **Aguarde o Processamento**
   - O sistema cria uma imagem com:
     - Nome do projeto (topo)
     - Data do projeto (topo)
     - Imagem "ANTES" (lado esquerdo)
     - Imagem "DEPOIS" (lado direito)
     - Labels "ANTES" e "DEPOIS"

4. **Download Automático**
   - A imagem é baixada automaticamente
   - Nome do arquivo: `Nome_do_Projeto_comparacao.png`

---

## 📋 Características da Imagem Exportada

### Layout:
- **Formato**: PNG (alta qualidade)
- **Layout**: Lado a lado (side-by-side)
- **Resolução**: Até 1920x1080px (mantém proporção)
- **Fundo**: Branco
- **Labels**: "ANTES" e "DEPOIS" incluídos

### Informações Incluídas:
- ✅ Nome do projeto (topo, centralizado)
- ✅ Data do projeto (abaixo do nome)
- ✅ Labels "ANTES" e "DEPOIS"
- ✅ Imagens lado a lado

---

## 🎨 Exemplo Visual

```
┌─────────────────────────────────────────┐
│         Nome do Projeto                 │
│         Data: 15/01/2024                │
│                                         │
│   ANTES              DEPOIS            │
│   ┌─────┐           ┌─────┐            │
│   │     │           │     │            │
│   │ Img │           │ Img │            │
│   │     │           │     │            │
│   └─────┘           └─────┘            │
└─────────────────────────────────────────┘
```

---

## 💡 Dicas de Uso

### Para Melhor Resultado:
1. **Escolha imagens com proporção similar** - Ficam mais alinhadas
2. **Navegue até a comparação desejada** - Exporta exatamente o que está vendo
3. **Use em apresentações** - A imagem pode ser inserida em documentos
4. **Compartilhe facilmente** - PNG funciona em qualquer dispositivo

### Casos de Uso:
- 📧 Enviar por email para pacientes
- 📱 Compartilhar em redes sociais
- 📄 Inserir em relatórios
- 🖨️ Imprimir para consultório
- 💬 Enviar via WhatsApp

---

## 🔧 Detalhes Técnicos

### Tecnologias Usadas:
- **Canvas API** (nativo do navegador)
- **Sem bibliotecas externas** (mais leve e rápido)

### Processo:
1. Carrega imagens base64
2. Calcula dimensões mantendo proporção
3. Cria canvas com layout lado a lado
4. Desenha imagens e textos
5. Converte para PNG
6. Faz download automático

### Limitações:
- Funciona apenas no navegador (client-side)
- Requer imagens carregadas
- Tamanho máximo: 1920x1080px (pode ser ajustado)

---

## 🚀 Próximas Melhorias (Opcional)

Se quiser expandir no futuro:
- [ ] Opção de layout vertical (empilhado)
- [ ] Escolher qualidade (PNG/JPEG)
- [ ] Exportar todas as combinações
- [ ] Exportar como PDF
- [ ] Download ZIP com todas as imagens

---

**Funcionalidade pronta para uso!** 🎉


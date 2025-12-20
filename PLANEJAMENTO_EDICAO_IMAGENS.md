# 🎨 Planejamento: Edição de Imagens (Rotação e Corte) - Cenário 2

## 📋 Visão Geral

Implementar funcionalidade de **rotação e corte de imagens** diretamente no modo de edição do projeto, permitindo que usuários ajustem fotos antes de salvar.

---

## 🎯 Cenário Escolhido: Edição no Modo de Edição do Projeto

### Fluxo Proposto:

```
1. Usuário está visualizando projeto
   ↓
2. Clica em "Editar" (entra no modo de edição)
   ↓
3. Visualiza lista de imagens ANTES e DEPOIS
   ↓
4. Clica em botão "Editar" em uma imagem específica
   ↓
5. Abre Modal de Edição de Imagem:
   - Rotação (90°, 180°, 270°, livre)
   - Corte (crop) com área selecionável
   - Preview em tempo real
   ↓
6. Aplica transformações
   ↓
7. Clica em "Salvar" ou "Aplicar"
   ↓
8. Imagem editada substitui a original no array de edição
   ↓
9. Ao salvar o projeto, imagem editada é salva permanentemente
```

---

## 🔧 Implementação Técnica

### 1. Biblioteca Recomendada: `react-easy-crop`

**Por quê:**
- ✅ Leve (~15KB)
- ✅ Específica para React
- ✅ Suporte a touch (mobile)
- ✅ TypeScript nativo
- ✅ Fácil de integrar
- ✅ Mantida ativamente

**Instalação:**
```bash
npm install react-easy-crop
```

### 2. Estrutura de Componentes

```
components/
  └── image-editor.tsx          # Componente principal de edição
      ├── Rotação
      ├── Corte (Crop)
      └── Preview
```

### 3. Integração no Código Existente

**Arquivo:** `app/projects/[id]/page.tsx`

**Pontos de Integração:**
- No modo de edição (`isEditing === true`)
- Botão "Editar" em cada imagem (ANTES e DEPOIS)
- Substituir imagem no array `editingBeforeImages` ou `editingAfterImages`

---

## 🎨 Interface Proposta

### Modal de Edição de Imagem

```
┌─────────────────────────────────────────────┐
│  [X] Editar Imagem                          │
├─────────────────────────────────────────────┤
│                                             │
│   ┌─────────────────────────────────┐      │
│   │                                 │      │
│   │    [Área de Crop da Imagem]    │      │
│   │                                 │      │
│   │    ↻ Rotacionar  ↺              │      │
│   │                                 │      │
│   └─────────────────────────────────┘      │
│                                             │
│   Controles:                                │
│   ┌─────────────────────────────┐          │
│   │ ↻ 90°  ↺ 90°  ↻ 180°       │          │
│   │ [Rotação Livre: ──────●───] │          │
│   │                             │          │
│   │ Proporções de Crop:         │          │
│   │ [ ] Livre  [ ] 1:1  [ ] 4:3 │          │
│   └─────────────────────────────┘          │
│                                             │
│   Preview:                                  │
│   ┌─────────────┐                          │
│   │ [Preview]   │                          │
│   └─────────────┘                          │
│                                             │
│   [Cancelar]        [Aplicar Alterações]   │
└─────────────────────────────────────────────┘
```

---

## 📝 Funcionalidades Detalhadas

### 1. Rotação

#### Opções:
- **Botões rápidos:**
  - ↻ Rotacionar 90° horário
  - ↺ Rotacionar 90° anti-horário
  - ↻↻ Rotacionar 180°
  
- **Controle deslizante:**
  - Rotação livre de 0° a 360°
  - Preview em tempo real

#### Implementação:
```typescript
const [rotation, setRotation] = useState(0);

const rotateImage = (degrees: number) => {
  setRotation((prev) => (prev + degrees) % 360);
};

// Aplicar rotação no canvas
ctx.rotate((rotation * Math.PI) / 180);
```

### 2. Corte (Crop)

#### Opções:
- **Modo livre:** Usuário define área manualmente
- **Proporções pré-definidas:**
  - 1:1 (quadrado)
  - 4:3 (retangular)
  - 16:9 (widescreen)
  - 3:4 (vertical)
  - Personalizado

#### Funcionalidades:
- Selecionar área arrastando
- Redimensionar área (cantos e bordas)
- Mover área selecionada
- Zoom durante seleção
- Preview da área cortada

#### Implementação:
```typescript
const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
const [zoom, setZoom] = useState(1);

// Usar react-easy-crop para gerenciar crop
<Cropper
  image={imageSrc}
  crop={crop}
  zoom={zoom}
  rotation={rotation}
  aspect={aspectRatio}
  onCropChange={setCrop}
  onZoomChange={setZoom}
/>
```

### 3. Preview em Tempo Real

- Mostrar resultado das transformações
- Atualizar instantaneamente
- Comparar antes/depois (opcional)

### 4. Salvamento

#### Opções:
- **Substituir original:** Imagem editada substitui a original
- **Manter original:** Criar cópia editada (futuro)

#### Processo:
1. Aplicar rotação no canvas
2. Aplicar crop no canvas
3. Converter para base64
4. Substituir no array de edição
5. Salvar ao clicar em "Salvar Projeto"

---

## 🔄 Fluxo de Dados

### Estado Atual:
```typescript
editingBeforeImages: string[]  // Array de base64
editingAfterImages: string[]  // Array de base64
```

### Após Edição:
```typescript
// Usuário edita imagem no índice 2
editingBeforeImages[2] = "data:image/jpeg;base64,..." // Nova versão editada
```

### Ao Salvar:
```typescript
// handleSaveEdit() já salva editingBeforeImages/editingAfterImages
// Imagem editada é salva automaticamente
```

---

## 🎯 Onde Adicionar o Botão "Editar Imagem"

### Opção 1: No Card de Imagem (Recomendado)
```
┌─────────────────────┐
│   [Imagem Preview]  │
│                     │
│  [🗑️] [✏️ Editar]   │  ← Botão aqui
└─────────────────────┘
```

### Opção 2: Menu de Ações
```
[Imagem] → [Menu] → [Editar Imagem]
```

### Opção 3: Hover no Desktop
```
Ao passar mouse sobre imagem:
[✏️ Editar] aparece
```

---

## 📦 Estrutura de Arquivos

### Novo Componente:
```
components/
  └── image-editor-modal.tsx
      ├── Rotação
      ├── Corte (react-easy-crop)
      ├── Preview
      └── Controles
```

### Funções Utilitárias:
```
lib/
  └── image-editor-utils.ts
      ├── rotateImage()
      ├── cropImage()
      ├── applyTransformations()
      └── convertToBase64()
```

---

## 🎨 Design da Interface

### Cores e Estilo:
- **Fundo do modal:** `#1A2B32` (mesmo do app)
- **Botões primários:** `#00A88F` (verde água)
- **Botões secundários:** `rgba(232, 220, 192, 0.1)`
- **Texto:** `#E8DCC0` (bege claro)

### Responsividade:
- **Desktop:** Modal grande com controles lado a lado
- **Mobile:** Modal fullscreen com controles empilhados
- **Touch:** Suporte completo para gestos

---

## ⚙️ Funcionalidades Técnicas

### 1. Processamento de Imagem

#### Rotação:
```typescript
function rotateImage(
  imageSrc: string, 
  degrees: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calcular novo tamanho após rotação
      const rad = (degrees * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      
      canvas.width = img.width * cos + img.height * sin;
      canvas.height = img.width * sin + img.height * cos;
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
  });
}
```

#### Corte:
```typescript
function cropImage(
  imageSrc: string,
  cropArea: { x: number; y: number; width: number; height: number },
  rotation: number = 0
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;
      
      // Aplicar rotação se necessário
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }
      
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );
      
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
  });
}
```

### 2. Integração com react-easy-crop

```typescript
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';

const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [rotation, setRotation] = useState(0);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
  setCroppedAreaPixels(croppedAreaPixels);
};

// Aplicar crop e rotação
const applyCrop = async () => {
  if (!croppedAreaPixels) return;
  
  const croppedImage = await getCroppedImg(
    imageSrc,
    croppedAreaPixels,
    rotation
  );
  
  return croppedImage;
};
```

---

## 🚀 Plano de Implementação

### Fase 1: Setup e Estrutura Base
1. ✅ Instalar `react-easy-crop`
2. ✅ Criar componente `ImageEditorModal`
3. ✅ Criar funções utilitárias de processamento
4. ✅ Integrar no modo de edição

### Fase 2: Funcionalidades Básicas
1. ✅ Rotação (90°, 180°, 270°)
2. ✅ Corte básico (livre)
3. ✅ Preview em tempo real
4. ✅ Aplicar e salvar

### Fase 3: Melhorias
1. ⏳ Rotação livre (0-360°)
2. ⏳ Proporções de crop pré-definidas
3. ⏳ Zoom durante edição
4. ⏳ Desfazer/Refazer

### Fase 4: Polimento
1. ⏳ Animações suaves
2. ⏳ Feedback visual
3. ⏳ Otimizações de performance
4. ⏳ Testes em mobile

---

## 📍 Onde Adicionar no Código

### 1. No Modo de Edição - Lista de Imagens ANTES

**Localização:** `app/projects/[id]/page.tsx` (linha ~1450-1500)

**Adicionar botão "Editar" em cada imagem:**

```typescript
{isEditing && (
  <div className="absolute top-2 right-2 flex gap-2">
    <button
      onClick={() => handleEditImage('before', index)}
      className="p-2 rounded-lg bg-black/50 hover:bg-black/70"
      title="Editar imagem"
    >
      <Edit2 className="w-4 h-4" style={{ color: '#E8DCC0' }} />
    </button>
  </div>
)}
```

### 2. Handler para Abrir Editor

```typescript
const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
const [editingImageType, setEditingImageType] = useState<'before' | 'after' | null>(null);
const [showImageEditor, setShowImageEditor] = useState(false);

const handleEditImage = (type: 'before' | 'after', index: number) => {
  setEditingImageType(type);
  setEditingImageIndex(index);
  setShowImageEditor(true);
};

const handleSaveEditedImage = (editedImage: string) => {
  if (editingImageType === 'before' && editingImageIndex !== null) {
    const newImages = [...editingBeforeImages];
    newImages[editingImageIndex] = editedImage;
    setEditingBeforeImages(newImages);
  } else if (editingImageType === 'after' && editingImageIndex !== null) {
    const newImages = [...editingAfterImages];
    newImages[editingImageIndex] = editedImage;
    setEditingAfterImages(newImages);
  }
  
  setShowImageEditor(false);
  setEditingImageIndex(null);
  setEditingImageType(null);
};
```

### 3. Modal de Edição

```typescript
{showImageEditor && editingImageIndex !== null && editingImageType && (
  <ImageEditorModal
    imageSrc={
      editingImageType === 'before'
        ? editingBeforeImages[editingImageIndex]
        : editingAfterImages[editingImageIndex]
    }
    onSave={handleSaveEditedImage}
    onCancel={() => {
      setShowImageEditor(false);
      setEditingImageIndex(null);
      setEditingImageType(null);
    }}
  />
)}
```

---

## 🎯 Benefícios do Cenário 2

### ✅ Vantagens:
1. **Não interfere no upload:** Usuário pode ajustar depois
2. **Flexível:** Edita apenas o que precisa
3. **Reversível:** Pode cancelar sem perder original
4. **Contextual:** Vê todas as imagens do projeto
5. **Integrado:** Faz parte do fluxo de edição existente

### ⚠️ Considerações:
1. **Qualidade:** Manter qualidade original ao editar
2. **Performance:** Processar imagens grandes pode ser lento
3. **Armazenamento:** Imagens editadas podem aumentar tamanho do projeto
4. **UX:** Interface deve ser intuitiva e rápida

---

## 📊 Comparação: Antes vs Depois

### Antes (Sem Edição):
```
Upload → Salvar → Visualizar
```

### Depois (Com Edição):
```
Upload → Salvar → Visualizar → Editar → Ajustar Imagem → Salvar
```

---

## 🔮 Funcionalidades Futuras (Pós-MVP)

1. **Ajustes de Imagem:**
   - Brilho, contraste, saturação
   - Filtros básicos
   - Correção automática

2. **Anotações na Imagem:**
   - Desenhar sobre a imagem
   - Adicionar texto
   - Setas e formas

3. **Comparação Antes/Depois da Edição:**
   - Preview lado a lado
   - Histórico de edições

4. **Templates de Crop:**
   - Formatos para redes sociais
   - Formatos profissionais

---

## ✅ Checklist de Implementação

### Preparação:
- [ ] Instalar `react-easy-crop`
- [ ] Criar componente `ImageEditorModal`
- [ ] Criar funções utilitárias
- [ ] Adicionar tipos TypeScript

### Integração:
- [ ] Adicionar botão "Editar" nas imagens
- [ ] Criar handlers de edição
- [ ] Integrar modal no modo de edição
- [ ] Conectar com arrays de edição

### Funcionalidades:
- [ ] Rotação básica (90°, 180°, 270°)
- [ ] Rotação livre (0-360°)
- [ ] Corte livre
- [ ] Proporções de crop
- [ ] Preview em tempo real
- [ ] Aplicar transformações
- [ ] Salvar imagem editada

### UX/UI:
- [ ] Design responsivo
- [ ] Feedback visual
- [ ] Animações suaves
- [ ] Mensagens de erro
- [ ] Loading states

### Testes:
- [ ] Testar em desktop
- [ ] Testar em mobile
- [ ] Testar com imagens grandes
- [ ] Testar performance
- [ ] Testar salvamento

---

## 💡 Exemplo de Uso

### Fluxo Completo:

1. **Usuário visualiza projeto**
   - Vê imagens ANTES e DEPOIS

2. **Clica em "Editar" (projeto)**
   - Entra no modo de edição
   - Vê botões de ação em cada imagem

3. **Clica em "✏️ Editar" em uma imagem ANTES**
   - Abre modal de edição
   - Imagem carrega no editor

4. **Rotaciona imagem 90°**
   - Clica em botão ↻
   - Preview atualiza instantaneamente

5. **Faz um corte**
   - Seleciona área arrastando
   - Ajusta tamanho e posição
   - Preview mostra resultado

6. **Clica em "Aplicar Alterações"**
   - Processa imagem
   - Substitui original no array
   - Fecha modal

7. **Clica em "Salvar" (projeto)**
   - Salva projeto com imagem editada
   - Imagem editada é permanente

---

## 🎨 Mockup Visual (Texto)

```
┌─────────────────────────────────────────────┐
│  [X] Editar Imagem - ANTES #1               │
├─────────────────────────────────────────────┤
│                                             │
│   ┌─────────────────────────────────┐      │
│   │                                 │      │
│   │                                 │      │
│   │    [Imagem com Área de Crop]   │      │
│   │    ┌─────────────┐              │      │
│   │    │   CROP      │              │      │
│   │    └─────────────┘              │      │
│   │                                 │      │
│   └─────────────────────────────────┘      │
│                                             │
│   Rotação:                                  │
│   [↺ 90°] [↻ 90°] [↻↻ 180°]                │
│   ──────────●───────── 45°                 │
│                                             │
│   Proporções:                               │
│   ○ Livre  ● 1:1  ○ 4:3  ○ 16:9           │
│                                             │
│   [Cancelar]    [Aplicar Alterações]        │
└─────────────────────────────────────────────┘
```

---

## 📦 Dependências Necessárias

```json
{
  "react-easy-crop": "^5.0.0",
  "@types/react-easy-crop": "^1.0.0" // Se usar TypeScript
}
```

---

## 🚦 Próximos Passos

1. **Decisão:** Confirmar se quer implementar agora
2. **Biblioteca:** Confirmar uso de `react-easy-crop`
3. **Escopo:** Definir quais funcionalidades na Fase 1
4. **Design:** Aprovar interface proposta
5. **Implementação:** Começar desenvolvimento

---

**Status:** 📝 Planejamento Completo - Aguardando Aprovação para Implementação


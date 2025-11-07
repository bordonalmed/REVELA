# 🔧 COMO TESTAR AS NOVAS FUNCIONALIDADES

## ⚠️ MUITO IMPORTANTE - LIMPE O CACHE!

O navegador está mostrando a versão antiga. Você PRECISA limpar o cache:

### **Opção 1: Hard Reload (Recomendado)**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### **Opção 2: Limpar Cache Completo**
```
1. Pressione: Ctrl + Shift + Delete
2. Marque: "Imagens e arquivos em cache"
3. Clique: "Limpar dados"
```

### **Opção 3: Aba Anônima (Mais Fácil)**
```
Ctrl + Shift + N (Chrome/Edge)
Depois acesse: http://localhost:3000
```

---

## 🧪 TESTE 1: Swipe Funciona?

### **O que você deve ver na VERTICAL:**

✅ **SEM SETAS** nas imagens (antes e depois)
✅ **Contador no label**: "ANTES 1/5" e "DEPOIS 1/3"
✅ **Imagens ocupam toda tela**

### **Como testar o swipe:**

1. Abra visualizar projeto
2. **Coloque o dedo na imagem ANTES**
3. **Deslize para ESQUERDA** → Próxima imagem
4. **Deslize para DIREITA** → Imagem anterior
5. Veja se o contador muda: 1/5 → 2/5 → 3/5
6. Faça o mesmo com a imagem DEPOIS

---

## 🧪 TESTE 2: Horizontal Funciona?

### **Como testar:**

1. **Rotacione o celular** para horizontal
2. As imagens devem aparecer **LADO A LADO**
3. Cada imagem ocupa **50% da largura**
4. **SEM SCROLL**

### **Se não aparecer:**

1. Abra o console do navegador (F12)
2. Vá na aba "Console"
3. Rotacione o celular
4. Me diga o que aparece (ex: "Orientação: HORIZONTAL 844x390")

---

## ❓ O QUE VOCÊ ESTÁ VENDO?

### **Cenário A: As setas AINDA aparecem**
→ Cache não foi limpo! Use aba anônima.

### **Cenário B: Swipe NÃO funciona**
→ Me diga: Aparece algum erro no console (F12)?

### **Cenário C: Horizontal não mostra imagens**
→ Me diga: O que aparece no console quando rotaciona?

### **Cenário D: Tudo funcionando!**
→ Diga: "Funcionou!" e me conte se ficou bom!

---

## 📱 CHECKLIST FINAL

Marque o que você testou:

- [ ] Limpou cache (Ctrl+Shift+R ou aba anônima)
- [ ] Aguardou 15 segundos para servidor reiniciar
- [ ] Viu as imagens SEM SETAS na vertical
- [ ] Conseguiu fazer swipe (deslizar)
- [ ] Contador mudou (1/5 → 2/5)
- [ ] Testou horizontal (rotacionou celular)
- [ ] Verificou console (F12) se horizontal não funcionou

---

## 🚨 SE NADA FUNCIONAR

Me responda estas perguntas:

1. **Você limpou o cache?** (Sim/Não)
2. **As setas ainda aparecem?** (Sim/Não)
3. **Qual navegador está usando?** (Chrome/Firefox/Safari/Edge)
4. **Está testando no celular ou computador?** (Celular/PC)
5. **Qual orientação?** (Vertical/Horizontal)

---

**Criado para debug das funcionalidades mobile**


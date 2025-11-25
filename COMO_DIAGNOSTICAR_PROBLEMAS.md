# 🔍 Como Diagnosticar Problemas de Instabilidade

## 🎯 Problema: Site funciona em alguns navegadores/dispositivos e em outros não

Este guia vai te ajudar a identificar **exatamente** o que está causando o problema.

---

## 📋 Passo 1: Acessar Página de Debug

1. **Abra o site no navegador/dispositivo que NÃO está funcionando**
2. **Acesse**: `https://seu-site.netlify.app/debug`
   - Ou `http://localhost:3000/debug` se estiver testando localmente

3. **A página vai mostrar**:
   - ✅ Informações do navegador
   - ✅ Recursos disponíveis (localStorage, IndexedDB, etc.)
   - ✅ Problemas detectados automaticamente
   - ✅ Tamanho da tela e janela

---

## 📋 Passo 2: Coletar Informações

### Opção A: Copiar para Clipboard
1. Na página de debug, clique em **"📋 Copiar Informações"**
2. Cole em um arquivo de texto ou envie para análise

### Opção B: Baixar JSON
1. Clique em **"💾 Baixar JSON"**
2. Salve o arquivo para comparar entre dispositivos

---

## 📋 Passo 3: Comparar Dispositivos

### O que comparar:

1. **Armazenamento**:
   - ✅ localStorage disponível?
   - ✅ IndexedDB disponível?
   - ❌ Se algum estiver indisponível, pode ser o problema!

2. **Recursos**:
   - ✅ Canvas disponível? (necessário para compressão de imagens)
   - ✅ Service Worker disponível?

3. **Problemas Detectados**:
   - A página mostra avisos em vermelho
   - Anote todos os avisos

---

## 📋 Passo 4: Verificar Console do Navegador

1. **Abra o Console**:
   - Chrome/Edge: `F12` → aba "Console"
   - Firefox: `F12` → aba "Console"
   - Safari: `Cmd+Option+C` (Mac)

2. **Procure por**:
   - ❌ Erros em vermelho
   - ⚠️ Avisos em amarelo
   - Mensagens que começam com `[ErrorLogger]`

3. **Anote**:
   - Qualquer erro que aparecer
   - Especialmente erros relacionados a:
     - `localStorage`
     - `IndexedDB`
     - `Image`
     - `Canvas`

---

## 📋 Passo 5: Testar Funcionalidades Específicas

### Teste 1: Armazenamento
No console do navegador, execute:

```javascript
// Testar localStorage
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('✅ localStorage funciona');
} catch (e) {
  console.error('❌ localStorage NÃO funciona:', e);
}

// Testar IndexedDB
if (window.indexedDB) {
  console.log('✅ IndexedDB disponível');
} else {
  console.error('❌ IndexedDB NÃO disponível');
}
```

### Teste 2: Canvas (para compressão de imagens)
No console, execute:

```javascript
try {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    console.log('✅ Canvas funciona');
  } else {
    console.error('❌ Canvas NÃO funciona');
  }
} catch (e) {
  console.error('❌ Canvas erro:', e);
}
```

---

## 🔍 Problemas Comuns e Soluções

### ❌ Problema: localStorage bloqueado
**Sintomas**: 
- Site não salva projetos
- Erro no console sobre localStorage

**Causas**:
- Modo privado/anônimo
- Extensões de privacidade
- Configurações do navegador

**Solução**:
- Verificar se está em modo privado
- Desabilitar extensões temporariamente
- Verificar configurações de privacidade

---

### ❌ Problema: IndexedDB não disponível
**Sintomas**:
- Projetos não carregam
- Aviso na página de debug

**Causas**:
- Navegador muito antigo
- Modo privado (alguns navegadores)
- Configurações de segurança

**Solução**:
- O sistema já tem fallback para localStorage
- Mas pode ter limitações de tamanho

---

### ❌ Problema: Canvas não funciona
**Sintomas**:
- Erro ao adicionar imagens
- Compressão de imagens falha

**Causas**:
- Navegador muito antigo
- Extensões bloqueando

**Solução**:
- Atualizar navegador
- Testar em outro navegador

---

### ❌ Problema: Memória insuficiente
**Sintomas**:
- Site fica lento
- Pode travar ou não carregar

**Diagnóstico**:
- Verificar na página de debug
- Verificar uso de memória no console:
  ```javascript
  if (performance.memory) {
    const mem = performance.memory;
    console.log('Memória:', (mem.usedJSHeapSize / 1048576).toFixed(2), 'MB');
  }
  ```

**Solução**:
- Reduzir número de imagens por projeto
- Fechar outras abas
- Reiniciar navegador

---

## 📊 Checklist de Diagnóstico

Quando o site não funciona em um dispositivo/navegador:

- [ ] Acessei `/debug` e coletei informações
- [ ] Verifiquei console do navegador (F12)
- [ ] Testei localStorage no console
- [ ] Testei IndexedDB no console
- [ ] Testei Canvas no console
- [ ] Comparei com dispositivo que funciona
- [ ] Anotei todos os erros do console
- [ ] Verifiquei se está em modo privado
- [ ] Verifiquei extensões instaladas
- [ ] Verifiquei versão do navegador

---

## 🆘 Coletar Informações para Suporte

Se precisar de ajuda, colete:

1. **Informações de Debug**:
   - Acesse `/debug`
   - Copie todas as informações
   - Ou baixe o JSON

2. **Console do Navegador**:
   - Screenshot dos erros
   - Ou copie o texto dos erros

3. **Informações do Dispositivo**:
   - Navegador e versão
   - Sistema operacional
   - Dispositivo (desktop/mobile/tablet)

4. **O que acontece**:
   - Site não carrega?
   - Carrega mas não salva?
   - Erro específico?

---

## 💡 Dicas

1. **Sempre teste em modo anônimo primeiro**
   - Elimina problemas de cache/extensões

2. **Compare navegadores**
   - Se funciona no Chrome mas não no Firefox, pode ser problema específico

3. **Verifique versões**
   - Navegadores muito antigos podem não ter suporte

4. **Teste em diferentes dispositivos**
   - Desktop vs Mobile pode ter diferenças

---

**Criado para ajudar no diagnóstico de problemas de instabilidade** 🔍


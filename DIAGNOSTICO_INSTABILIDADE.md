# 🔍 Diagnóstico de Instabilidade - Revela

## ✅ Melhorias Implementadas

### 1. Componente de Imagem Seguro
- **SafeImage**: Para logos e imagens estáticas (usa Next.js Image)
- **SafeBase64Image**: Para imagens dos projetos (base64)
- Ambos têm:
  - Retry automático (2 tentativas)
  - Placeholder quando falha
  - Logging de erros
  - Não quebram a aplicação se falharem

### 2. Sistema de Logging
- **errorLogger**: Utilitário centralizado para logging
- Captura erros não tratados automaticamente
- Armazena logs no localStorage (desenvolvimento)
- Verifica problemas comuns (IndexedDB, localStorage, memória)

### 3. Tratamento de Erros Melhorado
- Validação de estrutura de projetos
- Fallback entre IndexedDB e localStorage
- Mensagens de erro mais informativas
- Error Boundary já implementado no layout

## 🛠️ Como Diagnosticar Problemas

### 1. Abrir Console do Navegador
1. Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
2. Ou `Cmd+Option+I` (Mac)
3. Vá para a aba **Console**

### 2. Verificar Logs de Erro
No console, procure por mensagens que começam com:
- `[ErrorLogger] error:` - Erros críticos
- `[ErrorLogger] warn:` - Avisos (problemas não críticos)
- `[ErrorLogger] info:` - Informações (carregamento, etc.)

### 3. Verificar Logs Armazenados (Desenvolvimento)
No console do navegador, execute:
```javascript
// Ver logs armazenados
const logs = JSON.parse(localStorage.getItem('revela_error_logs') || '[]');
console.table(logs);

// Ou ver todos os logs
import { errorLogger } from '@/lib/error-logger';
console.log(errorLogger.getLogs());
```

### 4. Verificar Problemas Comuns

#### Problema: Logo não carrega
**Sintomas**: Logo não aparece, página pode não carregar
**Diagnóstico**:
```javascript
// No console
fetch('/revela3.png')
  .then(r => console.log('Logo status:', r.status))
  .catch(e => console.error('Logo erro:', e));
```
**Solução**: 
- Verificar se arquivo existe em `public/revela3.png`
- Limpar cache do navegador (Ctrl+Shift+R)
- Verificar console para erros específicos

#### Problema: Imagens dos projetos não carregam
**Sintomas**: Imagens aparecem como placeholder
**Diagnóstico**:
- Verificar console para mensagens `[ErrorLogger] warn: Erro ao carregar imagem base64`
- Verificar se dados estão corrompidos no IndexedDB/localStorage
**Solução**:
- As imagens agora têm retry automático
- Se falharem, mostram placeholder ao invés de quebrar

#### Problema: IndexedDB não funciona
**Sintomas**: Projetos não carregam, erro no console
**Diagnóstico**:
```javascript
// Verificar se IndexedDB está disponível
console.log('IndexedDB disponível:', !!window.indexedDB);

// Verificar se há projetos no localStorage
const stored = localStorage.getItem('revela_projects');
console.log('Projetos no localStorage:', stored ? JSON.parse(stored).length : 0);
```
**Solução**: 
- O sistema já tem fallback automático para localStorage
- Se ambos falharem, verificar permissões do navegador

#### Problema: Memória insuficiente
**Sintomas**: Site fica lento, pode travar
**Diagnóstico**:
```javascript
// Verificar uso de memória (Chrome)
if (performance.memory) {
  const mem = performance.memory;
  console.log('Memória usada:', (mem.usedJSHeapSize / 1048576).toFixed(2), 'MB');
  console.log('Limite:', (mem.jsHeapSizeLimit / 1048576).toFixed(2), 'MB');
}
```
**Solução**:
- Reduzir número de imagens por projeto
- Comprimir imagens antes de salvar
- Limpar projetos antigos

### 5. Exportar Logs para Análise
Para reportar problemas, exporte os logs:
```javascript
import { errorLogger } from '@/lib/error-logger';
const logs = errorLogger.exportLogs();
console.log(logs);
// Copiar e colar em um arquivo de texto
```

## 📊 Checklist de Verificação

Quando o site não carrega, verifique:

- [ ] Console do navegador (F12) - há erros?
- [ ] Logo carrega? (verificar Network tab)
- [ ] IndexedDB disponível? (console: `!!window.indexedDB`)
- [ ] localStorage disponível? (console: `!!window.localStorage`)
- [ ] Há projetos salvos? (console: `localStorage.getItem('revela_projects')`)
- [ ] Memória suficiente? (verificar Performance tab)
- [ ] Cache limpo? (Ctrl+Shift+R)
- [ ] Testado em outro navegador?
- [ ] Testado em modo anônimo?

## 🔧 Comandos Úteis no Console

```javascript
// Ver todos os logs
import { errorLogger } from '@/lib/error-logger';
console.log(errorLogger.getLogs());

// Limpar logs
errorLogger.clearLogs();

// Verificar problemas comuns
errorLogger.checkCommonIssues();

// Ver projetos salvos
const projects = JSON.parse(localStorage.getItem('revela_projects') || '[]');
console.log('Projetos:', projects.length);
console.table(projects.map(p => ({ id: p.id, name: p.name, date: p.date })));

// Verificar tamanho dos dados
const data = localStorage.getItem('revela_projects');
console.log('Tamanho:', (data?.length || 0) / 1024, 'KB');
```

## 🎯 Próximos Passos se Problema Persistir

1. **Coletar informações**:
   - Screenshot do console com erros
   - Logs exportados (usando `errorLogger.exportLogs()`)
   - Navegador e versão
   - Sistema operacional

2. **Testar em ambiente limpo**:
   - Modo anônimo
   - Outro navegador
   - Outro dispositivo

3. **Verificar recursos**:
   - Espaço em disco
   - Memória RAM disponível
   - Conexão de internet (se aplicável)

## 💡 Dicas de Prevenção

1. **Sempre validar dados antes de usar**
2. **Usar try/catch em operações assíncronas**
3. **Implementar fallbacks (IndexedDB → localStorage)**
4. **Limitar tamanho de dados (comprimir imagens)**
5. **Monitorar uso de memória**
6. **Logar erros para diagnóstico**

---

**Criado para ajudar no diagnóstico de problemas de instabilidade** 🔍


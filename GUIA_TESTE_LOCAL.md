# 🧪 Guia de Teste Local - Revela

## 🚀 Servidor Iniciado

O servidor de desenvolvimento está rodando em: **http://localhost:3000**

---

## ✅ Checklist de Testes

### 1. **Testar Busca e Filtros (NOVO!)** 🔍

#### Acesse: `http://localhost:3000/projects`

**Teste de Busca:**
- [ ] Digite parte do nome de um projeto
- [ ] Verifique se os resultados filtram em tempo real
- [ ] Clique no X para limpar a busca
- [ ] Teste com nome que não existe (deve mostrar "Nenhum projeto encontrado")

**Teste de Filtros por Data:**
- [ ] Clique no botão "Filtros"
- [ ] Teste cada opção: Hoje, Última Semana, Último Mês, Último Ano
- [ ] Verifique se os projetos são filtrados corretamente
- [ ] Clique em "Limpar filtro" quando um filtro estiver ativo

**Teste de Ordenação:**
- [ ] Selecione "Mais Recentes" - deve mostrar os mais novos primeiro
- [ ] Selecione "Mais Antigos" - deve mostrar os mais velhos primeiro
- [ ] Selecione "Nome A-Z" - deve ordenar alfabeticamente
- [ ] Selecione "Nome Z-A" - deve ordenar inversamente

**Teste Combinado:**
- [ ] Use busca + filtro de data + ordenação ao mesmo tempo
- [ ] Verifique se o contador mostra "X de Y projetos" corretamente

---

### 2. **Testar Funcionalidades Básicas**

#### Criar Projeto
- [ ] Acesse `/new-project`
- [ ] Preencha nome e data
- [ ] Adicione fotos "Antes" e "Depois"
- [ ] Salve o projeto
- [ ] Verifique se aparece na lista

#### Visualizar Projeto
- [ ] Clique em "Visualizar" em um projeto
- [ ] Navegue pelas imagens com as setas
- [ ] Teste em modo retrato (mobile)
- [ ] Teste em modo paisagem (desktop/tablet)

#### Editar Projeto
- [ ] Clique em "Editar" em um projeto
- [ ] Adicione novas fotos
- [ ] Remova fotos existentes
- [ ] Salve as alterações

#### Excluir Projeto
- [ ] Clique no ícone de lixeira
- [ ] Confirme a exclusão
- [ ] Verifique se foi removido da lista

---

### 3. **Testar Responsividade**

#### Mobile (375px - 767px)
- [ ] Layout empilhado (imagens uma sobre a outra)
- [ ] Busca e filtros funcionam bem
- [ ] Botões são clicáveis
- [ ] Texto legível

#### Tablet (768px - 1023px)
- [ ] Grid de 2 colunas na lista de projetos
- [ ] Filtros expandem corretamente

#### Desktop (1024px+)
- [ ] Grid de 3 colunas na lista de projetos
- [ ] Layout lado a lado na visualização
- [ ] Todos os controles visíveis

---

### 4. **Testar Página de Debug**

#### Acesse: `http://localhost:3000/debug`

- [ ] Página carrega sem erros
- [ ] Mostra informações do navegador
- [ ] Mostra status de localStorage, IndexedDB, Canvas
- [ ] Botão "Copiar Informações" funciona
- [ ] Botão "Baixar JSON" funciona
- [ ] Problemas detectados aparecem em vermelho (se houver)

---

### 5. **Testar Tratamento de Erros**

#### Simular Problemas:
- [ ] Abra DevTools (F12) → Application → IndexedDB
- [ ] Delete o banco "RevelaDB"
- [ ] Recarregue a página
- [ ] Verifique se usa localStorage como fallback

#### Testar com Dados Inválidos:
- [ ] Tente criar projeto sem nome
- [ ] Tente criar projeto sem fotos
- [ ] Verifique se mostra mensagens de erro adequadas

---

### 6. **Testar Performance**

#### Com Muitos Projetos:
- [ ] Crie 10+ projetos (ou use dados de teste)
- [ ] Teste busca com muitos resultados
- [ ] Teste filtros com muitos projetos
- [ ] Verifique se não há travamentos

#### Com Imagens Grandes:
- [ ] Faça upload de imagens grandes (5MB+)
- [ ] Verifique se comprime automaticamente
- [ ] Verifique se salva corretamente

---

## 🐛 O que Observar

### Console do Navegador (F12)
- ❌ **Erros em vermelho**: Anote qualquer erro
- ⚠️ **Avisos em amarelo**: Verifique se são esperados
- ℹ️ **Logs [ErrorLogger]**: Devem aparecer apenas em desenvolvimento

### Performance
- ⏱️ **Tempo de carregamento**: Deve ser rápido (< 2s)
- 💾 **Uso de memória**: Não deve aumentar muito
- 🔄 **Transições**: Devem ser suaves

### Funcionalidades
- ✅ **Busca**: Deve filtrar instantaneamente
- ✅ **Filtros**: Devem funcionar corretamente
- ✅ **Ordenação**: Deve ordenar corretamente
- ✅ **Contador**: Deve mostrar número correto

---

## 📝 Problemas Comuns e Soluções

### Problema: Busca não funciona
**Solução**: Verifique se há projetos salvos e se o nome está correto

### Problema: Filtros não funcionam
**Solução**: Verifique se as datas dos projetos estão corretas

### Problema: Ordenação não funciona
**Solução**: Limpe os filtros e tente novamente

### Problema: Página não carrega
**Solução**: 
1. Verifique console (F12) para erros
2. Verifique se servidor está rodando
3. Tente limpar cache (Ctrl+Shift+R)

---

## 🎯 Testes Específicos da Nova Funcionalidade

### Teste 1: Busca Simples
1. Crie 3 projetos com nomes diferentes: "Projeto A", "Projeto B", "Projeto C"
2. Na busca, digite "A"
3. **Esperado**: Apenas "Projeto A" aparece

### Teste 2: Filtro por Data
1. Crie um projeto com data de hoje
2. Crie outro com data de 2 meses atrás
3. Filtre por "Último Mês"
4. **Esperado**: Apenas o projeto de hoje aparece

### Teste 3: Ordenação
1. Crie projetos com nomes: "Zebra", "Alpha", "Beta"
2. Ordene por "Nome A-Z"
3. **Esperado**: Alpha, Beta, Zebra (nesta ordem)

### Teste 4: Combinação
1. Crie vários projetos
2. Use busca + filtro + ordenação
3. **Esperado**: Resultados corretos e contador atualizado

---

## ✅ Após os Testes

Se tudo funcionar:
- ✅ Faça commit das alterações
- ✅ Faça push para GitHub
- ✅ Deploy no Netlify

Se encontrar problemas:
- 📝 Anote o problema
- 🔍 Verifique console (F12)
- 📸 Tire screenshot se necessário
- 💬 Me avise para corrigir!

---

**Bons testes!** 🚀


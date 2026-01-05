# Checklist - Por que o Deploy no Netlify não está acontecendo?

## Verificações Necessárias

### 1. Verificar Configuração do Site no Netlify

1. Acesse o **Netlify Dashboard**
2. Vá em **Site settings** > **Build & deploy**
3. Verifique:
   - **Branch to deploy**: Deve estar configurado para `main` (ou `master`)
   - **Build command**: Deve estar como `npm run build` ou usar o `netlify.toml`
   - **Publish directory**: Deve estar como `.next` ou usar o `netlify.toml`

### 2. Verificar Webhook do GitHub

1. No Netlify: **Site settings** > **Build & deploy** > **Build hooks**
2. Verifique se há um webhook configurado
3. No GitHub: Vá em **Settings** > **Webhooks** do repositório
4. Verifique se há um webhook do Netlify ativo

### 3. Verificar Se o Push Foi Realizado

Execute no terminal:
```bash
git log origin/main --oneline -5
```

Compare com:
```bash
git log --oneline -5
```

Se forem diferentes, você precisa fazer push:
```bash
git push origin main
```

### 4. Forçar Deploy Manual

No Netlify Dashboard:
1. Vá em **Deploys**
2. Clique em **Trigger deploy** > **Deploy site**
3. Ou **Trigger deploy** > **Clear cache and deploy site**

### 5. Verificar Logs de Build

1. No Netlify: **Deploys** > Clique no último deploy
2. Verifique os logs para ver se há erros
3. Se houver erro, copie a mensagem completa

### 6. Verificar Configuração do Repositório

1. No Netlify: **Site settings** > **Build & deploy** > **Continuous Deployment**
2. Verifique se está conectado ao repositório correto: `bordonalmed/REVELA`
3. Verifique se o branch está correto: `main`

### 7. Verificar Status do Site

1. No Netlify: **Site overview**
2. Verifique se o site está **Active**
3. Verifique se há algum aviso ou erro

## Soluções Comuns

### Solução 1: Reconfigurar o Site

1. No Netlify: **Site settings** > **Build & deploy** > **Continuous Deployment**
2. Clique em **Stop publishing** (se estiver ativo)
3. Clique em **Link to Git provider**
4. Reconecte ao repositório GitHub
5. Configure o branch `main`

### Solução 2: Criar Build Hook Manual

1. No Netlify: **Site settings** > **Build & deploy** > **Build hooks**
2. Clique em **Add build hook**
3. Dê um nome (ex: "Manual Deploy")
4. Copie a URL do hook
5. Use essa URL para fazer deploy manual quando necessário

### Solução 3: Verificar Permissões do GitHub

1. No GitHub: Vá em **Settings** > **Applications** > **Authorized OAuth Apps**
2. Verifique se o Netlify tem permissões para acessar o repositório
3. Se não tiver, reconecte a conta do GitHub no Netlify

### Solução 4: Fazer Push Manual

Se o GitHub Desktop não estiver fazendo push automaticamente:

1. No GitHub Desktop: **Repository** > **Push origin**
2. Ou use o terminal:
   ```bash
   git push origin main
   ```

### Solução 5: Verificar se há Commits Não Enviados

Execute:
```bash
git status
git log origin/main..HEAD
```

Se houver commits locais não enviados, faça push:
```bash
git push origin main
```

## Comandos Úteis

```bash
# Verificar status
git status

# Ver commits locais não enviados
git log origin/main..HEAD --oneline

# Fazer push manual
git push origin main

# Verificar branch atual
git branch

# Verificar remoto
git remote -v
```

## Próximos Passos

1. Verifique cada item do checklist acima
2. Tente fazer deploy manual no Netlify
3. Se ainda não funcionar, verifique os logs de build
4. Entre em contato com o suporte do Netlify se necessário


# 🚀 DEPLOY NO NETLIFY - REVELA

## 📋 Pré-requisitos

- ✅ Conta no GitHub (já configurado)
- ✅ Código no repositório (https://github.com/bordonalmed/REVELA.git)
- 🔲 Conta no Netlify (gratuita)

---

## 🎯 PASSO A PASSO COMPLETO

### 1️⃣ Criar Conta no Netlify (se ainda não tiver)

1. Acesse: https://www.netlify.com
2. Clique em **"Sign up"**
3. Escolha **"Sign up with GitHub"** (mais fácil)
4. Autorize o Netlify a acessar sua conta GitHub

---

### 2️⃣ Fazer Deploy via GitHub

#### Opção 1: Deploy Automático (Recomendado)

1. **No Netlify Dashboard:**
   - Clique em **"Add new site"** → **"Import an existing project"**
   
2. **Escolha o GitHub:**
   - Clique em **"GitHub"**
   - Autorize o acesso ao repositório se solicitado
   
3. **Selecione o Repositório:**
   - Procure por: `bordonalmed/REVELA`
   - Clique no repositório
   
4. **Configurações de Build:**
   ```
   Branch to deploy: main
   Build command: npm run build
   Publish directory: .next
   ```
   
5. **Variáveis de Ambiente (IMPORTANTE!):**
   - Clique em **"Show advanced"**
   - Clique em **"New variable"**
   - Adicione:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://uxlwepmfhxexalxkifpa.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bHdlcG1maHhleGFseGtpZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzYzOTIsImV4cCI6MjA3Nzg1MjM5Mn0.9ozGOKWCEbEfk_iWA209GcBrGLt6fHofuTGjUu5jRNY
   ```
   
6. **Deploy:**
   - Clique em **"Deploy site"**
   - Aguarde 2-5 minutos para o build completar

---

### 3️⃣ Após o Deploy

1. **Verificar URL:**
   - Netlify vai gerar uma URL aleatória tipo: `random-name-123456.netlify.app`
   - Acesse a URL para testar o site
   
2. **Personalizar URL (Opcional):**
   - No Dashboard do Netlify → **Site settings** → **Domain management**
   - Clique em **"Change site name"**
   - Escolha um nome: `revela-projetos.netlify.app` (se disponível)
   
3. **Configurar Domínio Próprio (Opcional):**
   - Se tiver um domínio: **Domain management** → **Add custom domain**

---

### 4️⃣ Deploy Contínuo (Automático)

✅ **Já configurado!**

Toda vez que você fizer `git push` para o GitHub, o Netlify vai:
1. Detectar as mudanças automaticamente
2. Fazer build do projeto
3. Publicar a nova versão

---

## 🔧 Configurações Importantes no Netlify

### Headers de Segurança (Já no netlify.toml)

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### Redirects para SPA

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## ⚙️ Configurar Supabase para o Domínio Netlify

**IMPORTANTE!** Após o deploy, você precisa adicionar o domínio do Netlify ao Supabase:

1. Acesse: https://supabase.com/dashboard
2. Vá no seu projeto
3. **Settings** → **API** → **URL Configuration**
4. Em **Site URL**, adicione: `https://seu-site.netlify.app`
5. Em **Redirect URLs**, adicione:
   ```
   https://seu-site.netlify.app
   https://seu-site.netlify.app/dashboard
   https://seu-site.netlify.app/login
   https://seu-site.netlify.app/signup
   ```

---

## 📱 Testando o Site

Após o deploy, teste:

- ✅ Landing page
- ✅ Cadastro de usuário
- ✅ Login
- ✅ Dashboard
- ✅ Criar projeto
- ✅ Upload de fotos
- ✅ Visualização de projetos

---

## 🐛 Solução de Problemas

### Build Falhou?

1. **Verifique os logs no Netlify**
2. **Erros comuns:**
   - Variáveis de ambiente não configuradas
   - Erro de build do Next.js
   - Dependências faltando

### Site Carrega mas Autenticação não Funciona?

- Verifique se as URLs foram adicionadas no Supabase
- Confirme as variáveis de ambiente no Netlify

### Imagens não Carregam?

- Next.js no Netlify requer configuração especial para imagens
- Use o plugin `@netlify/plugin-nextjs`

---

## 🔄 Atualizações Futuras

Para atualizar o site:

```bash
git add .
git commit -m "Sua mensagem de atualização"
git push origin main
```

O Netlify vai detectar e fazer o deploy automaticamente!

---

## 📊 Monitoramento

No Dashboard do Netlify você pode ver:

- 📈 Analytics (visitas, páginas mais acessadas)
- 🔍 Logs de deploy
- ⚡ Performance
- 🔒 Segurança

---

## 💰 Limites do Plano Gratuito

- ✅ 100 GB de banda por mês
- ✅ 300 minutos de build por mês
- ✅ Deploy automático do GitHub
- ✅ HTTPS gratuito
- ✅ Deploy em segundos

**Perfeitamente adequado para o Revela!**

---

## 🎉 Pronto!

Seu site estará no ar em:
- **URL Temporária**: `https://random-name.netlify.app`
- **URL Personalizada**: `https://revela-projetos.netlify.app` (se você configurar)

---

**Criado por Equipe Revela** 🚀


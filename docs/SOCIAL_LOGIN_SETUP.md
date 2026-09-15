# Login com Google e Apple

O código já está pronto (`components/oauth-buttons.tsx`, usado em `/login` e `/signup`).
Ele chama `supabase.auth.signInWithOAuth({ provider: 'google' | 'apple' })`. Para os
botões funcionarem, os provedores precisam ser habilitados no **seu** projeto Supabase —
isso só pode ser feito por quem tem acesso ao painel (não dá para configurar por aqui).

## 1. Google

### 1.1. Criar credenciais OAuth no Google Cloud Console
1. Acesse https://console.cloud.google.com/apis/credentials (crie um projeto se não tiver).
2. **Create Credentials → OAuth client ID**.
3. Tipo de aplicativo: **Web application**.
4. Em **Authorized redirect URIs**, adicione a URL de callback do Supabase (você encontra
   o valor exato na tela do próprio Supabase no passo 1.2, algo como
   `https://SEU_PROJETO.supabase.co/auth/v1/callback`).
5. Copie o **Client ID** e o **Client Secret** gerados.

### 1.2. Habilitar no Supabase
1. No painel do Supabase: **Authentication → Providers → Google**.
2. Ative o provedor e cole o **Client ID** e **Client Secret** do passo anterior.
3. Salve.

## 2. Apple ("Sign in with Apple")

Mais burocrático que o Google — precisa de conta paga no Apple Developer Program.

### 2.1. Apple Developer
1. Crie um **App ID** (ou use um existente) com a capability **Sign In with Apple** habilitada.
2. Crie um **Services ID** (esse é o "Client ID" usado no login web) e habilite
   **Sign In with Apple** nele, configurando o domínio do site e a **Return URL**
   (a mesma URL de callback do Supabase, ex.: `https://SEU_PROJETO.supabase.co/auth/v1/callback`).
3. Crie uma **Key** com **Sign In with Apple** habilitado e baixe o arquivo `.p8`
   (só é possível baixar uma vez — guarde em local seguro).
4. Anote: **Team ID**, **Key ID** e o **Services ID** (usado como Client ID).

### 2.2. Habilitar no Supabase
1. **Authentication → Providers → Apple**.
2. Preencha Client ID (o Services ID), Team ID, Key ID e cole o conteúdo do arquivo `.p8`.
3. Salve.

## 3. Configuração comum no Supabase

Em **Authentication → URL Configuration**, confirme que:
- **Site URL** aponta para `https://www.revela.fun` (produção).
- **Redirect URLs** inclui `https://www.revela.fun/**` (e, se for testar localmente,
  `http://localhost:3000/**`).

Sem isso, o Supabase recusa o redirecionamento de volta para o app mesmo com os
provedores configurados corretamente.

## 4. Testando

Depois de habilitar pelo menos um provedor, abra `/login` ou `/signup` em produção —
os botões "Continuar com Google" / "Continuar com Apple" devem redirecionar para a
tela de login do provedor e, ao autorizar, voltar para `/dashboard` já autenticado.

Se um provedor não estiver habilitado no Supabase, o clique no botão correspondente
retorna um erro visível na tela (em vez de travar silenciosamente).

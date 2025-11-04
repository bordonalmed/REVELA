# Guia Rápido de Setup - Revela

## ⚠️ Requisitos Importantes

**Node.js**: Você precisa de Node.js versão 20.9.0 ou superior para executar este projeto.

### Verificar versão do Node.js
```bash
node --version
```

Se você tiver uma versão inferior, atualize para Node.js 20+:
- Download: https://nodejs.org/
- Ou use nvm: `nvm install 20 && nvm use 20`

## 🚀 Passo a Passo

### 1. Configurar Ambiente Local

```bash
# Copiar arquivo de exemplo de variáveis de ambiente
cp .env.example .env.local
```

Edite `.env.local` e adicione suas credenciais:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 2. Configurar Supabase

1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá para **SQL Editor**
4. Copie o conteúdo do arquivo `supabase-setup.sql`
5. Cole e execute o script

### 3. Ativar Autenticação por Email

1. No Supabase, vá para **Authentication** > **Settings**
2. Em **Email Auth**, ative "Enable Email Auth"
3. Configure as opções de email conforme necessário

### 4. Rodar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### 5. Deploy no Netlify

#### Opção A: Deploy via GitHub (Recomendado)

1. Crie um repositório no GitHub
2. Faça push do código
3. Acesse [https://netlify.com](https://netlify.com)
4. Clique em "Add new site" > "Import an existing project"
5. Selecione seu repositório
6. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Clique em "Deploy site"

#### Opção B: Deploy via Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Fazer login
netlify login

# Deploy
netlify deploy --prod
```

## 🧪 Testar a Aplicação

1. Acesse a página inicial em `/`
2. Clique em "Criar Conta"
3. Registre um email e senha
4. Faça login
5. Acesse o Dashboard
6. Visite a Galeria (vazia no início)

## 📝 Próximos Passos

- [ ] Adicionar funcionalidade de upload de fotos
- [ ] Implementar editor de casos
- [ ] Adicionar compartilhamento
- [ ] Criar filtros e busca
- [ ] Implementar exportação de relatórios

## ❓ Problemas Comuns

### Erro: "You are using Node.js 18.x"
**Solução**: Atualize para Node.js 20.9.0 ou superior

### Erro de conexão com Supabase
**Solução**: Verifique se as variáveis de ambiente estão corretas no `.env.local`

### Build falha no Netlify
**Solução**: Certifique-se de que as variáveis de ambiente estão configuradas no Netlify

### Tabela não encontrada
**Solução**: Execute o script `supabase-setup.sql` no SQL Editor do Supabase

## 📚 Recursos

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Netlify](https://docs.netlify.com)
- [Documentação shadcn/ui](https://ui.shadcn.com)

## 🤝 Suporte

Para questões e suporte, verifique a documentação completa em `README.md`.


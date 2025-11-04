# Revela - Visualização de Fotos Antes e Depois

Plataforma profissional para visualização e gerenciamento de fotos de antes e depois, desenvolvida para profissionais da área estética, dermatologistas, cirurgiões vasculares e cirurgiões plásticos.

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca JavaScript
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utility-first
- **shadcn/ui** - Componentes UI reutilizáveis
- **Supabase** - Banco de dados e autenticação
- **Netlify** - Hospedagem e deploy

## 📋 Pré-requisitos

- Node.js 20.9.0 ou superior
- Conta no Supabase
- Conta no Netlify (para deploy)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd revela-novo
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Edite `.env.local` e adicione suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

## 🗄️ Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. No SQL Editor, execute o seguinte comando para criar a tabela de fotos:

```sql
-- Cria tabela para armazenar fotos antes e depois
CREATE TABLE before_after_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita Row Level Security (RLS)
ALTER TABLE before_after_photos ENABLE ROW LEVEL SECURITY;

-- Cria política para usuários verem apenas suas próprias fotos
CREATE POLICY "Users can view own photos" ON before_after_photos
  FOR SELECT USING (auth.uid() = user_id);

-- Cria política para usuários inserirem suas próprias fotos
CREATE POLICY "Users can insert own photos" ON before_after_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cria política para usuários atualizarem suas próprias fotos
CREATE POLICY "Users can update own photos" ON before_after_photos
  FOR UPDATE USING (auth.uid() = user_id);

-- Cria política para usuários deletarem suas próprias fotos
CREATE POLICY "Users can delete own photos" ON before_after_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Cria trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_before_after_photos_updated_at 
  BEFORE UPDATE ON before_after_photos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

3. Configure as políticas de autenticação:
   - Vá para Authentication > Settings
   - Ative "Enable Email Auth"

## 🚀 Desenvolvimento

Execute o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📦 Deploy no Netlify

1. Faça push do código para o GitHub
2. Acesse [Netlify](https://netlify.com) e faça login
3. Clique em "Add new site" > "Import an existing project"
4. Selecione seu repositório GitHub
5. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Clique em "Deploy site"

O Netlify detectará automaticamente a configuração Next.js e fará o deploy.

## 📁 Estrutura do Projeto

```
revela-novo/
├── app/                    # App Router do Next.js
│   ├── dashboard/         # Dashboard do usuário
│   ├── login/             # Página de login
│   ├── signup/            # Página de cadastro
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes React
│   └── ui/               # Componentes shadcn/ui
├── lib/                  # Utilitários e configurações
│   ├── supabase.ts      # Cliente Supabase
│   └── utils.ts         # Funções utilitárias
├── public/               # Arquivos estáticos
├── next.config.ts        # Configuração do Next.js
├── tailwind.config.ts    # Configuração do Tailwind
├── tsconfig.json         # Configuração do TypeScript
├── netlify.toml          # Configuração do Netlify
└── package.json          # Dependências
```

## 🔐 Autenticação

O sistema usa Supabase Auth para autenticação por email e senha. As rotas protegidas verificam automaticamente se o usuário está autenticado.

## 📸 Funcionalidades Futuras

- [ ] Upload de fotos antes e depois
- [ ] Visualização em slider/comparador
- [ ] Galeria de casos
- [ ] Compartilhamento de casos
- [ ] Filtros e busca
- [ ] Exportação de relatórios
- [ ] Notas e anotações por caso

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou envie um pull request.

## 📧 Contato

Para dúvidas ou suporte, entre em contato através do email do projeto.

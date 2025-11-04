# Documentação Técnica - Revela

## Arquitetura

### Frontend
- **Framework**: Next.js 14.1.0 com App Router
- **Estilização**: Tailwind CSS + Shadcn/ui
- **Estado**: Context API / Zustand (quando necessário)
- **Validação**: Zod + React Hook Form

### Backend
- **API Routes**: Next.js Route Handlers
- **Validação**: Middleware com Zod
- **Autenticação**: Supabase Auth (email/password)
- **Rate Limiting**: [Implementar]
- **Dados**: Supabase (PostgreSQL)

### Segurança
- CSP Headers configurados
- CORS com whitelist
- Input sanitization
- SQL injection prevention (Supabase usa prepared statements)
- XSS protection

## Padrões de Código

### Estrutura de Pastas
```
src/ (ou app/ no caso do Next.js App Router)
├── app/              # Rotas e páginas
├── components/       # Componentes reutilizáveis
│   ├── ui/          # Shadcn components
│   └── features/    # Componentes de features
├── lib/             # Utilidades e configurações
│   ├── security/    # Funções de segurança
│   ├── mock-data/   # Dados mockados
│   └── validations/ # Schemas Zod
├── hooks/           # Custom hooks
└── types/           # TypeScript types
```

### Convenções
- Componentes: PascalCase
- Funções utilitárias: camelCase
- Constantes: UPPER_SNAKE_CASE
- Arquivos: kebab-case

## APIs e Endpoints

### Padrões de API
- Versionamento: /api/v1/ (quando necessário)
- Autenticação: Bearer token (Supabase JWT)
- Rate limiting: 100 req/min (implementar)
- CORS: Configurado por endpoint

### Endpoints Públicos
- Endpoints de autenticação são gerenciados pelo Supabase
- APIs públicas futuras precisarão de configuração CORS apropriada

## Supabase Strategy
O projeto utiliza Supabase para:
- **Autenticação**: Email/password com JWT
- **Banco de Dados**: PostgreSQL com RLS (Row Level Security)
- **Storage**: Armazenamento de imagens (futuro)
- **RLS**: Políticas de segurança para garantir que usuários só acessem seus próprios dados

## Segurança

### Headers HTTP
Os headers de segurança são configurados via middleware do Next.js.

### Validações
Toda entrada de dados deve ser validada com Zod antes do processamento.

### Supabase RLS
Todas as tabelas devem ter Row Level Security habilitado para garantir isolamento de dados entre usuários.

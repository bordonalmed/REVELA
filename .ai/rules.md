# Regras para Assistentes de IA

## Contexto do Projeto
Revela - Plataforma web profissional para visualização de fotos de antes e depois para profissionais de estética, dermatologia, cirurgia vascular e plástica.

## Regras Obrigatórias

### 1. Segurança (OWASP Top 10)
- SEMPRE validar inputs com Zod
- NUNCA expor dados sensíveis em logs
- SEMPRE usar prepared statements (Supabase já faz isso)
- IMPLEMENTAR rate limiting em todas APIs
- VALIDAR permissões antes de ações
- SANITIZAR outputs para prevenir XSS
- GARANTIR que RLS está habilitado em todas as tabelas do Supabase

### 2. Padrões de Código
- USE TypeScript strict mode
- SIGA convenções de nomenclatura do projeto
- IMPLEMENTE error boundaries
- USE async/await ao invés de callbacks
- MANTENHA componentes pequenos e focados
- USE componentes do Shadcn/ui quando disponíveis

### 3. Performance
- IMPLEMENTE lazy loading para imagens
- USE React.memo() quando apropriado
- OTIMIZE bundle size
- IMPLEMENTE caching estratégico
- USE next/image para otimização de imagens

### 4. Documentação
- COMENTE lógica complexa
- ATUALIZE docs ao modificar APIs
- MANTENHA README atualizado
- DOCUMENTE decisões arquiteturais

### 5. Git e Versionamento
- Commits atômicos e descritivos
- Branch naming: feature/*, bugfix/*, hotfix/*
- Sempre criar PR antes de merge
- Executar testes antes de push

## APIs e Endpoints

### Endpoints Públicos
Configurar CORS apropriadamente para endpoints que precisam ser públicos:
```typescript
// Exemplo para API pública
export async function POST(req: Request) {
  // Configurar CORS para endpoint público
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // Validar input
  const validation = schema.safeParse(await req.json());
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400, headers }
    );
  }
  
  // Processar...
}
```

## Supabase
- SEMPRE verificar autenticação do usuário antes de operações
- USAR RLS (Row Level Security) para isolar dados entre usuários
- VALIDAR permissões no cliente E no servidor
- NUNCA confiar apenas na validação do cliente

## Checklist Antes de Commit

- [ ] Código passa no TypeScript sem erros
- [ ] Testes executados com sucesso
- [ ] Sem dados sensíveis expostos
- [ ] Documentação atualizada
- [ ] Segurança verificada (OWASP)
- [ ] Performance otimizada
- [ ] RLS verificado no Supabase (quando aplicável)

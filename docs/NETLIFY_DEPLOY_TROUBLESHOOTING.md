# Troubleshooting - Deploy no Netlify

## Problema: Deploy Falhou

Se o deploy no Netlify está falhando após adicionar o sistema de tracking de conversão, siga estes passos:

### 1. Verificar Logs de Build

No Netlify, clique em "Why did it fail?" para ver os logs detalhados do erro.

### 2. Variáveis de Ambiente (Opcional)

As variáveis de ambiente para pixels de conversão são **opcionais**. Se não estiverem configuradas, o sistema simplesmente não inicializará os pixels, mas **não deve causar falha de build**.

Para configurar no Netlify:
1. Vá em **Site settings** > **Environment variables**
2. Adicione as variáveis (sem `NEXT_PUBLIC_` prefix):
   - `META_PIXEL_ID`
   - `TWITTER_PIXEL_ID`
   - `GOOGLE_ADS_CONVERSION_ID`
   - `GOOGLE_ADS_LOGIN_LABEL`
   - `GOOGLE_ADS_SIGNUP_LABEL`
   - `GOOGLE_ADS_CREATE_PROJECT_LABEL`
   - `GOOGLE_ADS_EXPORT_LABEL`
   - `TIKTOK_PIXEL_ID`

### 3. Verificar Erros Comuns

#### Erro: "Cannot find module"
- Verifique se todos os arquivos foram commitados
- Verifique se os imports estão corretos

#### Erro: "Type error"
- Execute `npm run build` localmente para verificar erros de TypeScript
- Verifique se todas as dependências estão instaladas

#### Erro: "Build timeout"
- Aumente o timeout no `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"
  timeout = 300  # 5 minutos
```

### 4. Testar Build Localmente

Antes de fazer deploy, teste localmente:

```bash
# Instalar dependências
npm install

# Fazer build
npm run build

# Testar produção localmente
npm start
```

### 5. Verificar Content Security Policy

O `netlify.toml` foi atualizado para permitir os domínios dos pixels:
- `connect.facebook.net` (Meta)
- `analytics.twitter.com` e `static.ads-twitter.com` (Twitter)
- `analytics.tiktok.com` (TikTok)
- `*.google-analytics.com` (Google - já estava)

Se ainda houver problemas, verifique os logs do navegador em runtime.

### 6. Desabilitar Temporariamente

Se precisar fazer deploy urgentemente sem os pixels:

1. Comente a linha no `app/layout.tsx`:
```tsx
// <ConversionPixels />
```

2. Faça commit e push

3. Depois, descomente e configure as variáveis de ambiente

### 7. Verificar Versão do Node

O `netlify.toml` especifica Node 20. Verifique se está compatível:
```toml
[build.environment]
  NODE_VERSION = "20"
```

### 8. Limpar Cache do Netlify

1. Vá em **Site settings** > **Build & deploy** > **Clear cache and retry deploy**
2. Tente fazer deploy novamente

## Se o Problema Persistir

1. Copie os logs completos do erro do Netlify
2. Verifique se o build funciona localmente
3. Compare com a versão anterior que funcionava
4. Verifique se há mudanças não commitadas

## Contato

Se nenhuma das soluções acima funcionar, verifique:
- Logs completos do Netlify
- Se o build funciona localmente
- Se há diferenças entre ambiente local e Netlify


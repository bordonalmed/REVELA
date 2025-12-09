# 🔧 Configuração do Netlify - Revela

## 📋 Arquivos de Configuração

### 1. `netlify.toml`
Arquivo principal de configuração do Netlify que define:
- Build command e diretório de publicação
- Headers de segurança (CSP, CORS, etc.)
- Configurações específicas para Service Worker

### 2. `next.config.js`
Configuração do Next.js que define:
- Headers HTTP para rotas específicas
- Configurações de imagens
- Headers do Service Worker

### 3. `middleware.ts`
Middleware do Next.js que aplica:
- Headers de segurança em tempo de execução
- Content Security Policy (CSP)
- Políticas de segurança

---

## 🔒 Headers de Segurança Configurados

### Headers Globais (aplicados a todas as rotas):
- `X-Frame-Options: DENY` - Previne clickjacking
- `X-Content-Type-Options: nosniff` - Previne MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Proteção XSS
- `Referrer-Policy: strict-origin-when-cross-origin` - Controle de referrer
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` - Restringe permissões
- `Strict-Transport-Security: max-age=31536000` - Força HTTPS
- `Content-Security-Policy` - Política de segurança de conteúdo

### Headers Específicos para Service Worker (`/sw.js`):
- `Content-Type: application/javascript; charset=utf-8`
- `Cache-Control: public, max-age=0, must-revalidate`
- `Service-Worker-Allowed: /`
- CSP específico para service worker

---

## 🛡️ Content Security Policy (CSP)

### Diretivas Configuradas:

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:
style-src 'self' 'unsafe-inline' https:
img-src 'self' data: blob: https:
font-src 'self' data: https:
connect-src 'self' 
  https://*.supabase.co 
  https://*.supabase.in 
  https://*.supabase.io 
  wss://*.supabase.co 
  wss://*.supabase.in 
  https://*.netlify.app 
  https://www.googletagmanager.com 
  https://*.google-analytics.com
frame-src 'self' https:
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
worker-src 'self' blob:
child-src 'self' blob:
```

### Domínios Permitidos:
- ✅ Supabase (todas as variantes: .co, .in, .io)
- ✅ Netlify
- ✅ Google Tag Manager
- ✅ Google Analytics
- ✅ Qualquer domínio HTTPS (para imagens, scripts, etc.)

---

## 🚀 Como Aplicar as Configurações

### 1. Fazer Deploy no Netlify

As configurações serão aplicadas automaticamente no próximo deploy:

```bash
git add netlify.toml next.config.js middleware.ts
git commit -m "fix: corrigir configurações CSP e headers do Netlify"
git push
```

### 2. Verificar Headers no Netlify

Após o deploy, verifique os headers:

1. Acesse o site no Netlify
2. Abra DevTools (F12)
3. Vá em **Network** → Recarregue a página
4. Clique em qualquer requisição → Aba **Headers**
5. Verifique se os headers estão sendo aplicados

### 3. Verificar Service Worker

1. Abra DevTools (F12)
2. Vá em **Application** → **Service Workers**
3. Verifique se o service worker está registrado
4. Verifique se não há erros no console

---

## 🔍 Troubleshooting

### Erro: CSP bloqueando recursos

**Sintoma**: Erros no console sobre CSP violando diretivas

**Solução**: 
1. Verifique se o domínio está na lista de `connect-src` no `netlify.toml`
2. Adicione o domínio necessário
3. Faça novo deploy

### Erro: Service Worker não registra

**Sintoma**: Service worker não aparece em Application → Service Workers

**Solução**:
1. Verifique se `/sw.js` está sendo servido corretamente
2. Verifique os headers em Network → `/sw.js` → Headers
3. Verifique se `Service-Worker-Allowed: /` está presente
4. Limpe o cache e tente novamente

### Erro: Headers duplicados

**Sintoma**: Headers aparecem duplicados no DevTools

**Solução**:
- Isso é normal - o Netlify e o Next.js podem aplicar headers
- O Netlify tem prioridade sobre o Next.js
- Se houver conflito, o `netlify.toml` prevalece

---

## 📝 Notas Importantes

1. **CSP no Netlify vs Next.js**:
   - O CSP no `netlify.toml` é aplicado no nível do servidor
   - O CSP no `middleware.ts` é aplicado pelo Next.js
   - Ambos devem estar sincronizados

2. **Service Worker**:
   - Deve ser servido com `Content-Type: application/javascript`
   - Deve ter `Service-Worker-Allowed: /` para funcionar em todo o site
   - Cache deve ser `max-age=0` para sempre buscar versão atualizada

3. **Google Tag Manager**:
   - Foi adicionado ao CSP para evitar erros
   - Se não usar GTM, pode remover do CSP

---

## ✅ Checklist de Verificação

Após o deploy, verifique:

- [ ] Headers de segurança aparecem no DevTools
- [ ] CSP permite conexões com Supabase
- [ ] CSP permite Google Tag Manager (se usado)
- [ ] Service Worker registra sem erros
- [ ] Não há erros de CSP no console
- [ ] Site funciona normalmente
- [ ] Imagens carregam corretamente
- [ ] Autenticação Supabase funciona

---

## 🔗 Referências

- [Netlify Headers Documentation](https://docs.netlify.com/routing/headers/)
- [Next.js Headers Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)


# Sistema de Tracking de Conversão

## Visão Geral

Este sistema integra tracking de conversão para múltiplas plataformas de anúncios:
- **Meta Ads** (Facebook/Instagram)
- **X/Twitter Ads**
- **Google Ads**
- **TikTok Ads**

Todas as variáveis de ambiente são **privadas** (não expostas no cliente), mantendo a segurança dos IDs e tokens.

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Meta Pixel (Facebook/Instagram)
META_PIXEL_ID=123456789012345

# X/Twitter Pixel
TWITTER_PIXEL_ID=abc123

# Google Ads Conversion Tracking
GOOGLE_ADS_CONVERSION_ID=AW-123456789
GOOGLE_ADS_LOGIN_LABEL=AbCdEfGhIj
GOOGLE_ADS_SIGNUP_LABEL=KlMnOpQrSt
GOOGLE_ADS_CREATE_PROJECT_LABEL=UvWxYzAbCd
GOOGLE_ADS_EXPORT_LABEL=EfGhIjKlMn

# TikTok Pixel
TIKTOK_PIXEL_ID=C1234567890ABCDEFGHIJ
```

**Importante**: 
- Todas as variáveis são **privadas** (sem `NEXT_PUBLIC_` prefix)
- Os IDs são obtidos nas respectivas plataformas de anúncios
- Os labels do Google Ads são gerados quando você cria eventos de conversão

### 2. Como Obter os IDs

#### Meta Pixel (Facebook/Instagram)
1. Acesse o [Facebook Events Manager](https://business.facebook.com/events_manager)
2. Selecione seu Pixel ou crie um novo
3. Copie o **Pixel ID** (número de 15-16 dígitos)

#### X/Twitter Pixel
1. Acesse o [Twitter Ads Manager](https://ads.twitter.com/)
2. Vá em **Tools** > **Conversion tracking**
3. Crie um novo pixel ou use um existente
4. Copie o **Pixel ID**

#### Google Ads Conversion Tracking
1. Acesse o [Google Ads](https://ads.google.com/)
2. Vá em **Tools & Settings** > **Conversions**
3. Crie eventos de conversão para:
   - Login
   - Signup
   - Create Project
   - Export Image
4. Para cada evento, copie:
   - **Conversion ID** (formato: `AW-123456789`)
   - **Conversion Label** (código alfanumérico)

#### TikTok Pixel
1. Acesse o [TikTok Ads Manager](https://ads.tiktok.com/)
2. Vá em **Assets** > **Events**
3. Crie um novo Pixel ou use um existente
4. Copie o **Pixel ID** (formato: `C1234567890ABCDEFGHIJ`)

## Eventos Rastreados

O sistema rastreia automaticamente os seguintes eventos de conversão:

### Autenticação
- **Login** → `complete_registration`
- **Signup** → `complete_registration`

### Projetos
- **Create Project** → `lead`
- **Export Image** → `purchase`
- **Share Social** → `share_social`

### Outros
- **View Project** → `view_content`

## Como Funciona

1. **Inicialização**: O componente `ConversionPixels` carrega a configuração da API route `/api/conversion-tracking`
2. **API Route**: Mantém os IDs privados e retorna apenas o necessário para inicialização
3. **Tracking**: Quando eventos importantes ocorrem, são enviados para todas as plataformas configuradas
4. **Privacidade**: IDs e tokens nunca são expostos no código do cliente

## Estrutura de Arquivos

```
lib/
  conversion-tracking.ts    # Funções de tracking para todas as plataformas
  analytics.ts              # Integração com eventos do Revela

app/api/
  conversion-tracking/
    route.ts                # API route para configuração privada

components/
  conversion-pixels.tsx     # Componente de inicialização dos pixels
```

## Segurança

- ✅ Variáveis de ambiente privadas (sem `NEXT_PUBLIC_`)
- ✅ IDs carregados via API route (server-side)
- ✅ Cache controlado para evitar exposição
- ✅ Validação de dados antes de enviar eventos

## Testando

1. Configure todas as variáveis de ambiente
2. Reinicie o servidor: `npm run dev`
3. Abra o DevTools > Network
4. Realize ações no site (login, criar projeto, etc.)
5. Verifique as requisições para:
   - `connect.facebook.net` (Meta)
   - `analytics.twitter.com` (Twitter)
   - `www.google-analytics.com` (Google)
   - `analytics.tiktok.com` (TikTok)

## Verificação nas Plataformas

### Meta Events Manager
- Acesse **Events Manager** > **Test Events**
- Você verá eventos em tempo real

### Twitter Ads Manager
- Acesse **Tools** > **Conversion tracking**
- Verifique eventos de conversão

### Google Ads
- Acesse **Tools & Settings** > **Conversions**
- Verifique conversões registradas

### TikTok Ads Manager
- Acesse **Assets** > **Events**
- Verifique eventos do pixel

## Troubleshooting

### Pixels não estão carregando
- Verifique se as variáveis de ambiente estão configuradas
- Verifique o console do navegador para erros
- Confirme que a API route `/api/conversion-tracking` está retornando dados

### Eventos não aparecem nas plataformas
- Aguarde alguns minutos (pode haver delay)
- Verifique se os pixels estão instalados corretamente
- Confirme que os IDs estão corretos
- Use as ferramentas de teste de cada plataforma

### Erro de CORS
- Normalmente não ocorre, pois os pixels são carregados via scripts oficiais
- Se ocorrer, verifique bloqueadores de anúncios

## Desabilitar Tracking

Para desabilitar o tracking de uma plataforma específica, basta não definir a variável de ambiente correspondente. O sistema detectará automaticamente e não inicializará o pixel.


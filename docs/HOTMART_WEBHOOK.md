# Integração Hotmart → planos Pro / Premium

## O que faz

Quando uma compra é **aprovada** na Hotmart, o postback chama `POST /api/webhooks/hotmart`, grava/atualiza a linha do comprador na tabela **`revela_entitlements`** (Supabase) e o app passa a tratar o usuário como **Pro** ou **Premium** (mesmo e-mail da conta Revela).

## Passos no Supabase

1. Abra o **SQL Editor** e execute o arquivo `supabase-hotmart-entitlements.sql` (cria tabela + RLS só leitura para o usuário logado).

2. Confirme que `SUPABASE_SERVICE_ROLE_KEY` está em `.env.local` (produção: variáveis no Netlify/Vercel). **Nunca** exponha essa chave no cliente.

## Passos na Hotmart

1. **Webhook / Postback**  
   - URL: `https://SEU_DOMINIO/api/webhooks/hotmart`  
   - Método: **POST**  
   - Eventos: pelo menos **compra aprovada** (e, se quiser revogar acesso, **reembolso / cancelamento** — o endpoint tenta reconhecer nomes comuns desses eventos).

2. **Token de segurança**  
   - Defina um segredo forte em `HOTMART_WEBHOOK_TOKEN`.  
   - Na Hotmart, configure o mesmo valor como **hottok** no corpo da requisição **ou** na query `?hottok=...` **ou** header `Authorization: Bearer ...`.

3. **IDs dos produtos**  
   - No painel do produto Hotmart, anote o **ID do produto** (número).  
   - Em `.env`:  
     - `HOTMART_PRO_PRODUCT_IDS=id1,id2`  
     - `HOTMART_PREMIUM_PRODUCT_IDS=id3`  

## Regra importante

O e-mail do comprador na Hotmart deve ser o **mesmo** do cadastro no Revela (Supabase Auth). Se forem diferentes, a linha é criada no banco, mas o login não “casa” com o entitlement até o usuário usar o mesmo e-mail.

## Teste local

Use [ngrok](https://ngrok.com/) ou similar para expor `localhost` e registrar a URL na Hotmart, ou use o **histórico de webhooks** da Hotmart para reenviar um POST de teste.

Em desenvolvimento (`next dev`), se `HOTMART_WEBHOOK_TOKEN` **não** estiver definido, o endpoint aceita chamadas sem token (apenas para facilitar testes — **defina o token em produção**).

## Payload (sim, vale a pena conferir com o histórico real)

A Hotmart **não mantém um único JSON fixo para sempre**: o formato pode variar por tipo de produto, país ou atualização da plataforma. Por isso o código em `lib/hotmart-webhook.ts` tenta **vários caminhos** comuns, por exemplo:

- **E-mail:** `data.buyer.email`, `data.customer.email`, `data.purchase.buyer.email`, etc.
- **Produto:** `data.product.id`, `data.purchase.product_id`, `data.purchase.offer.*`, primeiro item de `data.items`, etc.
- **Evento:** `event` no root, ou `data.event` / `data.event_name`.

### Como validar com um payload real (recomendado)

1. Na Hotmart, abra **Histórico de webhooks** / notificação enviada para a sua URL.
2. Copie o **corpo JSON completo** de uma compra **aprovada** (e, se possível, um de **reembolso**).
3. No servidor (logs de deploy ou terminal com `HOTMART_WEBHOOK_DEBUG=1`), confira se o endpoint registra `event`, e-mail e `product_id` corretamente.
4. Se **faltar e-mail ou product id** na resposta (422 / 400), abra `lib/hotmart-webhook.ts` e acrescente o caminho que aparece no JSON (ou envie o JSON de exemplo — sem dados sensíveis — para alguém ajustar os extratores).

### Debug temporário

No ambiente de deploy (ou `.env.local`), defina:

`HOTMART_WEBHOOK_DEBUG=1`

Isso faz o servidor registrar no log os **primeiros 4000 caracteres** do body recebido (útil para ajustar o parser). **Desligue** depois de resolver (`0` ou remova a variável), para não guardar lixo de log em produção.

## Após o pagamento

O usuário pode precisar **atualizar a página** uma vez para o app buscar de novo `revela_entitlements` (o hook `usePlan` carrega na montagem).

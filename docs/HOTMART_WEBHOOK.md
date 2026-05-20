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

## Validação (garantir que está funcionando)

Siga nesta ordem. Só passe para o próximo passo quando o anterior estiver **ok**.

1. **URL pública do webhook**  
   No navegador, abra: `https://SEU_DOMINIO/api/webhooks/hotmart`  
   Deve aparecer JSON parecido com: `{"ok":true,"service":"revela-hotmart-webhook"}`.  
   Se der 404, o deploy ou a rota estão errados.

2. **Variáveis no Netlify (ou outro host)**  
   Confirme que existem e batem com o **mesmo projeto Supabase** da tabela `revela_entitlements`:  
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `HOTMART_WEBHOOK_TOKEN`, `HOTMART_PRO_PRODUCT_IDS`, `HOTMART_PREMIUM_PRODUCT_IDS`.  
   Depois de alterar, faça **Trigger deploy** (ou novo commit) para aplicar.

3. **Hotmart = mesma URL e token**  
   Webhook apontando para `https://SEU_DOMINIO/api/webhooks/hotmart` (POST).  
   O **hottok** (ou Bearer) na Hotmart deve ser **idêntico** a `HOTMART_WEBHOOK_TOKEN` no Netlify.

4. **Teste com histórico da Hotmart**  
   Hotmart → área de **Webhook / histórico de notificações** → escolha uma compra **aprovada** → **reenviar** para sua URL.  
   - **200** com `{"ok":true,"action":"granted",...}` → gravou no Supabase.  
   - **401** → token errado.  
   - **422** + `Unknown product id` → inclua no Netlify o `product_id` (ou `offer.id`) que aparece no JSON da notificação.  
   - **400** `No buyer email` → anote o JSON e ajuste extratores em `lib/hotmart-webhook.ts` (ou peça ajuda com o trecho sem dados sensíveis).

5. **Conferir no Supabase**  
   Table Editor → `revela_entitlements` → deve aparecer uma linha com o **e-mail do comprador** (minúsculo), `plan` = `pro` ou `premium`, `active` = true.

6. **Debug temporário**  
   `HOTMART_WEBHOOK_DEBUG=1` no Netlify, redeploy, reenviar webhook, ver **logs da função** no Netlify. **Remova** depois.

Quando os passos 4 e 5 funcionarem uma vez, **compras futuras** passam a atualizar o plano **sozinhas**, desde que o e-mail da compra seja o mesmo do cadastro no Revela.

## Compradores antigos (já pagaram antes do webhook funcionar)

A automação **não corrige o passado** sozinha: quem comprou quando o webhook falhava não tem linha na tabela.

**Opção A — Reenviar pela Hotmart (melhor)**  
Para cada venda aprovada relevante, use **reenviar notificação** no histórico de webhooks. Se o endpoint já estiver correto, a linha é criada/atualizada como nas vendas novas.

**Opção B — Inserir manualmente no Supabase**  
No **SQL Editor**, uma linha por e-mail (use o mesmo e-mail do **login** no Revela):

```sql
-- Pro (troque o e-mail)
INSERT INTO public.revela_entitlements (email, plan, active, updated_at)
VALUES ('cliente@exemplo.com', 'pro', true, timezone('utc'::text, now()))
ON CONFLICT (email) DO UPDATE SET
  plan = EXCLUDED.plan,
  active = EXCLUDED.active,
  updated_at = EXCLUDED.updated_at;

-- Premium (troque o e-mail)
INSERT INTO public.revela_entitlements (email, plan, active, updated_at)
VALUES ('cliente@exemplo.com', 'premium', true, timezone('utc'::text, now()))
ON CONFLICT (email) DO UPDATE SET
  plan = EXCLUDED.plan,
  active = EXCLUDED.active,
  updated_at = EXCLUDED.updated_at;
```

**Opção C — Lista em planilha**  
Exporte da Hotmart (e-mail + produto Pro ou Premium) e gere vários `INSERT` ou peça um script único; o importante é `email` = e-mail da conta no Supabase Auth.

## Automação para futuros compradores (resumo)

| O quê | Onde |
|--------|------|
| Hotmart avisa compra aprovada | Webhook → `POST /api/webhooks/hotmart` |
| Servidor grava plano | Supabase `revela_entitlements` (service role) |
| App mostra Pro/Premium | Lê a tabela com o usuário logado (RLS) |

Requisitos permanentes: URL correta, token igual, IDs de produto corretos no Netlify, `SUPABASE_SERVICE_ROLE_KEY` válida, e **mesmo e-mail** na Hotmart e no cadastro Revela.

## Regra importante

O e-mail do comprador na Hotmart deve ser o **mesmo** do cadastro no Revela (Supabase Auth). Se forem diferentes, a linha é criada no banco, mas o login não “casa” com o entitlement até o usuário usar o mesmo e-mail.

## Por que o usuário paga e continua “Free”? (checklist)

1. **E-mail diferente**  
   Compra com `maria@gmail.com`, cadastro no Revela com `maria@hotmail.com` → o app só lê entitlement pela conta logada. Solução: mesmo e-mail nas duas pontas, ou ajustar manualmente a linha em `revela_entitlements` no Supabase.

2. **ID do produto na Hotmart ≠ variáveis `HOTMART_*_PRODUCT_IDS`**  
   No Netlify, os IDs precisam ser os **mesmos números** que vêm no webhook (às vezes é ID da **oferta** / `offer`, não do produto). Abra **Histórico de webhooks** na Hotmart, veja o JSON e confira `product.id`, `purchase.product_id` ou `offer.id` / `offer.key`. Inclua **todos** os IDs que aparecem na venda real nas variáveis (vários separados por vírgula).

3. **Webhook retornando erro**  
   - **401**: `HOTMART_WEBHOOK_TOKEN` no Netlify diferente do **hottok** configurado na Hotmart.  
   - **422** `Unknown product id`: IDs não mapeados (item 2).  
   - **400** `No buyer email`: o parser não achou e-mail no JSON (ajuste em `lib/hotmart-webhook.ts` com base no payload real).  
   - **200** `ignored: true`: o nome do **evento** não foi reconhecido como “liberar acesso”; veja o campo `event` no JSON e compare com `GRANT_EVENT_SUBSTRINGS` em `lib/hotmart-webhook.ts`.

4. **`SUPABASE_SERVICE_ROLE_KEY` errada ou ausente no deploy**  
   Sem service role, o upsert na tabela falha (**500** no webhook).

5. **Tabela / RLS**  
   Confirme que rodou o SQL `supabase-hotmart-entitlements.sql` e que existe política de **SELECT** para o usuário logado na própria linha (`email` = e-mail do JWT).

6. **Atualizar o app**  
   Após o webhook gravar, o usuário pode trocar de aba e voltar: o app recarrega o plano automaticamente; se não, um **F5** força nova leitura.

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

O app recarrega o plano ao **voltar para a aba** ou dar foco na janela; se não atualizar, um **F5** força nova leitura de `revela_entitlements`.

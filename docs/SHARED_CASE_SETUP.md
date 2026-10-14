# Link compartilhável de caso (antes/depois)

## O que faz

Permite ao profissional gerar um link público (ex.: `revela.fun/c/aB3xK9mPqR7s`) de
**um único caso antes/depois**, pra mandar pro paciente no WhatsApp ou divulgar o
resultado. Só as duas imagens (antes/depois) ficam públicas — nenhum outro dado do
paciente, nome do projeto, nem acesso ao resto da conta. O link pode ser desativado
a qualquer momento pelo profissional.

Disponível pra todos os planos (é um mecanismo de divulgação/crescimento). No plano
Free e Pro, a imagem leva a marca d'água da Revela (com um link "Crie o seu grátis");
no Premium, leva a marca/logo da própria clínica, se configurado.

## Passos no Supabase

### 1. Tabela `revela_shared_cases`

SQL Editor do Supabase → cole e rode:

```sql
CREATE TABLE IF NOT EXISTS revela_shared_cases (
  id text PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id text NOT NULL,
  before_image_url text NOT NULL,
  after_image_url text NOT NULL,
  watermark_enabled boolean NOT NULL DEFAULT true,
  watermark_logo_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_revela_shared_cases_owner ON revela_shared_cases (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_revela_shared_cases_project ON revela_shared_cases (project_id);

ALTER TABLE revela_shared_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active shared cases" ON revela_shared_cases;
CREATE POLICY "Anyone can read active shared cases"
  ON revela_shared_cases FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Owners can read own shared cases" ON revela_shared_cases;
CREATE POLICY "Owners can read own shared cases"
  ON revela_shared_cases FOR SELECT
  USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owners can insert own shared cases" ON revela_shared_cases;
CREATE POLICY "Owners can insert own shared cases"
  ON revela_shared_cases FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owners can update own shared cases" ON revela_shared_cases;
CREATE POLICY "Owners can update own shared cases"
  ON revela_shared_cases FOR UPDATE
  USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owners can delete own shared cases" ON revela_shared_cases;
CREATE POLICY "Owners can delete own shared cases"
  ON revela_shared_cases FOR DELETE
  USING (auth.uid() = owner_user_id);

COMMENT ON TABLE revela_shared_cases IS 'Casos antes/depois publicados via link público, opt-in por projeto.';
```

### 2. Bucket público `public-shares`

Diferente dos outros buckets do Revela (que são privados), este é **público** —
é o requisito pra gerar um link que qualquer pessoa consiga abrir sem login.

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public-shares', 'public-shares', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Owners can upload own public shares"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-shares' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can update own public shares"
ON storage.objects FOR UPDATE
USING (bucket_id = 'public-shares' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete own public shares"
ON storage.objects FOR DELETE
USING (bucket_id = 'public-shares' AND auth.uid()::text = (storage.foldername(name))[1]);
```

(Não precisa de política de SELECT: bucket público serve os arquivos direto por URL,
sem passar pelas políticas de RLS do Storage.)

## Estrutura de arquivos no bucket

```
public-shares/
  {user_id}/
    {share_id}/
      before.jpg
      after.jpg
```

## Privacidade / LGPD

- É sempre uma ação explícita do profissional (botão "Gerar link compartilhável"
  dentro do projeto) — nada é publicado automaticamente.
- Só as 2 imagens escolhidas ficam públicas. Nome do paciente, notas, data e o
  resto do projeto continuam privados.
- O link pode ser desativado a qualquer momento ("Desativar compartilhamento"),
  o que o torna inacessível imediatamente (a política de leitura exige `active = true`).
- O ID do link é aleatório (12 caracteres, não sequencial) — não dá pra adivinhar
  ou listar os casos de outros profissionais a partir dele.

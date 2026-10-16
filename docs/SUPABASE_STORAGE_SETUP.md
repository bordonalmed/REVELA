# Supabase Storage — Bucket para backup de projetos

## O que faz

O backup na nuvem (Premium) usa **Supabase Storage** para armazenar imagens separadamente do banco de dados.

**Criptografia (formato `revela_storage_v3_enc`):** cada imagem é criptografada no aparelho (AES-GCM, chave derivada da senha da nuvem do usuário via PBKDF2) e enviada como `*.enc.jpg` para o bucket `project-backups` (declarada como `image/jpeg` só para passar pela restrição de tipos do bucket — o conteúdo é ilegível). No banco ficam apenas o ID do projeto, o salt e os dados cifrados; nome, notas e medidas também vão criptografados. A senha nunca é salva nem enviada. Projetos enviados no formato antigo (`revela_storage_v2`, sem criptografia) ainda podem ser restaurados e podem ser apagados em Configurações.

## Passos no Supabase

### 1. Criar o bucket

Acesse **Storage** no painel do Supabase e clique em **New bucket**:

- **Name:** `project-backups`
- **Public:** Não (privado)
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/webp`

### 2. Criar políticas de acesso (RLS)

No painel do Storage, clique no bucket `project-backups` → **Policies** e crie estas políticas:

**SELECT (download):**
```sql
CREATE POLICY "Users can download own backups"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**INSERT (upload):**
```sql
CREATE POLICY "Users can upload own backups"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**UPDATE (upsert):**
```sql
CREATE POLICY "Users can update own backups"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**DELETE (limpeza):**
```sql
CREATE POLICY "Users can delete own backups"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Alternativa via SQL Editor

Se preferir criar tudo via SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-backups',
  'project-backups',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can download own backups"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own backups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own backups"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own backups"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-backups' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Estrutura de arquivos no bucket

```
project-backups/
  {user_id}/
    {project_id}/
      before_0.jpg
      before_1.jpg
      after_0.jpg
      after_1.jpg
      evo_{evolution_id}.jpg
```

## Compatibilidade

O restore continua suportando backups antigos (v1, dados no campo `description`). Novos syncs usam Storage (v2).

---

# Bucket para backup seguro criptografado (`secure-backups`)

## O que faz

A feature "Backup seguro" (`app/settings/page.tsx`) criptografa os projetos no navegador
(AES-GCM + PBKDF2, ver `lib/secure-backup.ts`) e envia apenas o ciphertext para este bucket.
A senha **nunca** sai do cliente — o backend só guarda bytes criptografados, um arquivo
`backup.json` por usuário, sobrescrito a cada novo backup.

## Passos no Supabase

### 1. Criar o bucket

**Storage** → **New bucket**:

- **Name:** `secure-backups`
- **Public:** Não (privado)
- **File size limit:** 20 MB
- **Allowed MIME types:** `application/json`

### 2. Criar políticas de acesso (RLS)

No bucket `secure-backups` → **Policies**:

```sql
CREATE POLICY "Users can upload own secure backup"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'secure-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own secure backup"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'secure-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can download own secure backup"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'secure-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own secure backup"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'secure-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Alternativa via SQL Editor (cria bucket + políticas de uma vez)

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('secure-backups', 'secure-backups', false, 20971520, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own secure backup"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'secure-backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own secure backup"
ON storage.objects FOR UPDATE
USING (bucket_id = 'secure-backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can download own secure backup"
ON storage.objects FOR SELECT
USING (bucket_id = 'secure-backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own secure backup"
ON storage.objects FOR DELETE
USING (bucket_id = 'secure-backups' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Estrutura de arquivos no bucket

```
secure-backups/
  {user_id}/
    backup.json   ← ciphertext + salt + iv (payload de lib/secure-backup.ts)
```

## Importante

Sem esse bucket/políticas criados no seu projeto Supabase, o botão "Criar backup seguro agora"
vai falhar com erro de upload (RLS/bucket inexistente) em vez de falhar silenciosamente como
antes — é intencional: melhor um erro visível do que perder o backup do usuário sem avisar.

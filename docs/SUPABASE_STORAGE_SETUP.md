# Supabase Storage — Bucket para backup de projetos

## O que faz

O backup na nuvem (Premium) agora usa **Supabase Storage** para armazenar imagens separadamente do banco de dados. Cada imagem é enviada como arquivo JPEG para o bucket `project-backups`, e apenas os metadados (nome, data, contagem de imagens) ficam no banco.

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

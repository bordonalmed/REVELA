-- Revela - Supabase Database Setup
-- Execute este script no SQL Editor do Supabase

-- Cria tabela para armazenar fotos antes e depois
CREATE TABLE IF NOT EXISTS before_after_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cria índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_before_after_photos_user_id ON before_after_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_before_after_photos_created_at ON before_after_photos(created_at DESC);

-- Habilita Row Level Security (RLS)
ALTER TABLE before_after_photos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own photos" ON before_after_photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON before_after_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON before_after_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON before_after_photos;

-- Cria política para usuários verem apenas suas próprias fotos
CREATE POLICY "Users can view own photos" ON before_after_photos
  FOR SELECT USING (auth.uid() = user_id);

-- Cria política para usuários inserirem suas próprias fotos
CREATE POLICY "Users can insert own photos" ON before_after_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cria política para usuários atualizarem suas próprias fotos
CREATE POLICY "Users can update own photos" ON before_after_photos
  FOR UPDATE USING (auth.uid() = user_id);

-- Cria política para usuários deletarem suas próprias fotos
CREATE POLICY "Users can delete own photos" ON before_after_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Remove função antiga se existir
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Cria função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS update_before_after_photos_updated_at ON before_after_photos;

-- Cria trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_before_after_photos_updated_at 
  BEFORE UPDATE ON before_after_photos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Confirma que tudo foi criado corretamente
SELECT 'Database setup completed successfully!' as status;


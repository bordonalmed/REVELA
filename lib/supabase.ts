import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validação das variáveis de ambiente
if (!supabaseUrl) {
  throw new Error(
    'Missing env.NEXT_PUBLIC_SUPABASE_URL. ' +
    'Por favor, crie um arquivo .env.local com suas credenciais do Supabase. ' +
    'Veja .env.example para referência.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Por favor, crie um arquivo .env.local com suas credenciais do Supabase. ' +
    'Veja .env.example para referência.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      before_after_photos: {
        Row: {
          id: string;
          user_id: string;
          before_image_url: string;
          after_image_url: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          before_image_url: string;
          after_image_url: string;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          before_image_url?: string;
          after_image_url?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

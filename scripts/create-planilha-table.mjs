import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aopbzryufcpsawaweico.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcGJ6cnl1ZmNwc2F3YXdlaWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTE4NjUxNCwiZXhwIjoyMDQ0NzYyNTE0fQ.KoacMPJPj3xqauphjtDfVRklynQoQ-lE805lsM9LpGs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTable() {
  console.log('Criando tabela planilha_dados...')

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Criar tabela para armazenar dados das planilhas
      CREATE TABLE IF NOT EXISTS planilha_dados (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        number TEXT NOT NULL,
        name TEXT NOT NULL,
        another_var TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_planilha_dados_upload_id ON planilha_dados(upload_id);
      CREATE INDEX IF NOT EXISTS idx_planilha_dados_user_id ON planilha_dados(user_id);
      CREATE INDEX IF NOT EXISTS idx_planilha_dados_number ON planilha_dados(number);

      -- Habilitar RLS
      ALTER TABLE planilha_dados ENABLE ROW LEVEL SECURITY;

      -- Remover policies antigas se existirem
      DROP POLICY IF EXISTS "Gestor can view own planilha_dados" ON planilha_dados;
      DROP POLICY IF EXISTS "Gestor can insert own planilha_dados" ON planilha_dados;
      DROP POLICY IF EXISTS "Admin can view all planilha_dados" ON planilha_dados;

      -- Policy para Gestor ver apenas seus próprios dados
      CREATE POLICY "Gestor can view own planilha_dados"
        ON planilha_dados
        FOR SELECT
        USING (auth.uid() = user_id);

      -- Policy para Gestor inserir seus próprios dados
      CREATE POLICY "Gestor can insert own planilha_dados"
        ON planilha_dados
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      -- Policy para Admin ver todos os dados
      CREATE POLICY "Admin can view all planilha_dados"
        ON planilha_dados
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
          )
        );
    `
  })

  if (error) {
    console.error('❌ Erro ao criar tabela:', error)
    process.exit(1)
  }

  console.log('✅ Tabela planilha_dados criada com sucesso!')
}

createTable()

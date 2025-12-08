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
CREATE INDEX idx_planilha_dados_upload_id ON planilha_dados(upload_id);
CREATE INDEX idx_planilha_dados_user_id ON planilha_dados(user_id);
CREATE INDEX idx_planilha_dados_number ON planilha_dados(number);

-- Habilitar RLS
ALTER TABLE planilha_dados ENABLE ROW LEVEL SECURITY;

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

-- ========================================
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- ========================================
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole este SQL completo e clique em "RUN"
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "uploads_select" ON uploads;
DROP POLICY IF EXISTS "uploads_insert" ON uploads;
DROP POLICY IF EXISTS "recordings_select" ON recordings;
DROP POLICY IF EXISTS "recordings_insert" ON recordings;

-- Allow users to see their own uploads
CREATE POLICY "uploads_select" ON uploads
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own uploads
CREATE POLICY "uploads_insert" ON uploads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to see recordings linked to their uploads
CREATE POLICY "recordings_select" ON recordings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM uploads 
    WHERE uploads.id = recordings.upload_id 
    AND uploads.user_id = auth.uid()
  )
);

-- Allow anyone authenticated to insert recordings (admin)
CREATE POLICY "recordings_insert" ON recordings
FOR INSERT
WITH CHECK (true);

-- ========================================
-- APÓS EXECUTAR:
-- Recarregue http://localhost:3010/gestor/recordings
-- A planilha "Vitória" e o áudio devem aparecer!
-- ========================================

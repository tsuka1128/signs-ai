-- supabase/migrations/080_add_custom_survey_questions.sql

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='survey_questions' AND column_name='company_id') THEN
    ALTER TABLE survey_questions ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='survey_questions' AND column_name='is_active') THEN
    ALTER TABLE survey_questions ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- 既存の標準11問は company_id = NULL のまま

-- RLS 更新
DROP POLICY IF EXISTS "survey_questions_public_read" ON survey_questions;
DROP POLICY IF EXISTS "survey_questions_select" ON survey_questions;
DROP POLICY IF EXISTS "survey_questions_admin_insert" ON survey_questions;
DROP POLICY IF EXISTS "survey_questions_admin_update" ON survey_questions;
DROP POLICY IF EXISTS "survey_questions_admin_delete" ON survey_questions;

CREATE POLICY "survey_questions_select" ON survey_questions
  FOR SELECT USING (
    company_id IS NULL
    OR company_id = get_my_company_id()
  );

CREATE POLICY "survey_questions_admin_insert" ON survey_questions
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin','super_admin')
  );

CREATE POLICY "survey_questions_admin_update" ON survey_questions
  FOR UPDATE USING (company_id = get_my_company_id())
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "survey_questions_admin_delete" ON survey_questions
  FOR DELETE USING (company_id = get_my_company_id());
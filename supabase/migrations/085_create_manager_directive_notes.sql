CREATE TABLE IF NOT EXISTS manager_directive_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  manager_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,                            -- YYYY-MM
  focus_id UUID REFERENCES executive_monthly_focus(id) ON DELETE SET NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(manager_user_id, month)
);

-- updated_at 自動更新トリガ
CREATE OR REPLACE FUNCTION update_manager_directive_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_manager_directive_notes_updated_at ON manager_directive_notes;
CREATE TRIGGER trg_manager_directive_notes_updated_at
BEFORE UPDATE ON manager_directive_notes
FOR EACH ROW EXECUTE FUNCTION update_manager_directive_notes_updated_at();

-- RLS（本人のみアクセス可能、メンバーにも他マネージャーにも見せない）
ALTER TABLE manager_directive_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manager can read own notes" ON manager_directive_notes;
CREATE POLICY "Manager can read own notes"
  ON manager_directive_notes FOR SELECT
  USING (manager_user_id = auth.uid() AND company_id = get_my_company_id());

DROP POLICY IF EXISTS "Manager can insert own notes" ON manager_directive_notes;
CREATE POLICY "Manager can insert own notes"
  ON manager_directive_notes FOR INSERT
  WITH CHECK (manager_user_id = auth.uid() AND company_id = get_my_company_id());

DROP POLICY IF EXISTS "Manager can update own notes" ON manager_directive_notes;
CREATE POLICY "Manager can update own notes"
  ON manager_directive_notes FOR UPDATE
  USING (manager_user_id = auth.uid() AND company_id = get_my_company_id())
  WITH CHECK (manager_user_id = auth.uid() AND company_id = get_my_company_id());

DROP POLICY IF EXISTS "Manager can delete own notes" ON manager_directive_notes;
CREATE POLICY "Manager can delete own notes"
  ON manager_directive_notes FOR DELETE
  USING (manager_user_id = auth.uid() AND company_id = get_my_company_id());

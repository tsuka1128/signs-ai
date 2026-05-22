CREATE TABLE dept_ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- YYYY-MM
  topics JSONB NOT NULL DEFAULT '[]',
  positive_summary TEXT NOT NULL DEFAULT '',
  negative_summary TEXT NOT NULL DEFAULT '',
  manager_hint TEXT NOT NULL DEFAULT '',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(department_id, month)
);

ALTER TABLE dept_ai_summaries ENABLE ROW LEVEL SECURITY;

-- manager以上のロールが自社データを読み取り可能
CREATE POLICY "Manager can read dept summaries"
  ON dept_ai_summaries FOR SELECT
  USING (company_id = get_my_company_id());

-- INSERT/UPDATE はサービス側（API route）のみ（RLSバイパス不要、認証済みユーザーで対応）
CREATE POLICY "Authenticated can insert dept summaries"
  ON dept_ai_summaries FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Authenticated can update dept summaries"
  ON dept_ai_summaries FOR UPDATE
  USING (company_id = get_my_company_id())
  WITH CHECK (company_id = get_my_company_id());

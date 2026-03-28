-- AI分析結果を格納するテーブル
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL,         -- 'summary', 'deep_report', 'dept_translation'
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  target_month TEXT NOT NULL,         -- 'YYYY-MM'
  content JSONB NOT NULL,             -- AI生成結果（構造化JSON）
  model_used TEXT,                    -- 使用されたモデル名
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AIによって生成または手動作成されたアクション項目を格納するテーブル
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal',     -- 'urgent', 'high', 'normal'
  status TEXT DEFAULT 'pending',      -- 'pending', 'accepted', 'completed', 'rejected', 'kept'
  owner TEXT,                         -- 担当者名（表示用）
  is_ai_generated BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ai_insights_company_month ON ai_insights(company_id, target_month);
CREATE INDEX IF NOT EXISTS idx_action_items_company ON action_items(company_id);

-- RLS設定 (管理者のみ閲覧・操作可能)
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view its own company insights" ON ai_insights
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can view its own company action items" ON action_items
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage its own company action items" ON action_items
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

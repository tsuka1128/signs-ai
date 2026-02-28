-- =====================================================
-- Signs AI — 初期マイグレーション（MVP）
-- Supabase SQL Editor で実行してください
-- =====================================================

-- 拡張機能：UUID生成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. プラン定義 (plans)
-- =====================================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,              -- 'Free', 'Team', 'Standard', 'Pro'
  max_departments INT NOT NULL DEFAULT 5,
  max_kpis INT NOT NULL DEFAULT 10,
  max_headcount INT NOT NULL DEFAULT 30,
  ai_analysis_frequency INT NOT NULL DEFAULT 1, -- 月あたりの実行回数
  ai_insight_depth TEXT NOT NULL DEFAULT 'basic', -- 'basic', 'advanced', 'executive'
  retention_period_months INT NOT NULL DEFAULT 3,
  max_managed_companies INT DEFAULT NULL, -- Partner 向け
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初期プランデータ
INSERT INTO plans (name, max_departments, max_kpis, max_headcount, ai_analysis_frequency, ai_insight_depth, retention_period_months) VALUES
  ('Free',     3,  5,  20,  1, 'basic',     3),
  ('Team',     5,  10, 50,  1, 'basic',     6),
  ('Standard', 10, 20, 150, 2, 'advanced',  12),
  ('Pro',      99, 50, 999, 4, 'executive', 36);

-- =====================================================
-- 2. 企業・テナント (companies)
-- =====================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'suspended'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. 部署 (departments)
-- =====================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES departments(id), -- 階層構造用
  headcount INT NOT NULL DEFAULT 0,          -- 現在の在籍人数
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. ユーザー (users)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- 'executive', 'admin', 'manager', 'player', 'partner'
  display_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. KPI定義 (kpi_definitions)
-- =====================================================
CREATE TABLE kpi_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  owner_dept_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  target_default NUMERIC,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 6. KPI実績値 (kpi_records)
-- =====================================================
CREATE TABLE kpi_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  recorded_month TEXT NOT NULL, -- 'YYYY-MM' 形式
  value NUMERIC NOT NULL,
  target_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(kpi_definition_id, recorded_month)
);

-- =====================================================
-- 7. リソース・人件費データ (resource_records)
-- =====================================================
CREATE TABLE resource_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  recorded_month TEXT NOT NULL, -- 'YYYY-MM' 形式
  head_count INT NOT NULL DEFAULT 0,
  labor_cost NUMERIC,            -- 人件費総額/月
  budget NUMERIC,                -- 予算/月
  productivity_score NUMERIC,    -- 算出済みスコア
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(department_id, recorded_month)
);

-- =====================================================
-- 8. アンケート設問マスター (survey_questions)
-- =====================================================
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sort_order INT NOT NULL,
  text TEXT NOT NULL,
  hint TEXT,
  category TEXT
);

-- 固定11問を投入
INSERT INTO survey_questions (sort_order, text, hint, category) VALUES
  (1,  '今の仕事にワクワクしていますか？', '月曜の朝、布団の中で思い浮かべてみてください。', 'engagement'),
  (2,  '何かが決まるのを「待つ時間」は少なかったですか？', '待っている間、あなたの熱量は少しずつ冷めていきます。', 'speed'),
  (3,  '必要な情報が自分まで届いていましたか？', '知らなかったことで、損をしていませんでしたか。', 'transparency'),
  (4,  '「調整」や「根回し」に時間を取られすぎていませんか？', '本来、何に使いたかった時間ですか。', 'friction'),
  (5,  '言いづらいことを飲み込まずに伝えられましたか？', '飲み込んだ言葉は、どこかで体温を下げます。', 'safety'),
  (6,  '「何を成すべきか」に迷わず集中できましたか？', '迷いは、あなたのせいではないかもしれません。', 'clarity'),
  (7,  '上司や仲間から反応（賞賛や指摘）がありましたか？', '無反応は、じわじわと人を蝕みます。', 'feedback'),
  (8,  '業務量は、質を維持できる範囲でしたか？', '「頑張ればできる」は、長くは続きません。', 'workload'),
  (9,  '「顧客のプラスになること」に時間を使えましたか？', '社内都合に時間を奪われた日、悔しくなかったですか。', 'impact'),
  (10, '新しい工夫や挑戦ができましたか？', '同じことの繰り返しは、安全に見えて危険です。', 'challenge'),
  (11, 'KPI達成に向けて、準備周到に活動できていますか？', '道筋が見えているだけで、体温は上がります。', 'readiness');

-- =====================================================
-- 9. アンケート回答 (survey_responses)
-- ※ PII排除：user_id は保持しない
-- =====================================================
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  recorded_month TEXT NOT NULL, -- 'YYYY-MM' 形式
  bottleneck_tags TEXT,         -- カンマ区切り
  cross_dept_feedback TEXT,
  free_comment TEXT,
  related_kpi TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 10. アンケート回答スコア (survey_answers)
-- =====================================================
CREATE TABLE survey_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5)
);

-- =====================================================
-- 11. セマンティックレイヤー (semantic_layers)
-- =====================================================
CREATE TABLE semantic_layers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,          -- NULL = 現在有効なバージョン
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 12. AI診断結果 (ai_insights)
-- =====================================================
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL DEFAULT 'company', -- 'company', 'department'
  audience_role TEXT NOT NULL, -- 'executive', 'admin', 'manager', 'player'
  recorded_month TEXT NOT NULL, -- 'YYYY-MM' 形式
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_weather TEXT,         -- '☀️', '☁️', '☔️'
  trend_arrow TEXT,             -- '↑', '↓', '→'
  content TEXT NOT NULL,        -- AI生成の140文字診断
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 13. アクション管理 (action_items)
-- =====================================================
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'urgent', 'medium', 'ongoing'
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- RLS (Row Level Security) ポリシー
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の会社のデータのみ参照・操作可能
CREATE POLICY "users_own_company" ON companies
  FOR ALL USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "users_own_company_departments" ON departments
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "users_can_read_own_profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_can_update_own_profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_own_company_kpi_definitions" ON kpi_definitions
  FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_own_company_kpi_records" ON kpi_records
  FOR ALL USING (
    kpi_definition_id IN (
      SELECT id FROM kpi_definitions WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "users_own_company_resource_records" ON resource_records
  FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- アンケートは認証不要で投稿可能（匿名）
CREATE POLICY "anyone_can_submit_survey" ON survey_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_can_read_own_survey_responses" ON survey_responses
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "anyone_can_submit_survey_answers" ON survey_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_can_read_own_survey_answers" ON survey_answers
  FOR SELECT USING (
    response_id IN (
      SELECT id FROM survey_responses WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "users_own_company_semantic_layers" ON semantic_layers
  FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_own_company_ai_insights" ON ai_insights
  FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_own_company_action_items" ON action_items
  FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- plans と survey_questions は全員が読める（マスターデータ）
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON plans FOR SELECT USING (true);

ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_questions_public_read" ON survey_questions FOR SELECT USING (true);

-- =====================================================
-- トリガー：updated_at 自動更新
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER action_items_updated_at BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

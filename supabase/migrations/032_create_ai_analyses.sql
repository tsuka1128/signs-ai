-- 032_create_ai_analyses.sql
-- AI分析結果の履歴保存テーブル
-- 各AIスロットの生成結果を月次でストックし、前月比較を可能にする

-- ============================================================
-- 1. ai_analyses テーブルの作成
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- どの企業のデータか
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- どの部署向けか（全社分析の場合はNULL）
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  -- どのAIスロットの出力か
  -- 'dashboard_summary' | 'deep_report' | 'pulse_analysis' | 'policy_translation'
  -- 'policy_extraction' | 'matrix_analysis' | 'action_proposal' | 'kpi_insight'
  slot_id TEXT NOT NULL,

  -- どの月の分析か（YYYY-MM形式）
  recorded_month TEXT NOT NULL,

  -- AI生成された本文（Markdown形式）
  content TEXT NOT NULL,

  -- 生成時に使用したプロンプト（デバッグ・改善用）
  prompt_used TEXT,

  -- 生成時のコンテキストスナップショット（JSONB）
  -- 例: { "kpi_achievement": 82, "pulse_avg": 3.5, "model": "claude-3-7-sonnet" }
  -- 将来の定量比較やプロンプト改善に活用する
  metadata JSONB DEFAULT '{}'::jsonb,

  -- 生成日時
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 同じ企業×同じスロット×同じ月で、部署が同じなら1レコードに上書き
  UNIQUE(company_id, department_id, slot_id, recorded_month)
);

-- NULLの department_id を含むユニーク制約のために部分インデックスを追加
-- （PostgreSQLではNULLはUNIQUE制約で区別されないため）
CREATE UNIQUE INDEX IF NOT EXISTS ai_analyses_company_slot_month_null_dept
  ON ai_analyses (company_id, slot_id, recorded_month)
  WHERE department_id IS NULL;

-- 検索パフォーマンス用のインデックス
CREATE INDEX IF NOT EXISTS idx_ai_analyses_company_month
  ON ai_analyses (company_id, recorded_month);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_slot
  ON ai_analyses (slot_id);


-- ============================================================
-- 2. RLSポリシー
-- ============================================================
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- 企業ユーザーは自社の分析結果のみ閲覧可能
CREATE POLICY "users_own_company_ai_analyses" ON ai_analyses
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- super_admin は全操作可能
CREATE POLICY "super_admin_full_access_ai_analyses" ON ai_analyses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- サービス側（APIルート）からの挿入を許可
-- ※ service_role キーで実行されるため、RLSをバイパスする
-- Next.js の API Routes では supabaseAdmin (service_role) を使用する想定


-- ============================================================
-- 3. コメント
-- ============================================================
COMMENT ON TABLE ai_analyses IS 'AIスロットごとの分析結果を月次で蓄積するテーブル。時系列比較の基盤。';
COMMENT ON COLUMN ai_analyses.slot_id IS 'AIスロット識別子（dashboard_summary, deep_report, pulse_analysis, policy_translation, policy_extraction, matrix_analysis, action_proposal, kpi_insight）';
COMMENT ON COLUMN ai_analyses.content IS 'AI生成された分析本文（Markdown形式）。次月の分析時に前月分として参照される。';
COMMENT ON COLUMN ai_analyses.metadata IS '生成時のコンテキストスナップショット。KPI達成率や体温平均等の数値を保存し、定量的な月次比較に活用。';
COMMENT ON COLUMN ai_analyses.prompt_used IS '生成に使用した完全なプロンプトテキスト。プロンプト改善の振り返りに活用。';

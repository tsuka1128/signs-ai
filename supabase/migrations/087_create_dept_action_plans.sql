CREATE TABLE dept_action_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id    UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  manager_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  month            TEXT NOT NULL,  -- YYYY-MM
  title            TEXT NOT NULL,
  description      TEXT,
  source           TEXT NOT NULL DEFAULT 'manual',
  -- 'manual'       : マネージャーが手動作成
  -- 'ai_proposed'  : AIが自動生成した提案
  status           TEXT NOT NULL DEFAULT 'accepted',
  -- 'proposed'     : AI提案・未確認（手動作成はこのステータスを経ない）
  -- 'accepted'     : 採用済み（アクションプラン欄に表示）
  -- 'in_progress'  : 実行中
  -- 'done'         : 完了
  -- 'dismissed'    : 却下（非表示）
  is_shared_with_players BOOLEAN DEFAULT false,  -- Phase 6以降で使用
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE dept_action_plans ENABLE ROW LEVEL SECURITY;

-- 自社メンバーは読み取り可
CREATE POLICY "company members can read action plans"
  ON dept_action_plans FOR SELECT
  USING (company_id = get_my_company_id());

-- 挿入: 自社メンバー（AIルートはservice roleで挿入）
CREATE POLICY "company members can insert action plans"
  ON dept_action_plans FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

-- 更新: 自分が所有するもの or 未採用のAI提案（API側でロール制限）
CREATE POLICY "managers can update own action plans"
  ON dept_action_plans FOR UPDATE
  USING (
    company_id = get_my_company_id()
    AND (manager_user_id = auth.uid() OR manager_user_id IS NULL)
  );

-- 削除: 自分が所有するもの
CREATE POLICY "managers can delete own action plans"
  ON dept_action_plans FOR DELETE
  USING (
    company_id = get_my_company_id()
    AND manager_user_id = auth.uid()
  );

-- インデックス
CREATE INDEX idx_dept_action_plans_dept_month
  ON dept_action_plans(department_id, month);

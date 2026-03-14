-- プラン変更履歴テーブルの作成
CREATE TABLE IF NOT EXISTS company_plan_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    old_plan_id UUID REFERENCES plans(id),
    new_plan_id UUID NOT NULL REFERENCES plans(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- RLSの設定
ALTER TABLE company_plan_history ENABLE ROW LEVEL SECURITY;

-- super_admin はすべての履歴を閲覧・作成可能
CREATE POLICY "Super admins can do everything on plan history"
ON company_plan_history
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

-- 一般ユーザー（自社の管理者等）は自社の履歴のみ閲覧可能
CREATE POLICY "Users can view their own company plan history"
ON company_plan_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.company_id = company_plan_history.company_id
    )
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_plan_history_company_id ON company_plan_history(company_id);
CREATE INDEX IF NOT EXISTS idx_plan_history_changed_at ON company_plan_history(changed_at);

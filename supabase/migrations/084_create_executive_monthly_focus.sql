-- 経営者が「今月見ている課題」を登録するテーブル
CREATE TABLE IF NOT EXISTS executive_monthly_focus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    month TEXT NOT NULL,  -- YYYY-MM
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(company_id, month)
);

CREATE INDEX IF NOT EXISTS idx_executive_monthly_focus_company_month
    ON executive_monthly_focus(company_id, month DESC);

COMMENT ON TABLE executive_monthly_focus IS '経営層が登録する「今月の課題」。プレイヤー向け画面で公開表示される。';
COMMENT ON COLUMN executive_monthly_focus.month IS 'YYYY-MM 形式';

-- RLS
ALTER TABLE executive_monthly_focus ENABLE ROW LEVEL SECURITY;

-- SELECT: 同じ会社のメンバーは誰でも閲覧可能（プレイヤー向け公開のため）
DROP POLICY IF EXISTS "executive_monthly_focus_select" ON executive_monthly_focus;
CREATE POLICY "executive_monthly_focus_select" ON executive_monthly_focus
    FOR SELECT USING (company_id = get_my_company_id());

-- INSERT/UPDATE/DELETE: admin/executive/super_admin のみ
DROP POLICY IF EXISTS "executive_monthly_focus_insert" ON executive_monthly_focus;
CREATE POLICY "executive_monthly_focus_insert" ON executive_monthly_focus
    FOR INSERT WITH CHECK (
        company_id = get_my_company_id()
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'executive', 'super_admin')
    );

DROP POLICY IF EXISTS "executive_monthly_focus_update" ON executive_monthly_focus;
CREATE POLICY "executive_monthly_focus_update" ON executive_monthly_focus
    FOR UPDATE
    USING (
        company_id = get_my_company_id()
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'executive', 'super_admin')
    )
    WITH CHECK (
        company_id = get_my_company_id()
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'executive', 'super_admin')
    );

DROP POLICY IF EXISTS "executive_monthly_focus_delete" ON executive_monthly_focus;
CREATE POLICY "executive_monthly_focus_delete" ON executive_monthly_focus
    FOR DELETE USING (
        company_id = get_my_company_id()
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'executive', 'super_admin')
    );

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_executive_monthly_focus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_executive_monthly_focus_updated_at ON executive_monthly_focus;
CREATE TRIGGER trg_executive_monthly_focus_updated_at
    BEFORE UPDATE ON executive_monthly_focus
    FOR EACH ROW
    EXECUTE FUNCTION update_executive_monthly_focus_updated_at();

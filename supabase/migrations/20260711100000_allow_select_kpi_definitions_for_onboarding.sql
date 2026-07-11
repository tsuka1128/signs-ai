-- kpi_definitions の SELECT RLS ポリシーを緩和し、オンボーディング画面（未所属または未ログイン）でも
-- 会社に定義された KPI 定義一覧をフェッチできるようにする。
CREATE POLICY anon_read_specific_kpi_definitions ON kpi_definitions
    FOR SELECT
    USING (company_id IS NOT NULL);

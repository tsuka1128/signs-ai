-- 059_add_plans_update_policy.sql
-- plans テーブルに対する Super Admin の更新権限を追加

-- 1. 更新ポリシーの追加
-- Super Admin のみが更新可能
CREATE POLICY "plans_super_admin_update" ON plans
    FOR UPDATE
    TO authenticated
    USING ( (SELECT is_super_admin()) )
    WITH CHECK ( (SELECT is_super_admin()) );

-- 念のため、admin_activity_logs に対する権限も確認/追加（前回のマイグレーションで漏れていた場合用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_activity_logs' AND policyname = 'admin_activity_logs_super_admin'
    ) THEN
        CREATE POLICY "admin_activity_logs_super_admin" ON admin_activity_logs
            FOR ALL
            TO authenticated
            USING ( (SELECT is_super_admin()) )
            WITH CHECK ( (SELECT is_super_admin()) );
    END IF;
END $$;

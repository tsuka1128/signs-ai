-- 027_add_extended_alerts.sql
-- 新規登録通知および経営方針変更通知の設定を追加

INSERT INTO public.system_settings (category, key, value, description)
VALUES 
    ('alert', 'notify_new_registration', 'true'::jsonb, '新規企業登録時の通知有効化'),
    ('alert', 'notify_policy_change', 'true'::jsonb, 'クライアント企業の経営方針変更時の通知有効化')
ON CONFLICT (key) DO NOTHING;

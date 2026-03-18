-- 028_add_extended_system_settings.sql
-- 管理者設定の拡充: プラン料金、非アクティブ検知、max_tokens等の追加

-- システム制御: プラン別料金テーブル
INSERT INTO public.system_settings (category, key, value, description)
VALUES 
    ('system', 'plan_price_free', '0'::jsonb, 'Freeプランの月額料金（円）'),
    ('system', 'plan_price_team', '50000'::jsonb, 'Teamプランの月額料金（円）'),
    ('system', 'plan_price_standard', '150000'::jsonb, 'Standardプランの月額料金（円）'),
    ('system', 'plan_price_pro', '500000'::jsonb, 'Proプランの月額料金（円）'),
    ('system', 'invitation_expiry_days', '30'::jsonb, '招待リンクのデフォルト有効期間（日）')
ON CONFLICT (key) DO NOTHING;

-- AIコントロール: max_tokens と自動実行設定
INSERT INTO public.system_settings (category, key, value, description)
VALUES 
    ('ai', 'max_tokens', '1024'::jsonb, 'AI応答の最大トークン数'),
    ('ai', 'auto_analysis_enabled', 'false'::jsonb, 'AI分析の自動実行を有効にする'),
    ('ai', 'auto_analysis_frequency', '"monthly"'::jsonb, 'AI自動分析の実行頻度（daily/weekly/monthly）')
ON CONFLICT (key) DO NOTHING;

-- アラート: 非アクティブ検知閾値
INSERT INTO public.system_settings (category, key, value, description)
VALUES 
    ('alert', 'inactivity_warning_days', '30'::jsonb, '非アクティブ警告（中）の日数閾値'),
    ('alert', 'inactivity_critical_days', '60'::jsonb, '非アクティブ警告（高）の日数閾値'),
    ('alert', 'notify_onboarding_incomplete', 'true'::jsonb, 'オンボーディング未完了の通知有効化')
ON CONFLICT (key) DO NOTHING;

-- ボイスチェック制御
INSERT INTO public.system_settings (category, key, value, description)
VALUES 
    ('survey', 'min_free_text_length', '100'::jsonb, '自由記述の最低文字数')
ON CONFLICT (key) DO NOTHING;

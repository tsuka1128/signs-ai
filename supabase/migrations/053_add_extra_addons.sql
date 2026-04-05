-- 053_add_extra_addons.sql
-- 追加のアドオン機能のカラムを companies テーブルに追加します。

ALTER TABLE companies ADD COLUMN IF NOT EXISTS addon_ai_weekly BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS addon_security_sso BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN companies.addon_ai_weekly IS 'AI 週次分析レポートの有効化フラグ';
COMMENT ON COLUMN companies.addon_security_sso IS 'SSO / セキュリティ強化の有効化フラグ';

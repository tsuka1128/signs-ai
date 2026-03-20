-- 039_public_pricing_settings.sql
-- LP（非ログインユーザー）から料金設定を取得できるようにするため、
-- system_settings テーブルの特定のキーに対する SELECT を許可するポリシーを追加します。

CREATE POLICY "Public can read pricing settings"
ON public.system_settings
FOR SELECT
TO public
USING ( key IN ('plan_price_free', 'plan_price_team', 'plan_price_standard', 'plan_price_pro') );

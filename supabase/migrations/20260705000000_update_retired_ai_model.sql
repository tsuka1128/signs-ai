-- T-API-2: system_settings.default_model が廃止済みモデル(404)を指しているのを現行モデルへ更新する。
--
-- 026_create_system_settings.sql で default_model の初期値が "claude-3-7-sonnet-20250219" に設定されているが、
-- このモデルは 2026-02-19 に廃止済みで API 呼び出しが 404 not_found_error を返す。
-- 各AIルートは `sysSettings.default_model ?? "claude-sonnet-4-5"` で解決するため、DB値がセット済みだと
-- ?? フォールバックが効かず、設定を変更していないテナントでは AI 分析が本番で必ず失敗する。
--
-- 廃止済み / 旧世代の値のみを現行世代 claude-sonnet-5 へ更新する（管理者が明示的に設定した
-- 現行モデルは上書きしない）。より高精度が必要な場合は管理画面から claude-opus-4-8 を選択可能。
UPDATE public.system_settings
SET value = '"claude-sonnet-5"'::jsonb
WHERE category = 'ai'
  AND key = 'default_model'
  AND (value #>> '{}') IN (
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-sonnet-4-5'
  );

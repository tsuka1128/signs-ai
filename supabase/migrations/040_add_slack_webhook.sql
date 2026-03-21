-- 040_add_slack_webhook.sql
-- クライアント企業が自分たちのSlackワークスペースにAI分析結果などを通知できるようにするため、
-- companies テーブルに slack_webhook_url カラムを追加します。

ALTER TABLE public.companies
ADD COLUMN slack_webhook_url TEXT;

COMMENT ON COLUMN public.companies.slack_webhook_url IS '通知を送信するためのクライアント企業のSlack Webhook URL';

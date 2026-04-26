-- 072_add_unique_constraint_to_ai_insights.sql
-- 同一月・同一企業・同一タイプの分析結果が重複して作成されないよう、ユニーク制約を追加します。
-- これにより、同月内の再実行時に既存レコードを安全に上書き（UPSERT）できるようになります。

ALTER TABLE public.ai_insights
ADD CONSTRAINT ai_insights_unique_target
UNIQUE (company_id, target_month, insight_type);

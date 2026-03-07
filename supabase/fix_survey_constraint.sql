-- =====================================================
-- survey_responses テーブルの制約修正
-- 第2軸(axis_id)のみに紐づく回答を許容するため、department_id の NOT NULL 制約を解除します。
-- =====================================================

ALTER TABLE survey_responses ALTER COLUMN department_id DROP NOT NULL;

RAISE NOTICE '✅ SUCCESS: survey_responses.department_id の NOT NULL 制約を解除しました。';

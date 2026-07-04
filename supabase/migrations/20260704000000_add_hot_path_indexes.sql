-- ダッシュボード読み込みのホットパスに対するインデックス追加（パフォーマンス改善 P1）
--
-- 背景：ダッシュボード集計は毎回 survey_responses（会社スコープ）→ survey_answers（response_id JOIN）
-- を大量に引くが、これらの列にインデックスが無く全表スキャンになっていた。
--
-- 対象は「実際に欠けている」2本のみ。以下は既存で追加不要のため含めない：
--   - executive_monthly_focus(company_id, month)      … 084 で作成済み
--   - dept_action_plans(department_id, month)          … 087 で作成済み
--   - kpi_records(kpi_definition_id, recorded_month …) … 045 の UNIQUE 制約が暗黙インデックスを提供（先頭列でカバー）

-- ① survey_answers.response_id：ダッシュボード集計の JOIN / .in('response_id', ...) が全表スキャンになっていた（インデックス皆無）
CREATE INDEX IF NOT EXISTS idx_survey_answers_response_id
    ON survey_answers(response_id);

-- ② survey_responses(company_id, recorded_month)：会社スコープ＋月フィルタが主用途だが、
--    既存インデックスは (user_id, recorded_month) のみで会社スコープ検索に効かなかった
CREATE INDEX IF NOT EXISTS idx_survey_responses_company_month
    ON survey_responses(company_id, recorded_month);

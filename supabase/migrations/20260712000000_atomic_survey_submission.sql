-- 20260712000000_atomic_survey_submission.sql
--
-- 背景: /form の送信は survey_responses への INSERT と survey_answers への INSERT を
-- 別々のクライアントリクエストで行っていたため、1件目が成功し2件目が失敗すると
-- 「回答レコードは存在するが5段階評価が1件も無い」壊れたデータが残っていた。
-- さらにユーザーが再送信すると company_id+recorded_month+fingerprint の
-- UNIQUE制約(23505)に引っかかり「回答済み」として成功表示されてしまうため、
-- 本人はスコアが保存されたと信じたまま、実際のスコアは永久に失われる。
--
-- 対策: response + answers の挿入を1つの SECURITY DEFINER 関数に集約し、
-- 単一トランザクションとして原子性を持たせる（answers 側で失敗すれば
-- response 側も自動的にロールバックされる）。

CREATE OR REPLACE FUNCTION submit_survey_response(
  p_company_id UUID,
  p_department_id UUID,
  p_axis_id UUID,
  p_recorded_month TEXT,
  p_free_comment TEXT,
  p_cross_dept_feedback TEXT,
  p_fingerprint TEXT,
  p_answers JSONB -- [{"question_id": "uuid", "score": 1-5}, ...]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response_id UUID;
BEGIN
  INSERT INTO survey_responses (
    company_id, department_id, axis_id, recorded_month,
    free_comment, cross_dept_feedback, fingerprint
  ) VALUES (
    p_company_id, p_department_id, p_axis_id, p_recorded_month,
    p_free_comment, p_cross_dept_feedback, p_fingerprint
  )
  RETURNING id INTO v_response_id;

  INSERT INTO survey_answers (response_id, question_id, score)
  SELECT v_response_id, (a->>'question_id')::UUID, (a->>'score')::INT
  FROM jsonb_array_elements(p_answers) AS a;

  RETURN v_response_id;
END;
$$;

-- 匿名(anon)・ログイン済み(authenticated) いずれも呼び出し可能にする
-- （/form は未ログインでもアクセスできるアンケート回答画面のため）
GRANT EXECUTE ON FUNCTION submit_survey_response(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

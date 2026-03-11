-- survey_responses テーブルから user_id カラムを削除し、完全匿名化を保証する

-- 1. 以前追加した user_id カラムを削除
ALTER TABLE survey_responses DROP COLUMN IF EXISTS user_id;

-- 2. 特権管理者（role = 'admin'）が自社の全回答を閲覧できるポリシーのみを残す
-- （以前の migration 016 で追加した strict ポリシーを、user_id 依存なしで再定義）

DROP POLICY IF EXISTS "users_read_company_surveys_strict" ON public.survey_responses;
DROP POLICY IF EXISTS "users_read_company_answers_strict" ON public.survey_answers;

-- 管理者のみが自社の回答を閲覧可能にする
CREATE POLICY "admins_read_company_surveys" ON public.survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.company_id = survey_responses.company_id 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "admins_read_company_answers" ON public.survey_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM survey_responses 
      JOIN users ON users.company_id = survey_responses.company_id
      WHERE survey_responses.id = survey_answers.response_id
      AND users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- survey_responses テーブルに user_id を追加し、二重回答防止とセキュリティを強化

-- 1. user_id カラムの追加（匿名回答も許容するため NULL 可能）
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. インデックスの追加（検索の高速化）
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_month ON survey_responses (user_id, recorded_month);

-- 3. セキュリティ強化: 「誰でも全件 SELECT 可能」な公開ポリシーを削除
DROP POLICY IF EXISTS "anyone_can_select_surveys" ON public.survey_responses;
DROP POLICY IF EXISTS "anyone_can_select_answers" ON public.survey_answers;

-- 4. 新しい SELECT ポリシー:
-- (a) 管理者は自社の全回答を閲覧可能
-- (b) 一般ユーザーは自分が回答した分だけを閲覧可能（重複チェック用）
CREATE POLICY "users_read_company_surveys_strict" ON public.survey_responses
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "users_read_company_answers_strict" ON public.survey_answers
  FOR SELECT USING (
    response_id IN (
      SELECT id FROM public.survey_responses 
      WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin')
      OR user_id = auth.uid()
    )
  );

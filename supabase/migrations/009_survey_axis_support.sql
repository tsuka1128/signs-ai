-- 1. survey_responses テーブルに axis_id を追加
ALTER TABLE public.survey_responses ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES public.kpi_axes(id);

-- 2. RLSポリシーの更新（念のため再確認と強化）
-- 誰でも回答可能、ただし会社IDと軸IDの整合性はINSERT時にチェック
DROP POLICY IF EXISTS "anyone_can_submit_survey" ON public.survey_responses;
CREATE POLICY "anyone_can_submit_survey" ON public.survey_responses
  FOR INSERT WITH CHECK (
    company_id IS NOT NULL 
    AND (axis_id IS NULL OR axis_id IN (SELECT id FROM public.kpi_axes WHERE company_id = survey_responses.company_id))
  );

DROP POLICY IF EXISTS "anyone_can_submit_survey_answers" ON public.survey_answers;
CREATE POLICY "anyone_can_submit_survey_answers" ON public.survey_answers
  FOR INSERT WITH CHECK (true);

-- 管理者が回答を閲覧するためのポリシー（既存の users_can_read_own_survey_responses 等を補強）
-- 決定版SQL(008)の get_my_company_id() を使用
CREATE OR REPLACE POLICY "users_read_company_surveys" ON public.survey_responses
  FOR SELECT USING (company_id = get_my_company_id());

CREATE OR REPLACE POLICY "users_read_company_answers" ON public.survey_answers
  FOR SELECT USING (
    response_id IN (SELECT id FROM public.survey_responses WHERE company_id = get_my_company_id())
  );

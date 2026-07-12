-- 20260712020000_enforce_member_limit_and_trial_readonly.sql
--
-- 背景: 販売準備度レビューで判明した2件の「実効性のない制限」を、DB層(RLS)で実効化する。
-- (1) プランの人数上限(max_headcount)が、招待作成時にどこでも検証されていなかった。
-- (2) トライアル期限切れ後の書き込み制限は、Next.js middleware でしか試みられておらず、
--     クライアントから直接 Supabase へ書き込む大半の経路（KPI入力・アンケート回答等）では
--     実効性が無かった。RLS(WITH CHECK)で担保することで、経路によらず一貫して機能させる。

-- ═══════════════════════════════════════════════
-- 1. プラン人数上限の実効化（invitations への INSERT を制限）
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_member_invite_limit(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max INTEGER;
  v_current INTEGER;
BEGIN
  SELECT COALESCE((c.plan_overrides->>'max_headcount')::INTEGER, p.max_headcount, 20)
  INTO v_max
  FROM companies c
  LEFT JOIN plans p ON p.id = c.plan_id
  WHERE c.id = p_company_id;

  SELECT
    (SELECT COUNT(*) FROM users WHERE company_id = p_company_id)
    + (SELECT COUNT(*) FROM invitations WHERE company_id = p_company_id AND status = 'pending')
  INTO v_current;

  RETURN v_current < COALESCE(v_max, 20);
END;
$$;

-- 既存の permissive ポリシー(invitations_super_admin_and_own_company)に対し、
-- RESTRICTIVE ポリシーを追加してAND条件で絞り込む。super_adminのなりすまし操作は対象外。
DROP POLICY IF EXISTS "enforce_member_limit_on_invite" ON public.invitations;
CREATE POLICY "enforce_member_limit_on_invite" ON public.invitations
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    OR check_member_invite_limit(company_id)
  );

-- ═══════════════════════════════════════════════
-- 2. トライアル期限切れ時の書き込み制限をRLSで実効化
--    （閲覧は引き続き許可。UI側は全画面ロックではなく閲覧専用バナーに変更する）
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_my_company_trial_expired()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies c
    JOIN users u ON u.company_id = c.id
    WHERE u.id = auth.uid()
      AND u.role != 'super_admin'
      AND c.status = 'trial'
      AND c.trial_expires_at IS NOT NULL
      AND c.trial_expires_at < NOW()
  );
$$;

-- kpi_records: 実績・目標の新規保存/更新を制限する（閲覧・削除は制限しない）
DROP POLICY IF EXISTS "block_kpi_writes_when_trial_expired_insert" ON public.kpi_records;
CREATE POLICY "block_kpi_writes_when_trial_expired_insert" ON public.kpi_records
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (NOT is_my_company_trial_expired());

DROP POLICY IF EXISTS "block_kpi_writes_when_trial_expired_update" ON public.kpi_records;
CREATE POLICY "block_kpi_writes_when_trial_expired_update" ON public.kpi_records
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  WITH CHECK (NOT is_my_company_trial_expired());

-- survey_responses / survey_answers は SECURITY DEFINER の submit_survey_response 経由でのみ
-- 書き込まれる（テーブル所有者としてRLSをバイパスするためRESTRICTIVEポリシーが効かない）。
-- そのためトライアル判定は関数内部で行う。匿名回答者の会社が期限切れの場合は保存を拒否する。
CREATE OR REPLACE FUNCTION submit_survey_response(
  p_company_id UUID,
  p_department_id UUID,
  p_axis_id UUID,
  p_recorded_month TEXT,
  p_free_comment TEXT,
  p_cross_dept_feedback TEXT,
  p_fingerprint TEXT,
  p_answers JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response_id UUID;
  v_expired BOOLEAN;
BEGIN
  SELECT (status = 'trial' AND trial_expires_at IS NOT NULL AND trial_expires_at < NOW())
  INTO v_expired
  FROM companies WHERE id = p_company_id;

  IF v_expired THEN
    RAISE EXCEPTION 'trial_expired' USING ERRCODE = 'P0001';
  END IF;

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

GRANT EXECUTE ON FUNCTION submit_survey_response(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

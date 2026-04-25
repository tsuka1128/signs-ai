-- 063: 匿名アンケート用の RLS 脆弱性修正
-- 直接のテーブル参照を禁止し、RPC 経由でのみ最小限の情報を返すように変更します。

-- 1. 既存の過度に緩いポリシーを削除
DROP POLICY IF EXISTS "public_read_companies_for_survey" ON public.companies;
DROP POLICY IF EXISTS "public_read_departments_for_survey" ON public.departments;
DROP POLICY IF EXISTS "public_read_kpi_axes_for_survey" ON public.kpi_axes;

-- 2. アンケート用の限定情報取得 RPC
-- SECURITY DEFINER により、RLS をバイパスして特定企業の最小限の情報のみ取得します。
CREATE OR REPLACE FUNCTION get_survey_info(
  p_short_id TEXT DEFAULT NULL,
  p_company_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_result JSON;
BEGIN
  -- short_id または company_id から対象企業を特定
  IF p_company_id IS NOT NULL THEN
    v_company_id := p_company_id;
  ELSIF p_short_id IS NOT NULL THEN
    SELECT id INTO v_company_id
    FROM companies
    WHERE short_id = p_short_id;
  END IF;

  IF v_company_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 必要最小限の情報のみを JSON で構築して返す
  SELECT json_build_object(
    'company_id', c.id,
    'company_name', c.name,
    'kpi_secondary_axis_name', c.kpi_secondary_axis_name,
    'survey_deadline_day', c.survey_deadline_day,
    'departments', (
      SELECT json_agg(json_build_object('id', d.id, 'name', d.name) ORDER BY d.sort_order ASC)
      FROM departments d WHERE d.company_id = v_company_id
    ),
    'axes', (
      SELECT json_agg(json_build_object('id', a.id, 'name', a.name) ORDER BY a.sort_order ASC)
      FROM kpi_axes a WHERE a.company_id = v_company_id
    )
  )
  INTO v_result
  FROM companies c
  WHERE c.id = v_company_id;

  RETURN v_result;
END;
$$;

-- 匿名ユーザー (anon) にこの関数の実行権限のみを付与
GRANT EXECUTE ON FUNCTION get_survey_info(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_survey_info(TEXT, UUID) TO authenticated;

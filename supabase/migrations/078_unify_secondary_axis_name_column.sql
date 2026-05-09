-- 078: 第2軸呼称カラムの統一
-- get_survey_info RPC が返す情報を secondary_axis_name に統一します。

CREATE OR REPLACE FUNCTION get_survey_info(
  p_short_id TEXT DEFAULT NULL,
  p_company_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'company_id', c.id,
    'company_name', c.name,
    'secondary_axis_name', c.secondary_axis_name, -- 統一
    'kpi_secondary_axis_name', c.secondary_axis_name, -- 互換性のために残す
    'survey_deadline_day', c.survey_deadline_day,
    'departments', (
      SELECT json_agg(json_build_object('id', d.id, 'name', d.name) ORDER BY d.sort_order ASC)
      FROM departments d WHERE d.company_id = c.id
    ),
    'axes', (
      SELECT json_agg(json_build_object('id', a.id, 'name', a.name) ORDER BY a.sort_order ASC)
      FROM kpi_axes a WHERE a.company_id = c.id
    )
  )
  FROM companies c
  WHERE (p_company_id IS NOT NULL AND c.id = p_company_id)
     OR (p_company_id IS NULL AND p_short_id IS NOT NULL AND c.short_id = p_short_id)
  LIMIT 1;
$$;

-- 既存データの同期（移行措置）
UPDATE companies 
SET secondary_axis_name = kpi_secondary_axis_name 
WHERE secondary_axis_name IS NULL AND kpi_secondary_axis_name IS NOT NULL;

-- Note: kpi_secondary_axis_name は非推奨となりました。今後は secondary_axis_name を使用してください。

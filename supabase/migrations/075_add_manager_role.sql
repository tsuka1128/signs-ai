-- 075_add_manager_role.sql
-- manager（部署管理者）ロールを導入し、自部署のデータのみ操作可能にする RLS を追加します。

-- 1. 自部署IDを取得するヘルパー関数
CREATE OR REPLACE FUNCTION get_my_department_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT department_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. ロール制約の更新
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'admin', 'manager', 'executive', 'player', 'partner'));

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;
ALTER TABLE invitations
  ADD CONSTRAINT invitations_role_check
  CHECK (role IN ('admin', 'manager', 'player', 'partner'));

-- 3. manager 用 RLS ポリシー

-- departments: 自部署のみ参照可能
DROP POLICY IF EXISTS "manager_own_department" ON departments;
CREATE POLICY "manager_own_department" ON departments
  FOR SELECT USING (
    id = get_my_department_id()
  );

-- kpi_definitions: 自部署が owner のもののみ
DROP POLICY IF EXISTS "manager_own_dept_kpi_definitions" ON kpi_definitions;
CREATE POLICY "manager_own_dept_kpi_definitions" ON kpi_definitions
  FOR SELECT USING (
    owner_dept_id = get_my_department_id()
  );

-- kpi_records: 自部署の実績・目標のみ操作可
DROP POLICY IF EXISTS "manager_own_dept_kpi_records" ON kpi_records;
CREATE POLICY "manager_own_dept_kpi_records" ON kpi_records
  FOR ALL USING (
    department_id = get_my_department_id()
  )
  WITH CHECK (
    department_id = get_my_department_id()
  );

-- survey_responses: 自部署の回答のみ参照可
DROP POLICY IF EXISTS "manager_own_dept_survey_responses" ON survey_responses;
CREATE POLICY "manager_own_dept_survey_responses" ON survey_responses
  FOR SELECT USING (
    department_id = get_my_department_id()
  );

-- ai_insights: 全社の分析結果を参照可
DROP POLICY IF EXISTS "manager_read_ai_insights" ON ai_insights;
CREATE POLICY "manager_read_ai_insights" ON ai_insights
  FOR SELECT USING (
    company_id = get_my_company_id()
  );

-- resource_records: 自部署の人数・人件費データのみ操作可
DROP POLICY IF EXISTS "manager_own_dept_resource_records" ON resource_records;
CREATE POLICY "manager_own_dept_resource_records" ON resource_records
  FOR ALL USING (
    department_id = get_my_department_id()
  )
  WITH CHECK (
    department_id = get_my_department_id()
  );

-- action_items: 自部署に紐づくアクションのみ参照可
DROP POLICY IF EXISTS "manager_own_dept_action_items" ON action_items;
CREATE POLICY "manager_own_dept_action_items" ON action_items
  FOR SELECT USING (
    department_id = get_my_department_id()
  );

-- 041_add_member_details.sql
-- メンバーごとにSlackメンションID、所属部署、担当KPIを管理できるようにカラムを追加します。

-- usersテーブルへの追加
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS slack_user_id TEXT,
ADD COLUMN IF NOT EXISTS assigned_kpi_id UUID REFERENCES public.kpi_definitions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.users.slack_user_id IS 'Slackでのメンション用ID (例: U12345678)';
COMMENT ON COLUMN public.users.assigned_kpi_id IS 'このユーザーが担当する主要なKPI';

-- invitationsテーブルへの追加 (招待時に予め設定できるようにするため)
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS slack_user_id TEXT,
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES public.kpi_axes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_kpi_id UUID REFERENCES public.kpi_definitions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.invitations.slack_user_id IS '招待されるユーザーの予定Slack ID';
COMMENT ON COLUMN public.invitations.department_id IS '招待時に割り当てる所属部署';
COMMENT ON COLUMN public.invitations.axis_id IS '招待時に割り当てる第2軸(担当項目)';
COMMENT ON COLUMN public.invitations.assigned_kpi_id IS '招待時に割り当てる担当KPI';

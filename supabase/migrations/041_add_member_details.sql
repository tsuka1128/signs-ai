-- 041_add_member_details.sql
-- メンバーごとにSlackメンションID、所属部署、担当項目を管理できるようにカラムを追加します。

-- usersテーブルへの追加
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS slack_user_id TEXT,
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES public.kpi_axes(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.users.slack_user_id IS 'Slackでのメンション用ID (例: U12345678)';
COMMENT ON COLUMN public.users.department_id IS '所属部署';
COMMENT ON COLUMN public.users.axis_id IS '担当領域（旧：プロダクト）';

-- invitationsテーブルへの追加 (招待時に予め設定できるようにするため)
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS slack_user_id TEXT,
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES public.kpi_axes(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.invitations.slack_user_id IS '招待されるユーザーの予定Slack ID';
COMMENT ON COLUMN public.invitations.department_id IS '招待時に割り当てる所属部署';
COMMENT ON COLUMN public.invitations.axis_id IS '招待時に割り当てる担当領域';

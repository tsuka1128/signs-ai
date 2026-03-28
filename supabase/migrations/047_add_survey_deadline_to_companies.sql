-- 047: 企業テーブルへのアンケート回答期限（日）の追加
-- 毎月の回答締め切り日を設定できるようにします

ALTER TABLE public.companies 
ADD COLUMN survey_deadline_day INTEGER DEFAULT 20 
CHECK (survey_deadline_day >= 1 AND survey_deadline_day <= 31);

-- 既存の RLS ポリシー "public_read_companies_for_survey" により、
-- 新しく追加されたカラムも未ログインユーザーから参照可能です。

-- =====================================================
-- 請求関連新カラムの物理的な作成とキャッシュの強制更新
-- =====================================================

-- 1. カラムの存在を確認し、なければ追加
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS custom_mrr NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS setup_fee NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS billing_contact_name TEXT,
ADD COLUMN IF NOT EXISTS billing_memo TEXT;

-- 2. カラム追加後に RLS ポリシーを確実に再適用
DROP POLICY IF EXISTS "super_admins_all_companies" ON public.companies;

CREATE POLICY "super_admins_all_companies" ON public.companies
  FOR ALL TO authenticated 
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 3. PostgREST のスキーマキャッシュをリロード（Supabase環境ではこれが重要な場合があります）
-- 注意: このコマンドは権限によっては実行できない場合がありますが、
-- スキーマ変更自体で自動リロードされるはずです。
NOTIFY pgrst, 'reload schema';

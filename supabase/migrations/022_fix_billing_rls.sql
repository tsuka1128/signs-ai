-- =====================================================
-- 請求関連新カラムへの super_admin アクセス権限を確実に適用
-- =====================================================

-- 既存の super_admin 用ポリシーを一旦削除して再定義（完全に FOR ALL で全カラム対象にする）
DROP POLICY IF EXISTS "super_admins_all_companies" ON public.companies;

CREATE POLICY "super_admins_all_companies" ON public.companies
  FOR ALL TO authenticated 
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- カラムが作成されていることを再確認（念のため記述、既存ならスキップされる）
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS custom_mrr NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS setup_fee NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS billing_contact_name TEXT,
ADD COLUMN IF NOT EXISTS billing_memo TEXT;

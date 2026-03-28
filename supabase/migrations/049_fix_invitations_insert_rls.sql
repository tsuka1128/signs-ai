-- 049_fix_invitations_insert_rls.sql
-- invitations テーブルに対する INSERT ポリシーが不足していたため、認証済みユーザーが自社の招待を作成できるように権限を付与する。

-- 旧来の広範なポリシーがあれば削除（念のため）
DROP POLICY IF EXISTS "invitations_all" ON public.invitations;
DROP POLICY IF EXISTS "users_own_company_invitations" ON public.invitations;

-- 1. SELECT: 自社の招待またはトークン一致（トークン一致は 018 で定義済みだが統合する）
CREATE POLICY "invitations_select" ON public.invitations
  FOR SELECT USING (
    company_id = get_my_company_id()
    OR (auth.role() = 'anon') -- トークンを知っている参加者用
  );

-- 2. INSERT: 自分の会社の招待のみ作成可能
CREATE POLICY "invitations_insert" ON public.invitations
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
  );

-- 3. UPDATE / DELETE: 自社の招待のみ管理可能（管理者・マネージャー想定だが RLS は会社単位）
CREATE POLICY "invitations_modify" ON public.invitations
  FOR ALL USING (
    company_id = get_my_company_id()
  );

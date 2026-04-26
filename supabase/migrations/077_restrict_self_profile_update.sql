-- 自己更新ポリシーに WITH CHECK を追加してロール変更を防止
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

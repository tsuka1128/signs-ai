-- notifications: super_admin が admin 宛通知を受け取れるようにする
--
-- 背景：
--   通知のRLSは target_role = 自分のrole の「厳密一致」だったため、
--   role が super_admin のユーザーは admin/executive/manager 宛のロール通知に
--   一切マッチせず、AI分析完了通知などがベルに表示されなかった。
--   super_admin は実質的に全社管理者（admin 相当）なので、admin 宛通知を見せる。
--
-- 変更：SELECT / UPDATE 両ポリシーに
--   「自分が super_admin かつ target_role='admin'」の条件を追加（冪等な再作成）。

DROP POLICY IF EXISTS "users_select_own_notifications" ON notifications;
CREATE POLICY "users_select_own_notifications" ON notifications
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND (
      user_id = auth.uid()
      OR (
        user_id IS NULL
        AND (
          target_role = (SELECT role FROM users WHERE id = auth.uid())
          OR (
            (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
            AND target_role = 'admin'
          )
        )
        AND (
          target_department_id IS NULL
          OR target_department_id = get_my_department_id()
        )
      )
    )
  );

DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND (
      user_id = auth.uid()
      OR (
        user_id IS NULL
        AND (
          target_role = (SELECT role FROM users WHERE id = auth.uid())
          OR (
            (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
            AND target_role = 'admin'
          )
        )
        AND (
          target_department_id IS NULL
          OR target_department_id = get_my_department_id()
        )
      )
    )
  );

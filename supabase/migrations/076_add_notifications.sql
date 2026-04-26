-- 076_add_notifications.sql
-- インアプリ通知ベルのための通知テーブルと RLS ポリシーを作成します。

-- 通知テーブル
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULLの場合はロール全体への通知
  target_role text,  -- NULL or 'admin' or 'executive' or 'manager' or 'player'
  target_department_id uuid REFERENCES departments(id) ON DELETE CASCADE,  -- NULL=全社, 指定あり=特定部署のみ
  type text NOT NULL,  -- 'ai_analysis_done' | 'anomaly_detected' | 'action_request' | 'kpi_reminder' | 'survey_response_low' | 'member_joined' | 'voice_check_request' | 'survey_deadline_reminder'
  title text NOT NULL,
  body text,
  link text,  -- クリック時の遷移先
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS 有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 参照ポリシー: 自分の ID 宛て、または自分のロール宛て（+ 部署が一致または全社）を参照可能
DROP POLICY IF EXISTS "users_select_own_notifications" ON notifications;
CREATE POLICY "users_select_own_notifications" ON notifications
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND (
      user_id = auth.uid()
      OR (
        user_id IS NULL
        AND target_role = (SELECT role FROM users WHERE id = auth.uid())
        AND (
          target_department_id IS NULL
          OR target_department_id = get_my_department_id()
        )
      )
    )
  );

-- 更新ポリシー: 既読フラグの更新用
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND (
      user_id = auth.uid()
      OR (
        user_id IS NULL
        AND target_role = (SELECT role FROM users WHERE id = auth.uid())
        AND (
          target_department_id IS NULL
          OR target_department_id = get_my_department_id()
        )
      )
    )
  );

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notifications_company_created ON notifications(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role, target_department_id);

import { createClient } from "@supabase/supabase-js";

// サービスロールを使用して通知を作成するための管理者クライアント
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type NotificationType =
  | "ai_analysis_done"
  | "anomaly_detected"
  | "action_request"
  | "kpi_reminder"
  | "survey_response_low"
  | "member_joined"
  | "voice_check_request"
  | "survey_deadline_reminder";

export interface CreateNotificationParams {
  companyId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  // いずれか1つを指定
  userId?: string;           // 特定ユーザー宛て
  targetRole?: string;       // ロール全体宛て
  targetDepartmentId?: string | null;  // targetRole と組み合わせ: null=全社, 指定=特定部署
}

/**
 * 新しい通知を作成します（サーバーサイド専用）
 */
export async function createNotification(params: CreateNotificationParams) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    company_id: params.companyId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
    user_id: params.userId ?? null,
    target_role: params.targetRole ?? null,
    target_department_id: params.targetDepartmentId ?? null,
  });
  
  if (error) {
    console.error("createNotification error:", error);
  }
}

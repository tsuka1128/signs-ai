import { createClient } from "@supabase/supabase-js";

// サービスロールを使用して通知を作成するための管理者クライアント
let supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // ビルド時はここを通る可能性があるが、関数が呼ばれない限りエラーにはならない
    return null;
  }

  supabaseAdmin = createClient(url, key);
  return supabaseAdmin;
}

export type NotificationType =
  | "ai_analysis_done"
  | "anomaly_detected"
  | "action_request"
  | "action_decided"
  | "kpi_reminder"
  | "survey_response_low"
  | "member_joined"
  | "voice_check_request"
  | "survey_deadline_reminder"
  | "voice_check_completed";

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
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.warn("createNotification skipped: Supabase admin client not initialized (check env vars)");
    return;
  }

  const { error } = await admin.from("notifications").insert({
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

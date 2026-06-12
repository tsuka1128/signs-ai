import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { resolveAllDepartmentsHeadcountsAcrossCompany } from "@/lib/headcount";

/**
 * 週次で起動され、各部署のボイスチェック回答率に基づき、
 * 部署マネージャー宛てに全員完了通知または未完了リマインド通知を作成します。
 */
export async function GET(request: Request) {
  // 1. Authorization ヘッダーを検証
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Supabase Admin client を初期化
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 3. 今月の `recorded_month` を算出 (JST基準)
    const nowJST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const year = nowJST.getFullYear();
    const month = String(nowJST.getMonth() + 1).padStart(2, "0");
    const currentMonth = `${year}-${month}`;
    const startOfMonth = `${currentMonth}-01T00:00:00+09:00`;

    // 4. 全部署を取得
    const { data: departments, error: deptsErr } = await supabaseAdmin
      .from("departments")
      .select("id, name, company_id");

    if (deptsErr) throw deptsErr;
    if (!departments) {
      return NextResponse.json({ success: true, message: "No departments found." });
    }

    // 全部署の当月実績人数を一括解決
    const resolvedHeadcounts = await resolveAllDepartmentsHeadcountsAcrossCompany(supabaseAdmin, currentMonth);

    const results = [];

    // 5. 各部署をループ処理
    for (const dept of departments) {
      if (!dept.company_id) continue;

      // 5.1 headcount (月次実績人数) の解決
      const activeHeadcount = resolvedHeadcounts[dept.id] || 0;

      // 5.2 当月の回答者数のカウント
      const { count: respondentCount, error: responsesErr } = await supabaseAdmin
        .from("survey_responses")
        .select("id", { count: "exact", head: true })
        .eq("company_id", dept.company_id)
        .eq("department_id", dept.id)
        .eq("recorded_month", currentMonth);

      if (responsesErr) {
        console.error(`Error fetching survey responses for dept ${dept.name}:`, responsesErr);
        continue;
      }

      const activeRespondentCount = respondentCount || 0;

      // 5.3 完了・未完了の判定と通知
      if (activeHeadcount > 0 && activeRespondentCount >= activeHeadcount) {
        // 重複チェック (当月同一部署宛てに voice_check_completed が送信済みか)
        const { data: existingNotif, error: notifErr } = await supabaseAdmin
          .from("notifications")
          .select("id")
          .eq("company_id", dept.company_id)
          .eq("target_department_id", dept.id)
          .eq("type", "voice_check_completed")
          .gte("created_at", startOfMonth)
          .limit(1);

        if (notifErr) {
          console.error(`Error checking existing notifications for dept ${dept.name}:`, notifErr);
          continue;
        }

        if (existingNotif && existingNotif.length > 0) {
          // すでに完了通知を送信済みなのでスキップ
          results.push({ department: dept.name, status: "completed_already_notified" });
        } else {
          // 完了通知を作成
          await createNotification({
            companyId: dept.company_id,
            type: "voice_check_completed",
            title: "ボイスチェック完了",
            body: `${dept.name}は今月のボイスチェックが全員回答済みです（${activeHeadcount}名）`,
            targetRole: "manager",
            targetDepartmentId: dept.id,
            link: `/dept?dept=${dept.id}`,
          });
          results.push({ department: dept.name, status: "completed_notified" });
        }
      } else {
        // 未完了（人数が0名の場合を除く）
        if (activeHeadcount > 0) {
          // リマインド通知を作成 (重複チェックは不要で、毎週送信)
          await createNotification({
            companyId: dept.company_id,
            type: "survey_deadline_reminder",
            title: "ボイスチェック リマインド",
            body: `${dept.name}の今月の回答は ${activeRespondentCount}/${activeHeadcount} 名です。メンバーへの声かけをお願いします`,
            targetRole: "manager",
            targetDepartmentId: dept.id,
            link: `/dept?dept=${dept.id}`,
          });
          results.push({ department: dept.name, status: "reminder_sent" });
        } else {
          results.push({ department: dept.name, status: "no_members" });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    console.error("Cron job error:", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSlackNotification } from "@/lib/slack";
import { DEFAULT_USD_TO_JPY } from "@/lib/token-pricing";
import { getBaseURL } from "@/lib/utils/index";

// サービスロールを使用して全社のログを集計・配信する
let supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supabaseAdmin = createClient(url, key);
  return supabaseAdmin;
}

/**
 * GET/POST: 経営層向け週次AI人件費・トークンコスト集計レポート (バフェットレポート)
 * 
 * @route /api/cron/buffett-report
 */
export async function GET(req: Request) {
  return handleBuffettReport(req);
}

export async function POST(req: Request) {
  return handleBuffettReport(req);
}

async function handleBuffettReport(req: Request) {
  try {
    // 1. Cron 認証チェック
    const authHeader = req.headers.get("authorization");
    const isCronSecretValid = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    
    // 開発環境かつローカルでのデバッグ目的で、クエリパラメータ `bypass=true` がある場合は認証をパスさせる設計
    const { searchParams } = new URL(req.url);
    const bypass = searchParams.get("bypass") === "true";
    const isDev = process.env.NODE_ENV === "development";

    if (!isCronSecretValid && !(isDev && bypass)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Supabase admin client not initialized" }, { status: 500 });
    }

    // 2. 過去7日間の日付を取得
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    // 3. 全社の 7日以内のトークン利用ログを取得
    const { data: logs, error: logsError } = await admin
      .from("ai_usage_logs")
      .select("*")
      .gte("created_at", dateStr);

    if (logsError) {
      console.error("Buffett Report fetch logs error:", logsError);
      return NextResponse.json({ error: "Failed to fetch usage logs" }, { status: 500 });
    }

    // 4. 全契約企業の一覧を取得
    const { data: companies, error: compError } = await admin
      .from("companies")
      .select("id, name");

    if (compError) {
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }

    // 5. 各企業に対して Slack 配信用の集計処理を行う
    const results: any[] = [];

    for (const comp of (companies || [])) {
      const compLogs = (logs as any[] || []).filter((l: any) => l.company_id === comp.id);
      if (compLogs.length === 0) continue; // 過去7日間に稼働ログがない場合は配信スキップ

      // 5-1. モデル別集計
      const modelSummary: Record<string, { count: number; input: number; output: number; costUsd: number }> = {};
      // 5-2. エージェント別集計
      const agentSummary: Record<string, { costUsd: number; count: number }> = {};

      let totalCostUsd = 0;
      let totalTokens = 0;

      for (const log of compLogs) {
        // モデル別
        if (!modelSummary[log.model]) {
          modelSummary[log.model] = { count: 0, input: 0, output: 0, costUsd: 0 };
        }
        modelSummary[log.model].count += 1;
        modelSummary[log.model].input += log.input_tokens;
        modelSummary[log.model].output += log.output_tokens;
        modelSummary[log.model].costUsd += Number(log.cost_usd);

        // エージェント別
        const agent = log.agent_name || "system";
        if (!agentSummary[agent]) {
          agentSummary[agent] = { costUsd: 0, count: 0 };
        }
        agentSummary[agent].costUsd += Number(log.cost_usd);
        agentSummary[agent].count += 1;

        totalCostUsd += Number(log.cost_usd);
        totalTokens += (log.input_tokens + log.output_tokens);
      }

      const totalCostJpy = Math.round(totalCostUsd * DEFAULT_USD_TO_JPY);

      // 5-3. 企業の executive 宛て Slack チャンネルを取得
      const { data: slackChannels } = await admin
        .from("slack_channels")
        .select("webhook_url")
        .eq("company_id", comp.id)
        .eq("channel_type", "executive");

      if (!slackChannels || slackChannels.length === 0) {
        console.warn(`Buffett Report: No executive slack channel found for company ${comp.name} (${comp.id})`);
        continue;
      }

      // 5-4. 月次 AI 人件費テーブル (ai_labor_records) へ自動蓄積・upsert (集計タイミングは月跨ぎ等を考慮し、recorded_month は YYYY-MM)
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      for (const [agent, data] of Object.entries(agentSummary)) {
        // 月次の合計人件費を upsert。 recorded_month は現在の月。
        // department_id は logs には入っていないため、ai_workers を経由して assigned な部署があれば紐づけ
        const { data: worker } = await admin
          .from("ai_workers")
          .select("department_id")
          .eq("company_id", comp.id)
          .eq("agent_name", agent)
          .eq("status", "active")
          .maybeSingle();

        const resolvedDeptId = worker?.department_id || null;

        // すでに該当月のレコードがあるかチェック
        const { data: existingRecord } = await admin
          .from("ai_labor_records")
          .select("id, labor_cost, total_tokens")
          .eq("company_id", comp.id)
          .eq("recorded_month", currentMonth)
          .eq("agent_name", agent)
          .maybeSingle();

        const costJpy = Math.round(data.costUsd * DEFAULT_USD_TO_JPY);
        
        if (existingRecord) {
          // 既存に累積加算
          await admin
            .from("ai_labor_records")
            .update({
              labor_cost: Number(existingRecord.labor_cost) + costJpy,
              total_tokens: Number(existingRecord.total_tokens) + totalTokens
            })
            .eq("id", existingRecord.id);
        } else {
          // 新規インサート
          await admin
            .from("ai_labor_records")
            .insert({
              company_id: comp.id,
              department_id: resolvedDeptId,
              recorded_month: currentMonth,
              agent_name: agent,
              labor_cost: costJpy,
              total_tokens: totalTokens
            });
        }
      }

      // 5-5. Slack Block Kit メッセージの組み立て
      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `📊 *【週次AI人件費レポート】バフェットレポート (${comp.name})*`
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `📅 集計期間: 過去7日間 (${new Date(sevenDaysAgo).toLocaleDateString("ja-JP")} 〜 ${new Date().toLocaleDateString("ja-JP")})`
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `💰 *今週のAI稼働費の総額:* \n*${totalCostJpy.toLocaleString()} 円* (計 ${totalCostUsd.toFixed(4)} USD / ${totalTokens.toLocaleString()} tokens)`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*👤 エージェント別のAI人件費内訳*"
          }
        }
      ];

      // エージェント別内訳テキスト
      let agentText = "";
      for (const [agent, data] of Object.entries(agentSummary)) {
        const jpy = Math.round(data.costUsd * DEFAULT_USD_TO_JPY);
        agentText += `・*${agent}*: \`${jpy.toLocaleString()} 円\` (稼働回数: ${data.count}回 / ${data.costUsd.toFixed(4)} USD)\n`;
      }
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: agentText || "・稼働なし"
        }
      });

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🤖 LLMモデル別の利用状況*"
        }
      });

      // モデル別内訳テキスト
      let modelText = "";
      for (const [model, data] of Object.entries(modelSummary)) {
        const jpy = Math.round(data.costUsd * DEFAULT_USD_TO_JPY);
        modelText += `・*${model}*: \`${jpy.toLocaleString()} 円\` (${data.count}回)\n  └ tokens: In ${data.input.toLocaleString()} / Out ${data.output.toLocaleString()}\n`;
      }
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: modelText || "・稼働なし"
        }
      });

      blocks.push({
        type: "divider"
      });

      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `💡 ※AI人件費は 1 USD = ${DEFAULT_USD_TO_JPY} JPY 換算で算出しています。分析データは [SignsAI ダッシュボード](${getBaseURL()}/hr-strategy) のAI人件費推移からもご確認いただけます。`
          }
        ]
      });

      // 5-6. 各 executive チャンネルへ並列送信
      let sentCount = 0;
      for (const chan of slackChannels) {
        if (!chan.webhook_url) continue;
        const success = await sendSlackNotification(chan.webhook_url, `週次AI人件費レポート (${comp.name})`, blocks);
        if (success) sentCount++;
      }

      results.push({
        companyId: comp.id,
        companyName: comp.name,
        totalCostJpy,
        totalTokens,
        sentCount
      });
    }

    return NextResponse.json({ success: true, processedCompanies: results });

  } catch (error: any) {
    console.error("Buffett Report API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

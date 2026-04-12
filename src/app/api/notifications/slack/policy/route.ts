import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { sendSlackNotification } from "@/lib/slack";

export async function POST(request: NextRequest) {
    const supabase = await createServerSupabaseClient();

    // 1. 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. リクエストボディ解析
    let body: { text: string; translations?: Record<string, string> };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { text: policyText, translations } = body;
    if (!policyText) {
        return NextResponse.json({ error: "Policy text is required" }, { status: 400 });
    }

    // 3. 会社情報（Webhook URL）の取得
    // 3. 会社情報（Webhook URL）の取得
    const { data: userData } = await supabase.from('users').select('company_id, role').eq('id', user.id).single();
    
    // 管理者以外で company_id がない場合のみエラー
    const isSuperAdmin = userData?.role === 'super_admin';
    if (!userData?.company_id && !isSuperAdmin) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // 代理ログイン ID の調整 (super_admin の場合のみ targetCompanyId を優先)
    let effectiveCompanyId = userData?.company_id;
    if (isSuperAdmin && (body as any).targetCompanyId) {
        effectiveCompanyId = (body as any).targetCompanyId;
    }

    if (!effectiveCompanyId) {
        return NextResponse.json({ error: "Target company ID is required" }, { status: 400 });
    }

    const { data: company } = await supabase.from('companies').select('name, slack_webhook_url').eq('id', effectiveCompanyId).single();
    if (!company?.slack_webhook_url) {
        return NextResponse.json({ error: "Slack Webhook URL is not configured for this company" }, { status: 400 });
    }

    // 4. 全ユーザーと部署を並列で取得
    const [usersRes, deptsRes] = await Promise.all([
        supabase.from('users').select('id, display_name, email, slack_user_id, department_id').eq('company_id', effectiveCompanyId),
        supabase.from('departments').select('id, name').eq('company_id', effectiveCompanyId)
    ]);

    const users = usersRes.data || [];
    const depts = deptsRes.data || [];

    // 5. 部署ごとにメッセージを構築
    // まず共通のヘッダーメッセージを送信
    const headerText = `📢 *組織方針が更新されました: ${company.name}*`;
    const introText = `最新の方針に基づいてAIが各部署の状況を分析しています。\n下記、各部署への通知を確認してください。`;
    
    // Slackへの送信処理
    // 部署ごとにBlockを分けて作成し、一つの通知として送るか、複数回に分けるか検討
    // ここでは一つのメッセージにまとめて送る（Block Kit制限を考慮しつつ）
    
    const blocks: any[] = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `${headerText}\n${introText}`
            }
        },
        {
            type: "divider"
        }
    ];

    // 方針の内容を抜粋
    const summary = policyText.split('\n').filter(l => l.trim()).slice(0, 5).join('\n');
    blocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `*【最新の方針（抜粋）】*\n>>>${summary}${policyText.split('\n').filter(l => l.trim()).length > 5 ? '\n...' : ''}`
        }
    });

    // 部署ごとのメンション付きセクションの作成
    for (const dept of depts) {
        const deptUsers = users.filter(u => u.department_id === dept.id && u.slack_user_id);
        if (deptUsers.length === 0) continue;

        const mentions = deptUsers.map(u => `<@${u.slack_user_id}>`).join(' ');
        
        const aiDeptMessage = translations && translations[dept.id] 
            ? translations[dept.id] 
            : "今月の全社方針に基づき、各担当指標の再確認をお願いします。分析結果は SignsAI ダッシュボードにてご確認いただけます。";
        
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*🏢 ${dept.name} メンバーへの通知*\n${mentions}\n${aiDeptMessage}`
            }
        });
    }

    const footerText = "\n\n🔗 [SignsAI ダッシュボードを開く](https://signs-ai.vercel.app/dashboard)"; // 仮のURL
    blocks.push({
        type: "context",
        elements: [
            {
                type: "mrkdwn",
                text: footerText
            }
        ]
    });

    const success = await sendSlackNotification(company.slack_webhook_url, `組織方針更新のお知らせ (${company.name})`, blocks);

    if (success) {
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: "Failed to send Slack notification" }, { status: 500 });
    }
}

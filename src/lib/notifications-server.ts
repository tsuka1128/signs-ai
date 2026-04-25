import { createClient } from "@/lib/supabase/server";
import { sendSlackNotification } from "./slack";
import { getBaseURL } from "./utils";

type NotificationType = 
    | 'ai_summary' 
    | 'anomaly_alert' 
    | 'voice_check_reminder' 
    | 'voice_check_progress' 
    | 'kpi_reminder' 
    | 'action_reminder';

interface NotificationTarget {
    id: string;
    email: string;
    slack_user_id: string | null;
    display_name: string | null;
}

/**
 * 通知対象のユーザーを取得する
 * 
 * @param companyId 企業ID
 * @param type 通知種別
 * @returns 通知設定が有効かつ slack_user_id を持つユーザーのリスト
 */
export async function getNotificationTargets(
    companyId: string,
    type: NotificationType
): Promise<NotificationTarget[]> {
    const supabase = await createClient();

    // 1. まず企業内の全アクティブユーザーを取得
    // 役割判定
    let roleFilter: string[] = [];
    if (type === 'ai_summary' || type === 'anomaly_alert') {
        roleFilter = ['admin', 'executive', 'super_admin'];
    } else if (type === 'voice_check_progress') {
        roleFilter = ['admin', 'manager', 'super_admin'];
    } else {
        // player 等を含む全ロール
        roleFilter = ['admin', 'executive', 'manager', 'player', 'partner', 'super_admin'];
    }

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, role, slack_user_id, display_name, department_id')
        .eq('company_id', companyId)
        .in('role', roleFilter);

    if (userError || !users) {
        console.error(`Error fetching notification targets: ${userError?.message}`);
        return [];
    }

    // 2. 通知設定を取得してフィルタリング
    const userIds = users.map(u => u.id);
    const { data: settings, error: settingsError } = await supabase
        .from('notification_settings')
        .select('user_id, slack_enabled')
        .eq('notification_type', type)
        .in('user_id', userIds);

    if (settingsError) {
        console.error(`Error fetching notification settings: ${settingsError.message}`);
        // 設定取得エラー時は「デフォルト有効」として進める
    }

    // 3. フィルタリングロジック
    return users.filter(u => {
        // slack_user_id がない場合は通知不可（ログ出力してスキップ）
        if (!u.slack_user_id) {
            console.log(`User ${u.id} (${u.email}) skipped: no slack_user_id set.`);
            return false;
        }

        const s = settings?.find(setting => setting.user_id === u.id);
        // 設定がない場合はデフォルト有効(true)とする
        const isEnabled = s ? s.slack_enabled : true;

        return isEnabled;
    });
}

/**
 * AI診断結果サマリーのSlack通知を送信する
 */
export async function sendAiSummaryNotification(companyId: string) {
    try {
        const supabase = await createClient();
        
        // 企業のWebhook URLを取得
        const { data: company } = await supabase
            .from('companies')
            .select('slack_webhook_url, name')
            .eq('id', companyId)
            .single();

        if (!company?.slack_webhook_url) return;

        // 通知対象を取得
        const targets = await getNotificationTargets(companyId, 'ai_summary');

        // 全員が無効、または対象がいない場合はスキップ
        if (targets.length === 0) {
            console.log(`No targets for AI summary notification in company ${companyId}`);
            return;
        }

        const mentions = targets.map(t => `<@${t.slack_user_id}>`).join(' ');
        const dashboardUrl = `${getBaseURL()}/dashboard`;

        const text = `${mentions}\nAIによる組織状態の分析が完了しました。詳細はアプリをご確認ください。`;
        const blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `${mentions}\n*AIによる組織状態の分析が完了しました。*\n最新の診断レポートがダッシュボードからご確認いただけます。`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "ダッシュボードを見る"
                        },
                        "url": dashboardUrl,
                        "style": "primary"
                    }
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "※この通知は管理者および経営層の方に送信されています。診断詳細は機密情報を含むため、アプリ内でのみ公開されています。"
                    }
                ]
            }
        ];

        await sendSlackNotification(company.slack_webhook_url, text, blocks);
        console.log(`AI summary notification sent to ${targets.length} users in company ${companyId}`);

    } catch (error) {
        // AI分析自体を落とさないよう、通知のエラーはキャッチしてログ出力のみ
        console.error("Failed to send AI summary notification:", error);
    }
}

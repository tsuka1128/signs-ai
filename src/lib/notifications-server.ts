import { createServerSupabaseClient as createClient } from "@/lib/supabase-server";
import { sendSlackNotification } from "./slack";
import { getBaseURL } from "@/lib/utils/index";

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

/**
 * 今月のボイスチェック未回答者へ催促通知を送信する
 */
export async function sendVoiceCheckReminders(companyId: string) {
    try {
        const supabase = await createClient();
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        // 1. 配信対象候補（player / manager / admin などの回答対象ロール）を取得
        // ※実際には回答権限のある全ユーザー
        const { data: allUsers } = await supabase
            .from('users')
            .select('id, email, slack_user_id, role')
            .eq('company_id', companyId);

        if (!allUsers) return;

        // 2. 今月の回答済みユーザーを取得
        const { data: answered } = await supabase
            .from('survey_responses')
            .select('user_id')
            .eq('company_id', companyId)
            .eq('recorded_month', currentMonth);

        const answeredUserIds = new Set(answered?.map(a => a.user_id) || []);

        // 3. 未回答者を特定
        const targets = allUsers.filter(u => 
            !answeredUserIds.has(u.id) && 
            u.slack_user_id // Slack ID がある人のみ
        );

        if (targets.length === 0) {
            console.log("No unanswered users found for voice check reminder.");
            return;
        }

        // 4. 通知設定によるフィルタリング
        const userIds = targets.map(t => t.id);
        const { data: settings } = await supabase
            .from('notification_settings')
            .select('user_id, slack_enabled')
            .eq('notification_type', 'voice_check_reminder')
            .in('user_id', userIds);

        const finalTargets = targets.filter(t => {
            const s = settings?.find(s => s.user_id === t.id);
            return s ? s.slack_enabled : true; // デフォルト有効
        });

        if (finalTargets.length === 0) return;

        // 5. 企業のWebhook URLを取得
        const { data: company } = await supabase
            .from('companies')
            .select('slack_webhook_url')
            .eq('id', companyId)
            .single();

        if (!company?.slack_webhook_url) return;

        // 6. 送信
        const mentions = finalTargets.map(t => `<@${t.slack_user_id}>`).join(' ');
        const surveyUrl = `${getBaseURL()}/check`;

        const text = `${mentions}\n今月のボイスチェック（組織状態アンケート）が未回答です。ご回答をお願いします。`;
        const blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `${mentions}\n*今月のボイスチェック（組織状態アンケート）への回答をお願いします。*\n組織の健康状態を把握するため、1分程度で終わる簡単な質問にご協力ください。`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "アンケートに回答する"
                        },
                        "url": surveyUrl,
                        "style": "primary"
                    }
                ]
            }
        ];

        await sendSlackNotification(company.slack_webhook_url, text, blocks);
        console.log(`Voice check reminder sent to ${finalTargets.length} users.`);

    } catch (error) {
        console.error("Failed to send voice check reminders:", error);
    }
}

/**
 * 異常検知アラート通知を送信する
 */
export async function sendAnomalyAlertNotification(
    companyId: string,
    currentAvgPulse: number,
    previousAvgPulse: number | null,
    deptScores: { deptId: string; deptName: string; avgScore: number }[],
    riskLevel: 'low' | 'medium' | 'high',
    riskReason: string | null
): Promise<void> {
    try {
        const anomalies: string[] = [];

        // 条件A: スコア絶対値 (60以下)
        if (currentAvgPulse <= 60) {
            anomalies.push(`・*全社平均スコアの低下*: ${currentAvgPulse.toFixed(1)}点（基準: 60点以下）`);
        }

        // 条件B: 前月比下落 (10pt以上)
        if (previousAvgPulse !== null && (previousAvgPulse - currentAvgPulse) >= 10) {
            anomalies.push(`・*急激なスコア下落*: 前月比 -${(previousAvgPulse - currentAvgPulse).toFixed(1)}pt`);
        }

        // 条件C: 部門スコア乖離 (全社平均より 20pt以上下回る部署)
        const lowDepts = deptScores.filter(d => (currentAvgPulse - d.avgScore) >= 20);
        if (lowDepts.length > 0) {
            const names = lowDepts.map(d => `${d.deptName}(${d.avgScore.toFixed(1)}点)`).join(', ');
            anomalies.push(`・*部門間の大きな乖離*: 全社平均より20pt以上低い部署があります（${names}）`);
        }

        // 条件D: AI危険フラグ
        if (riskLevel === 'high') {
            anomalies.push(`・*AIによるリスク検知*: ${riskReason || '組織に緊急対応が必要な兆候があります'}`);
        }

        // 1つも該当しなければ送信しない
        if (anomalies.length === 0) return;

        const supabase = await createClient();
        const { data: company } = await supabase
            .from('companies')
            .select('slack_webhook_url')
            .eq('id', companyId)
            .single();

        if (!company?.slack_webhook_url) return;

        const targets = await getNotificationTargets(companyId, 'anomaly_alert');
        const mentions = targets.length > 0 ? targets.map(t => `<@${t.slack_user_id}>`).join(' ') : '';
        
        const isUrgent = riskLevel === 'high' || currentAvgPulse <= 50;
        const icon = isUrgent ? '⚠️' : '🚨';
        const title = isUrgent ? '*【緊急】組織異常検知アラート*' : '*組織異常検知アラート*';
        
        const dashboardUrl = `${getBaseURL()}/dashboard`;
        const text = `${mentions}\n組織状態に異常が検知されました。\n${anomalies.join('\n')}`;

        const blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `${mentions}\n${icon} ${title}\nAI分析により、以下の異常またはリスクが検知されました。至急状況を確認してください。`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": anomalies.join('\n')
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "詳細を確認する"
                        },
                        "url": dashboardUrl,
                        "style": "danger"
                    }
                ]
            }
        ];

        await sendSlackNotification(company.slack_webhook_url, text, blocks);
        console.log(`Anomaly alert notification sent for company ${companyId}`);

    } catch (error) {
        console.error("Failed to send anomaly alert notification:", error);
    }
}

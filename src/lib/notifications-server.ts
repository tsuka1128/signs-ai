import { createServerSupabaseClient as createClient } from "@/lib/supabase-server";
import { sendSlackNotification } from "./slack";
import { getBaseURL } from "@/lib/utils/index";
import { SLACK_MESSAGE_DEFAULTS } from "./slack-message-defaults";

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
        
        // 企業のWebhook URLとカスタム文面を取得
        const { data: company } = await supabase
            .from('companies')
            .select('slack_webhook_url, name, slack_msg_ai_summary')
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
        const customText = company.slack_msg_ai_summary || SLACK_MESSAGE_DEFAULTS.ai_summary;

        const text = `${mentions}\n${customText}`;
        const blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `${mentions}\n${customText}`
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

        // 5. 企業のWebhook URLとカスタム文面を取得
        const { data: company } = await supabase
            .from('companies')
            .select('slack_webhook_url, slack_msg_voice_check')
            .eq('id', companyId)
            .single();

        if (!company?.slack_webhook_url) return;

        // 6. 送信
        const mentions = finalTargets.map(t => `<@${t.slack_user_id}>`).join(' ');
        const surveyUrl = `${getBaseURL()}/check`;
        const customText = company.slack_msg_voice_check || SLACK_MESSAGE_DEFAULTS.voice_check;

        const text = `${mentions}\n${customText}`;
        const blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `${mentions}\n${customText}`
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
        const supabase = await createClient();
        const { data: company } = await supabase
            .from('companies')
            .select('slack_webhook_url, anomaly_threshold_absolute, anomaly_threshold_drop, anomaly_threshold_gap, slack_msg_anomaly_alert')
            .eq('id', companyId)
            .single();

        if (!company?.slack_webhook_url) return;

        // 閾値の設定（DBになければデフォルト値、または0の場合も考慮）
        const threshAbs = company.anomaly_threshold_absolute ?? 60;
        const threshDrop = company.anomaly_threshold_drop ?? 10;
        const threshGap = company.anomaly_threshold_gap ?? 20;

        const anomalies: string[] = [];

        // 条件A: スコア絶対値
        if (currentAvgPulse <= threshAbs) {
            anomalies.push(`・*全社平均スコアの低下*: ${currentAvgPulse.toFixed(1)}点（基準: ${threshAbs}点以下）`);
        }

        // 条件B: 前月比下落
        if (previousAvgPulse !== null && (previousAvgPulse - currentAvgPulse) >= threshDrop) {
            anomalies.push(`・*急激なスコア下落*: 前月比 -${(previousAvgPulse - currentAvgPulse).toFixed(1)}pt（基準: ${threshDrop}pt以上）`);
        }

        // 条件C: 部門スコア乖離
        const lowDepts = deptScores.filter(d => (currentAvgPulse - d.avgScore) >= threshGap);
        if (lowDepts.length > 0) {
            const names = lowDepts.map(d => `${d.deptName}(${d.avgScore.toFixed(1)}点)`).join(', ');
            anomalies.push(`・*部門間の大きな乖離*: 全社平均より${threshGap}pt以上低い部署があります（${names}）`);
        }

        // 条件D: AI危険フラグ
        if (riskLevel === 'high') {
            anomalies.push(`・*AIによるリスク検知*: ${riskReason || '組織に緊急対応が必要な兆候があります'}`);
        }

        // 1つも該当しなければ送信しない
        if (anomalies.length === 0) return;

        const targets = await getNotificationTargets(companyId, 'anomaly_alert');
        const mentions = targets.length > 0 ? targets.map(t => `<@${t.slack_user_id}>`).join(' ') : '';
        
        const isUrgent = riskLevel === 'high' || currentAvgPulse <= 50;
        const icon = isUrgent ? '⚠️' : '🚨';
        const title = isUrgent ? '*【緊急】組織異常検知アラート*' : '*組織異常検知アラート*';
        
        const dashboardUrl = `${getBaseURL()}/dashboard`;
        const customText = company.slack_msg_anomaly_alert || SLACK_MESSAGE_DEFAULTS.anomaly_alert;
        const text = `${mentions}\n${customText}\n\n${anomalies.join('\n')}`;

        const blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `${mentions}\n${icon} ${title}\n${customText}`
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

/**
 * KPI入力リマインドを送信する（前月分）
 */
export async function sendKpiReminders(companyId: string): Promise<void> {
    try {
        const supabase = await createClient();

        // 1. 前月の recorded_month を算出 (YYYY-MM-01)
        const now = new Date();
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

        // 2. 会社情報取得 (Webhook, カスタム文面)
        const { data: company } = await supabase
            .from('companies')
            .select('slack_webhook_url, slack_msg_kpi_reminder')
            .eq('id', companyId)
            .single();

        if (!company?.slack_webhook_url) return;

        // 3. KPI定義と実績取得
        const [kpiDefs, kpiRecs] = await Promise.all([
            supabase.from('kpi_definitions').select('*').eq('company_id', companyId).order('sort_order', { ascending: true }),
            supabase.from('kpi_records').select('kpi_definition_id').eq('company_id', companyId).eq('recorded_month', prevMonth)
        ]);

        if (!kpiDefs.data || kpiDefs.data.length === 0) return;

        // 4. 未入力KPIを特定
        const filledIds = new Set(kpiRecs.data?.map(r => r.kpi_definition_id) || []);
        const missingKpis = kpiDefs.data.filter(k => !filledIds.has(k.id));

        if (missingKpis.length === 0) return;

        // 5. 通知対象ユーザー（メンション）の収集
        const mentionUsers = new Set<string>();

        // 部署担当がある場合: 該当部署のマネージャーを取得
        const ownerDeptIds = Array.from(new Set(missingKpis.map(k => k.owner_dept_id).filter(Boolean))) as string[];
        if (ownerDeptIds.length > 0) {
            const { data: managers } = await supabase
                .from('users')
                .select('slack_user_id')
                .eq('company_id', companyId)
                .eq('role', 'manager')
                .in('department_id', ownerDeptIds);
            
            managers?.forEach(m => {
                if (m.slack_user_id) mentionUsers.add(`<@${m.slack_user_id}>`);
            });
        }

        // 担当部署がないKPIがある、または担当部署マネージャーがいない場合: admin/executiveを追加
        const hasKpiWithNoOwner = missingKpis.some(k => !k.owner_dept_id);
        if (hasKpiWithNoOwner || mentionUsers.size === 0) {
            const admins = await getNotificationTargets(companyId, 'kpi_reminder');
            admins.forEach(a => {
                if (a.slack_user_id) mentionUsers.add(`<@${a.slack_user_id}>`);
            });
        }

        const mentions = Array.from(mentionUsers).join(' ');

        // 6. メッセージ構築
        const kpiList = missingKpis.slice(0, 5).map(k => `・${k.name}`);
        if (missingKpis.length > 5) {
            kpiList.push(`他${missingKpis.length - 5}件`);
        }

        const customText = company.slack_msg_kpi_reminder || SLACK_MESSAGE_DEFAULTS.kpi_reminder;

        const blocks = [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `${mentions}\n${customText}`
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: kpiList.join('\n')
                }
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `対象月: ${lastMonthDate.getFullYear()}年${lastMonthDate.getMonth() + 1}月`
                    }
                ]
            }
        ];

        await sendSlackNotification(company.slack_webhook_url, "", blocks);

    } catch (error: any) {
        console.error("[sendKpiReminders Error]:", error);
    }
}

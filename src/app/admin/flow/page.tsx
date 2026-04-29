"use client";

import { useState, useCallback } from "react";

const CSS = `
  .flow-root {
    --teal-50: #E1F5EE; --teal-400: #1D9E75; --teal-600: #0F6E56; --teal-800: #085041;
    --purple-50: #EEEDFE; --purple-400: #7F77DD; --purple-600: #534AB7; --purple-800: #3C3489;
    --coral-50: #FAECE7; --coral-400: #D85A30; --coral-600: #993C1D; --coral-800: #712B13;
    --amber-50: #FAEEDA; --amber-400: #BA7517; --amber-600: #854F0B; --amber-800: #633806;
    --blue-50: #E6F1FB; --blue-400: #378ADD; --blue-600: #185FA5; --blue-800: #0C447C;
    --green-50: #EAF3DE; --green-400: #639922; --green-600: #3B6D11; --green-800: #27500A;
    --gray-50: #F1EFE8; --gray-400: #888780; --gray-600: #5F5E5A; --gray-800: #444441;
    --bg: #ffffff; --bg2: #f8f7f4;
    --text: #1a1a18; --text2: #5f5e5a; --text3: #9c9a92;
    --border: rgba(0,0,0,0.10); --border2: rgba(0,0,0,0.18);
  }
  @media (prefers-color-scheme: dark) {
    .flow-root {
      --teal-50: #085041; --teal-400: #5DCAA5; --teal-600: #9FE1CB; --teal-800: #E1F5EE;
      --purple-50: #3C3489; --purple-400: #AFA9EC; --purple-600: #CECBF6; --purple-800: #EEEDFE;
      --coral-50: #712B13; --coral-400: #F0997B; --coral-600: #F5C4B3; --coral-800: #FAECE7;
      --amber-50: #633806; --amber-400: #EF9F27; --amber-600: #FAC775; --amber-800: #FAEEDA;
      --blue-50: #0C447C; --blue-400: #85B7EB; --blue-600: #B5D4F4; --blue-800: #E6F1FB;
      --green-50: #27500A; --green-400: #97C459; --green-600: #C0DD97; --green-800: #EAF3DE;
      --gray-50: #444441; --gray-400: #B4B2A9; --gray-600: #D3D1C7; --gray-800: #F1EFE8;
      --bg: #1c1b18; --bg2: #242320; --text: #e8e6de; --text2: #b4b2a9; --text3: #6e6d67;
      --border: rgba(255,255,255,0.10); --border2: rgba(255,255,255,0.18);
    }
  }
  .flow-root { background: var(--bg); color: var(--text); font-size: 13px; line-height: 1.6; }
  .flow-page { display: flex; gap: 0; min-height: 100vh; }

  /* サイドパネル */
  .flow-panel {
    width: 320px; min-width: 320px;
    background: var(--bg2); border-right: 0.5px solid var(--border2);
    padding: 24px 20px; display: flex; flex-direction: column; gap: 16px;
    position: sticky; top: 0; height: 100vh; overflow-y: auto;
  }
  .flow-panel-title {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text3);
    padding-bottom: 12px; border-bottom: 0.5px solid var(--border);
  }
  .flow-panel-empty { color: var(--text3); font-size: 12px; text-align: center; padding: 40px 0; }
  .flow-panel-content { display: none; flex-direction: column; gap: 12px; }
  .flow-panel-content.active { display: flex; }
  .flow-panel-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; width: fit-content;
  }
  .flow-panel-heading { font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.4; }
  .flow-panel-body { font-size: 12px; color: var(--text2); line-height: 1.8; }
  .flow-panel-code {
    background: var(--bg); border: 0.5px solid var(--border2); border-radius: 6px;
    padding: 10px 12px; font-family: 'Fira Code', monospace;
    font-size: 11px; color: var(--text2); word-break: break-all;
  }
  .flow-panel-fields { display: flex; flex-wrap: wrap; gap: 6px; }
  .flow-field-tag {
    font-size: 11px; padding: 3px 8px; border-radius: 4px;
    background: var(--bg); border: 0.5px solid var(--border2); color: var(--text2); font-family: monospace;
  }
  .flow-panel-note {
    font-size: 11px; color: var(--text3); padding: 8px 10px;
    border-left: 2px solid var(--border2); line-height: 1.7;
  }

  /* メイン図 */
  .flow-main { flex: 1; padding: 24px 20px; overflow-x: auto; }
  .flow-diagram-title { font-size: 13px; font-weight: 700; color: var(--text2); margin-bottom: 20px; letter-spacing: 0.04em; }

  /* ステップ */
  .flow-step { margin-bottom: 6px; }
  .flow-step-header {
    display: flex; align-items: center; gap: 8px; padding: 7px 12px;
    border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 6px;
  }
  .flow-step-num {
    font-size: 10px; width: 18px; height: 18px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0;
  }
  .flow-nodes { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 0 0 8px; }
  .flow-node {
    display: flex; flex-direction: column; padding: 8px 12px; border-radius: 8px;
    border: 0.5px solid transparent; cursor: pointer; transition: opacity 0.15s, transform 0.1s;
    min-width: 110px; position: relative;
  }
  .flow-node:hover { opacity: 0.82; transform: translateY(-1px); }
  .flow-node:active { transform: scale(0.97); }
  .flow-node.selected { box-shadow: 0 0 0 2px var(--text); }
  .flow-node-title { font-size: 12px; font-weight: 700; line-height: 1.3; }
  .flow-node-sub { font-size: 10px; opacity: 0.75; margin-top: 2px; line-height: 1.4; }

  /* ノードカラー */
  .n-teal   { background: var(--teal-50);   border-color: var(--teal-400);   color: var(--teal-800); }
  .n-purple { background: var(--purple-50); border-color: var(--purple-400); color: var(--purple-800); }
  .n-coral  { background: var(--coral-50);  border-color: var(--coral-400);  color: var(--coral-800); }
  .n-amber  { background: var(--amber-50);  border-color: var(--amber-400);  color: var(--amber-800); }
  .n-blue   { background: var(--blue-50);   border-color: var(--blue-400);   color: var(--blue-800); }
  .n-green  { background: var(--green-50);  border-color: var(--green-400);  color: var(--green-800); }
  .n-gray   { background: var(--gray-50);   border-color: var(--gray-400);   color: var(--gray-800); }

  /* ステップヘッダーカラー */
  .s-teal   { background: var(--teal-50);   color: var(--teal-800); }
  .s-green  { background: var(--green-50);  color: var(--green-800); }
  .s-coral  { background: var(--coral-50);  color: var(--coral-800); }
  .s-amber  { background: var(--amber-50);  color: var(--amber-800); }

  /* ステップ番号バッジ */
  .sn-teal   { background: var(--teal-400);   color: var(--teal-50); }
  .sn-green  { background: var(--green-400);  color: var(--green-50); }
  .sn-coral  { background: var(--coral-400);  color: var(--coral-50); }
  .sn-amber  { background: var(--amber-400);  color: var(--amber-50); }

  /* パネルバッジカラー */
  .pb-teal   { background: var(--teal-50);   color: var(--teal-800); }
  .pb-purple { background: var(--purple-50); color: var(--purple-800); }
  .pb-coral  { background: var(--coral-50);  color: var(--coral-800); }
  .pb-amber  { background: var(--amber-50);  color: var(--amber-800); }
  .pb-blue   { background: var(--blue-50);   color: var(--blue-800); }
  .pb-green  { background: var(--green-50);  color: var(--green-800); }
  .pb-gray   { background: var(--gray-50);   color: var(--gray-800); }

  /* 矢印 */
  .flow-arrow-line { width: 1px; height: 20px; background: var(--border2); margin-left: 20px; }
  .flow-arrow-dot {
    width: 6px; height: 6px; border-right: 1.5px solid var(--text3); border-bottom: 1.5px solid var(--text3);
    transform: rotate(45deg); margin-left: 17px; margin-top: -4px; margin-bottom: 4px;
  }
  .flow-loop-note {
    margin-top: 8px; padding: 8px 14px; border: 0.5px dashed var(--border2);
    border-radius: 6px; font-size: 11px; color: var(--text3); text-align: center;
  }

  /* 凡例 */
  .flow-legend {
    display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px;
    padding-top: 12px; border-top: 0.5px solid var(--border);
  }
  .flow-leg-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text2); }
  .flow-leg-dot { width: 8px; height: 8px; border-radius: 2px; }

  @media (max-width: 700px) {
    .flow-page { flex-direction: column; }
    .flow-panel { width: 100%; min-width: unset; border-right: none; border-bottom: 0.5px solid var(--border2); position: static; height: auto; }
  }
`;

type PanelContent = {
    badge: { label: string; color: string };
    heading: string;
    fields?: string[];
    body: string;
    code?: string;
    note?: string;
    extraBody?: string;
    extraFields?: string[];
};

const PANELS: Record<string, PanelContent> = {
    company: {
        badge: { label: "テナント基盤", color: "pb-teal" },
        heading: "Company",
        fields: ["id", "plan_id", "name", "status", "slack_webhook_url"],
        body: "テナントの最上位オブジェクト。plan_id で契約プランと紐づき、status が active でないと各機能が動作しない。Slack 通知先 Webhook URL もここに保持する。",
        note: "初回セットアップ時に admin が作成。以降は変更のみ。",
    },
    department: {
        badge: { label: "テナント基盤", color: "pb-teal" },
        heading: "Department",
        fields: ["id", "company_id", "name", "headcount", "sort_order"],
        body: "部署単位のオブジェクト。KpiRecord・ResourceRecord・SurveyResponse はすべてこの department_id を外部キーとして持つ。manager の RLS スコープもこの ID を基準にフィルタされる。",
    },
    kpidef: {
        badge: { label: "業績・KPI", color: "pb-purple" },
        heading: "KpiDefinition",
        fields: ["id", "company_id", "owner_dept_id", "name", "unit", "target"],
        body: "KPI の「型定義」。owner_dept_id で担当部署を指定する。manager はこの owner_dept_id が自分の部署と一致するものだけ参照可能（RLS: manager_own_dept_kpi_definitions）。",
    },
    semantic: {
        badge: { label: "サーベイ・方針", color: "pb-coral" },
        heading: "SemanticLayer",
        fields: ["id", "company_id", "content", "valid_from"],
        body: "AI に渡す「会社固有の文脈」テキスト。組織方針・戦略・用語定義などを自由記述で保存する。AI 分析時にシステムプロンプトへ注入されるため、分析の解釈精度に直接影響する。",
        note: "⑥ Executive がアクション確定後、翌月方針を反映して更新するのが理想サイクル。",
    },
    invitation: {
        badge: { label: "管理系", color: "pb-gray" },
        heading: "Invitation",
        fields: ["email", "role", "token", "status", "expires_at"],
        body: "メンバー招待トークン。role に admin / manager / player / executive / partner を指定。有効期限 7 日。受諾されると User レコードが作成される。",
        code: "CHECK (role IN ('admin','manager','player','partner'))",
    },
    kpirec: {
        badge: { label: "業績・KPI", color: "pb-purple" },
        heading: "KpiRecord",
        fields: ["kpi_definition_id", "department_id", "value", "target_value", "recorded_month"],
        body: "月次の KPI 実績値。manager は自部署分のみ ALL 操作可（RLS: manager_own_dept_kpi_records）。AI 分析時に直近 N ヶ月分が時系列コンテキストとして渡される。",
        note: "未入力月があると AI の時系列分析精度が下がるため、月次入力を徹底すること。",
    },
    resource: {
        badge: { label: "業績・KPI", color: "pb-purple" },
        heading: "ResourceRecord",
        fields: ["department_id", "head_count", "labor_cost", "recorded_month"],
        body: "人数・人件費の月次スナップショット。AI は labor_cost と KPI 売上から「人件費 ROI」を算出し、マトリックス分析に利用する。manager は自部署分のみ ALL 操作可。",
    },
    "slack-remind": {
        badge: { label: "通知", color: "pb-gray" },
        heading: "Slack 通知受信（voice_check_reminder）",
        body: "毎月スケジュール実行される sendVoiceCheckReminders() から、未回答の player へ Slack DM が送信される。\n\n送信条件：\n① User.slack_user_id が設定済み\n② NotificationSetting.slack_enabled = true（または設定なし = デフォルト有効）\n③ 当月の SurveyResponse がまだ存在しない",
    },
    surveyres: {
        badge: { label: "サーベイ", color: "pb-coral" },
        heading: "SurveyResponse",
        fields: ["user_id", "department_id", "recorded_month", "pulse"],
        body: "1 回の回答セッション全体を表すヘッダーレコード。pulse は 11 問の平均スコア（0〜100）で、AI が「組織体温」として扱う主要指標。匿名 URL 回答の場合は user_id が null。",
    },
    surveyanswer: {
        badge: { label: "サーベイ", color: "pb-coral" },
        heading: "SurveyAnswer × 11",
        fields: ["survey_response_id", "question_no", "score"],
        body: "SurveyResponse 1 件につき 11 問分の回答レコードが生成される。各 score は 1〜5 の整数。AI は設問カテゴリ別（エンゲージメント・関係性・成長感など）に集計してインサイトを生成する。",
    },
    aiinsight: {
        badge: { label: "AI 分析", color: "pb-amber" },
        heading: "AiInsight",
        fields: ["company_id", "target_month", "insight_type", "content (JSON)", "model_used"],
        body: "content フィールドに以下の JSON が格納される：\n• summary（140 字）\n• deep_report（5 観点）\n• insights_by_dept（部署別メッセージ）\n• voice_topics（フリコメ抽出）\n• suggested_actions（→ ActionItem に変換）",
        code: "upsert on (company_id, target_month, insight_type)",
    },
    actionitem: {
        badge: { label: "アクション", color: "pb-blue" },
        heading: "ActionItem",
        fields: ["company_id", "department_id", "title", "priority", "status", "is_ai_generated"],
        body: "AI が自動生成（is_ai_generated: true）するもの と、admin / executive が手動追加するものの両方を管理。status が completed / rejected になると自動アーカイブ。翌月の AI 分析では「実行中のアクション」としてコンテキストに含まれる。",
        note: "priority: urgent / high / normal の 3 段階。",
    },
    "admin-review": {
        badge: { label: "Admin", color: "pb-teal" },
        heading: "Admin — 分析レビュー",
        body: "AI 分析完了後、ai_analysis_done 通知（targetRole: admin）でアプリ内通知が届く。Deep Report（全社 5 観点分析）を確認し、ActionItem の priority 調整や手動追加を行う。全操作は AdminActivityLog に自動記録される。",
        note: "ai_summary 通知（Slack）も admin が受信するロールに含まれる。",
    },
    "exec-action": {
        badge: { label: "Executive", color: "pb-amber" },
        heading: "Executive — アクション承認",
        body: "AiInsight を executive スコープで参照。全社 KpiRecord・ResourceRecord・SurveyResponse を横断的に確認し、ActionItem を承認または新規作成する。\n\nこの段階で SemanticLayer を更新すると、翌月の AI 分析に新しい組織方針が反映される。",
    },
    "exec-semantic": {
        badge: { label: "サーベイ・方針", color: "pb-coral" },
        heading: "SemanticLayer 更新（翌月方針）",
        body: "アクション確定後、次月に向けた組織方針・重点テーマを SemanticLayer に記入する。更新保存時に Slack の各部署へ方針通知（/api/notifications/slack/policy）を送ることもできる。",
    },
    "notify-create": {
        badge: { label: "通知", color: "pb-green" },
        heading: "Notification 作成（manager 宛・部署別）",
        body: "analyze API 完了後、createNotification() が depts.data をループして部署ごとに manager 宛の通知レコードを作成する。\n\ntargetRole: \"manager\"\ntargetDepartmentId: dept.id\n\nこれによりアプリ内通知として各 manager に届く。",
    },
    "notify-setting": {
        badge: { label: "通知設定", color: "pb-gray" },
        heading: "NotificationSetting — slack_enabled チェック",
        body: "Slack DM 送信前に notification_settings テーブルを参照し slack_enabled を確認。\n\n• レコードあり → slack_enabled の値に従う\n• レコードなし → デフォルト有効（true）として送信\n\n加えて User.slack_user_id が null の場合はスキップ（ログに記録）。",
        code: "skipped: no slack_user_id set.",
    },
    "slack-dm": {
        badge: { label: "通知・Slack", color: "pb-green" },
        heading: "Slack DM 送信（voice_check_progress）",
        body: "manager が Slack DM を受け取るのは主に voice_check_progress（回答進捗）通知。\n\n送信 3 条件：\n① Company.slack_webhook_url が https://hooks.slack.com/ で始まる\n② User.slack_user_id が設定済み\n③ NotificationSetting.slack_enabled = true（or 設定なし）",
        note: "ai_analysis_done はアプリ内通知のみ。Slack メンションは ai_summary（admin/executive 宛）が担う。",
    },
    "slack-kpi-request": {
        badge: { label: "通知・Slack", color: "pb-green" },
        heading: "Slack KPI入力依頼",
        body: "sendKpiReminders() が前月分の未入力 KPI を検出し、担当 manager へ Slack DM で入力を依頼する。\n\n送信条件：\n① Company.slack_webhook_url が設定済み\n② 前月の KpiRecord が未入力の KpiDefinition が存在する\n③ User.slack_user_id が設定済み（kpi_reminder ロール対象）",
        code: "notification_type: 'kpi_reminder'",
        note: "自動スケジュール（月初）または admin 手動で発火。未入力 KPI 名がメッセージ本文に列挙される。",
    },
    "slack-admin-done": {
        badge: { label: "通知・Slack", color: "pb-green" },
        heading: "Slack 完了報告（ai_summary）",
        body: "AI 分析完了 → Admin レビュー完了のタイミングで sendAiSummaryNotification() が実行され、executive・admin へ Slack 通知が送られる。\n\n対象ロール：['admin', 'executive', 'super_admin']\n\nメッセージにはダッシュボードへのボタン付きリンクが含まれ、executive が⑥のアクション確認に進むトリガーとなる。",
        code: "notification_type: 'ai_summary'",
        note: "Slack メッセージ文面は Company.slack_msg_ai_summary でカスタマイズ可能。未設定時はデフォルト文面を使用。",
    },
    "survey-setup": {
        badge: { label: "サーベイ設定", color: "pb-coral" },
        heading: "Survey 設定（カスタム設問）",
        body: "標準11問に加えて、会社固有のオリジナル設問を最大3問まで追加できる。\n\n設定画面：設定 → ボイスチェック → カスタム設問\n\n各設問には以下を設定する：",
        fields: ["question_text", "hint（任意）", "category", "sort_order"],
        extraBody: "追加した設問は固定11問の後に表示され、同じ1〜5スコアで回答される。AI分析時にはカスタム設問のスコアも SurveyAnswer として集計対象に含まれる。",
        note: "現在の survey_questions テーブルはグローバルマスター。カスタム設問は company_id を持つ別テーブル（例：custom_survey_questions）として追加予定。",
    },
    "action-confirm": {
        badge: { label: "アクション", color: "pb-blue" },
        heading: "ActionItem 確認（自部署）",
        body: "manager は department_id = get_my_department_id() の RLS により、自部署に紐づく ActionItem のみ SELECT 可能。priority・status を確認して翌月の KpiRecord 入力に向けた準備を行う。",
        note: "manager は ActionItem の作成・編集は不可。閲覧のみ。",
    },
};

function Node({ nodeKey, panelId, color, title, sub, selectedKey, onSelect }: {
    nodeKey: string; panelId: string; color: string; title: string; sub: string;
    selectedKey: string | null; onSelect: (nodeKey: string, panelId: string) => void;
}) {
    return (
        <div
            className={`flow-node ${color}${selectedKey === nodeKey ? " selected" : ""}`}
            onClick={() => onSelect(nodeKey, panelId)}
        >
            <span className="flow-node-title">{title}</span>
            <span className="flow-node-sub">{sub}</span>
        </div>
    );
}

export default function AdminFlowPage() {
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [activePanelId, setActivePanelId] = useState<string | null>(null);

    const handleSelect = useCallback((nodeKey: string, panelId: string) => {
        setSelectedKey(prev => {
            if (prev === nodeKey) { setActivePanelId(null); return null; }
            setActivePanelId(panelId);
            return nodeKey;
        });
    }, []);

    const panel = activePanelId ? PANELS[activePanelId] : null;

    return (
        <div className="flow-root">
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="flow-page">

                {/* サイドパネル */}
                <aside className="flow-panel">
                    <div className="flow-panel-title">詳細パネル</div>
                    {!panel ? (
                        <div className="flow-panel-empty">
                            ノードをクリックすると<br />解説が表示されます
                        </div>
                    ) : (
                        <div className="flow-panel-content active">
                            <span className={`flow-panel-badge ${panel.badge.color}`}>{panel.badge.label}</span>
                            <div className="flow-panel-heading">{panel.heading}</div>
                            {panel.fields && (
                                <div className="flow-panel-fields">
                                    {panel.fields.map(f => (
                                        <span key={f} className="flow-field-tag">{f}</span>
                                    ))}
                                </div>
                            )}
                            <div className="flow-panel-body" style={{ whiteSpace: "pre-line" }}>{panel.body}</div>
                            {panel.extraFields && (
                                <div className="flow-panel-fields">
                                    {panel.extraFields.map(f => (
                                        <span key={f} className="flow-field-tag">{f}</span>
                                    ))}
                                </div>
                            )}
                            {panel.extraBody && (
                                <div className="flow-panel-body">{panel.extraBody}</div>
                            )}
                            {panel.code && (
                                <div className="flow-panel-code">{panel.code}</div>
                            )}
                            {panel.note && (
                                <div className="flow-panel-note">{panel.note}</div>
                            )}
                        </div>
                    )}
                </aside>

                {/* メイン図 */}
                <main className="flow-main">
                    <div className="flow-diagram-title">SignsAI — 月次オペレーションサイクル</div>

                    {/* ① Admin セットアップ */}
                    <div className="flow-step">
                        <div className="flow-step-header s-teal">
                            <span className="flow-step-num sn-teal">①</span>
                            Admin — 初回セットアップ
                        </div>
                        <div className="flow-nodes">
                            <Node nodeKey="s1_company"      panelId="company"      color="n-teal"   title="Company"        sub="plan_id / status"                           selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s1_department"   panelId="department"   color="n-teal"   title="Department"     sub="headcount"                                  selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s1_kpidef"       panelId="kpidef"       color="n-purple" title="KpiDefinition"  sub="name / unit"                                selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s1_semantic"     panelId="semantic"     color="n-coral"  title="SemanticLayer"  sub="会社方針・文脈"                               selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s1_survey-setup" panelId="survey-setup" color="n-coral"  title="Survey 設定"    sub="カスタム設問 × 3"                            selectedKey={selectedKey} onSelect={handleSelect} />
                            <div style={{ width: "100%", maxWidth: 360 }}>
                                <Node nodeKey="s1_invitation" panelId="invitation" color="n-gray"   title="Invitation 送信" sub="role: manager / player / executive を招待"  selectedKey={selectedKey} onSelect={handleSelect} />
                            </div>
                        </div>
                    </div>

                    <div className="flow-arrow-line" />
                    <div className="flow-arrow-dot" />

                    {/* ② Manager KPI入力 */}
                    <div className="flow-step">
                        <div className="flow-step-header s-green">
                            <span className="flow-step-num sn-green">②</span>
                            Manager — 月次KPI・リソース入力（自部署スコープ）
                        </div>
                        <div className="flow-nodes">
                            <Node nodeKey="s2_kpirec"           panelId="kpirec"           color="n-purple" title="KpiRecord 入力"     sub="value / target / month（自部署のみ）"  selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s2_resource"         panelId="resource"         color="n-purple" title="ResourceRecord 入力" sub="head_count / labor_cost（自部署のみ）" selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s2_slack-kpi-request" panelId="slack-kpi-request" color="n-green" title="Slack KPI入力依頼"  sub="kpi_reminder → manager"               selectedKey={selectedKey} onSelect={handleSelect} />
                        </div>
                    </div>

                    <div className="flow-arrow-line" />
                    <div className="flow-arrow-dot" />

                    {/* ③ Player ボイスチェック */}
                    <div className="flow-step">
                        <div className="flow-step-header s-coral">
                            <span className="flow-step-num sn-coral">③</span>
                            Player — ボイスチェック回答
                        </div>
                        <div className="flow-nodes">
                            <Node nodeKey="s3_slack-remind" panelId="slack-remind" color="n-gray"  title="Slack 通知受信"    sub="voice_check_reminder"   selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s3_surveyres"    panelId="surveyres"    color="n-coral" title="SurveyResponse"    sub="recorded_month / pulse" selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s3_surveyanswer" panelId="surveyanswer" color="n-coral" title="SurveyAnswer × 11" sub="question_no / score"    selectedKey={selectedKey} onSelect={handleSelect} />
                        </div>
                    </div>

                    <div className="flow-arrow-line" />
                    <div className="flow-arrow-dot" />

                    {/* ④ AI分析 */}
                    <div className="flow-step">
                        <div className="flow-step-header s-amber">
                            <span className="flow-step-num sn-amber">④</span>
                            SignsAI — AI分析実行（Admin手動 or 自動スケジュール）
                        </div>
                        <div className="flow-nodes">
                            <Node nodeKey="s4_kpirec"    panelId="kpirec"    color="n-purple" title="KpiRecord"      sub="業績データ"   selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s4_resource"  panelId="resource"  color="n-purple" title="ResourceRecord" sub="人件費ROI"    selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s4_surveyres" panelId="surveyres" color="n-coral"  title="SurveyResponse" sub="組織体温"     selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s4_semantic"  panelId="semantic"  color="n-coral"  title="SemanticLayer"  sub="組織方針文脈" selectedKey={selectedKey} onSelect={handleSelect} />
                        </div>
                        <div style={{ padding: "6px 0 0 8px" }}>
                            <div className="flow-nodes">
                                <div style={{ minWidth: 200 }}>
                                    <Node nodeKey="s4_aiinsight"  panelId="aiinsight"  color="n-amber" title="AiInsight 生成・保存" sub="summary / deep_report / insights_by_dept" selectedKey={selectedKey} onSelect={handleSelect} />
                                </div>
                                <div style={{ minWidth: 180 }}>
                                    <Node nodeKey="s4_actionitem" panelId="actionitem" color="n-blue"  title="ActionItem 自動生成"  sub="is_ai_generated: true / dept別"           selectedKey={selectedKey} onSelect={handleSelect} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flow-arrow-line" />
                    <div className="flow-arrow-dot" />

                    {/* ⑤ Admin 分析レビュー */}
                    <div className="flow-step">
                        <div className="flow-step-header s-teal">
                            <span className="flow-step-num sn-teal">⑤</span>
                            Admin — 分析レビュー &amp; ai_summary 通知確認
                        </div>
                        <div className="flow-nodes">
                            <Node nodeKey="s5_aiinsight"        panelId="aiinsight"        color="n-amber" title="AiInsight 閲覧"       sub="Deep Report 全社分析"     selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s5_admin-review-act" panelId="admin-review"     color="n-blue"  title="ActionItem 確認・編集" sub="priority 調整 / 手動追加" selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s5_admin-review-log" panelId="admin-review"     color="n-gray"  title="AdminActivityLog"     sub="操作ログ自動記録"          selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s5_slack-admin-done" panelId="slack-admin-done" color="n-green" title="Slack 完了報告"        sub="ai_summary → executive"   selectedKey={selectedKey} onSelect={handleSelect} />
                        </div>
                    </div>

                    <div className="flow-arrow-line" />
                    <div className="flow-arrow-dot" />

                    {/* ⑥ Executive */}
                    <div className="flow-step">
                        <div className="flow-step-header s-amber">
                            <span className="flow-step-num sn-amber">⑥</span>
                            Executive — アクション承認 &amp; 組織方向性決定
                        </div>
                        <div className="flow-nodes">
                            <Node nodeKey="s6_exec-action-ai"   panelId="exec-action"   color="n-amber" title="AiInsight 閲覧"       sub="executive スコープ"        selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s6_exec-action-item" panelId="exec-action"   color="n-blue"  title="ActionItem 承認・作成" sub="priority: urgent / high"  selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s6_exec-semantic"    panelId="exec-semantic" color="n-coral" title="SemanticLayer 更新"   sub="次月方針を反映"             selectedKey={selectedKey} onSelect={handleSelect} />
                        </div>
                    </div>

                    <div className="flow-arrow-line" />
                    <div className="flow-arrow-dot" />

                    {/* ⑦ Manager 通知 */}
                    <div className="flow-step">
                        <div className="flow-step-header s-green">
                            <span className="flow-step-num sn-green">⑦</span>
                            Manager — ai_analysis_done 通知受信 &amp; 自部署アクション確認
                        </div>
                        <div className="flow-nodes">
                            <Node nodeKey="s7_notify-create-api"    panelId="notify-create"  color="n-amber" title="analyze API 完了"    sub="createNotification(manager)"  selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s7_notify-create-record" panelId="notify-create"  color="n-gray"  title="Notification 作成"   sub="targetRole: manager / dept別"  selectedKey={selectedKey} onSelect={handleSelect} />
                            <Node nodeKey="s7_notify-setting"       panelId="notify-setting" color="n-gray"  title="NotificationSetting" sub="slack_enabled チェック"        selectedKey={selectedKey} onSelect={handleSelect} />
                        </div>
                        <div style={{ padding: "6px 0 0 8px" }}>
                            <div className="flow-nodes">
                                <Node nodeKey="s7_slack-dm"       panelId="slack-dm"       color="n-green" title="Slack DM 送信"           sub="User.slack_user_id が必須"   selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s7_action-confirm" panelId="action-confirm" color="n-blue"  title="ActionItem 確認（自部署）" sub="dept_id = 自部署のみ SELECT" selectedKey={selectedKey} onSelect={handleSelect} />
                            </div>
                        </div>
                    </div>

                    <div className="flow-loop-note">↻ manager が KpiRecord を更新 → 翌月 ② へ戻る</div>

                    {/* 凡例 */}
                    <div className="flow-legend">
                        {[
                            { color: "#1D9E75", label: "テナント基盤" },
                            { color: "#7F77DD", label: "業績・KPI" },
                            { color: "#D85A30", label: "サーベイ・方針" },
                            { color: "#BA7517", label: "AI分析" },
                            { color: "#378ADD", label: "アクション" },
                            { color: "#639922", label: "通知・Slack" },
                            { color: "#888780", label: "管理系" },
                        ].map(item => (
                            <div key={item.label} className="flow-leg-item">
                                <div className="flow-leg-dot" style={{ background: item.color }} />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}

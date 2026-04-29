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
    background: var(--bg); color: var(--text);
    font-size: 13px; line-height: 1.6;
  }
  .flow-page { display: flex; gap: 0; min-height: 70vh; }

  /* サイドパネル */
  .flow-panel {
    width: 320px; min-width: 320px;
    background: var(--bg2); border-right: 0.5px solid var(--border2);
    padding: 24px 20px; display: flex; flex-direction: column; gap: 16px;
    position: sticky; top: 20px; height: fit-content; max-height: calc(100vh - 40px); overflow-y: auto;
    border-radius: 16px;
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
  .flow-panel-note {
    font-size: 11px; color: var(--text3); padding: 8px 10px;
    border-left: 2px solid var(--border2); line-height: 1.7;
    background: rgba(0,0,0,0.02); border-radius: 4px;
  }

  /* メイン図 */
  .flow-main { flex: 1; padding: 24px 20px; overflow-x: auto; min-width: 0; }
  .flow-diagram-title {
    font-size: 13px; font-weight: 700; color: var(--text2);
    margin-bottom: 20px; letter-spacing: 0.04em;
  }

  /* ステップ */
  .flow-step { margin-bottom: 6px; }
  .flow-step-header {
    display: flex; align-items: center; gap: 8px; padding: 8px 14px;
    border-radius: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 6px;
  }
  .flow-step-num {
    font-size: 10px; width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0;
  }
  .flow-nodes { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 0 0 8px; }
  .flow-node {
    display: flex; flex-direction: column; padding: 9px 13px; border-radius: 8px;
    border: 0.5px solid transparent; cursor: pointer; transition: opacity 0.15s, transform 0.1s;
    min-width: 130px; position: relative;
  }
  .flow-node:hover { opacity: 0.82; transform: translateY(-1px); }
  .flow-node:active { transform: scale(0.97); }
  .flow-node.selected { box-shadow: 0 0 0 2px var(--text); }
  .flow-node-title { font-size: 12px; font-weight: 700; line-height: 1.3; }
  .flow-node-sub { font-size: 10px; opacity: 0.75; margin-top: 2px; line-height: 1.4; }

  .n-teal   { background: var(--teal-50);   border-color: var(--teal-400);   color: var(--teal-800); }
  .n-purple { background: var(--purple-50); border-color: var(--purple-400); color: var(--purple-800); }
  .n-coral  { background: var(--coral-50);  border-color: var(--coral-400);  color: var(--coral-800); }
  .n-amber  { background: var(--amber-50);  border-color: var(--amber-400);  color: var(--amber-800); }
  .n-blue   { background: var(--blue-50);   border-color: var(--blue-400);   color: var(--blue-800); }
  .n-green  { background: var(--green-50);  border-color: var(--green-400);  color: var(--green-800); }
  .n-gray   { background: var(--gray-50);   border-color: var(--gray-400);   color: var(--gray-800); }

  .s-teal   { background: var(--teal-50);   color: var(--teal-800); }
  .s-green  { background: var(--green-50);  color: var(--green-800); }
  .s-coral  { background: var(--coral-50);  color: var(--coral-800); }
  .s-amber  { background: var(--amber-50);  color: var(--amber-800); }

  .sn-teal   { background: var(--teal-400);   color: var(--teal-50); }
  .sn-green  { background: var(--green-400);  color: var(--green-50); }
  .sn-coral  { background: var(--coral-400);  color: var(--coral-50); }
  .sn-amber  { background: var(--amber-400);  color: var(--amber-50); }

  .pb-teal   { background: var(--teal-50);   color: var(--teal-800); }
  .pb-purple { background: var(--purple-50); color: var(--purple-800); }
  .pb-coral  { background: var(--coral-50);  color: var(--coral-800); }
  .pb-amber  { background: var(--amber-50);  color: var(--amber-800); }
  .pb-blue   { background: var(--blue-50);   color: var(--blue-800); }
  .pb-green  { background: var(--green-50);  color: var(--green-800); }
  .pb-gray   { background: var(--gray-50);   color: var(--gray-800); }

  .flow-arrow-line { width: 1px; height: 20px; background: var(--border2); margin-left: 20px; }
  .flow-arrow-dot {
    width: 6px; height: 6px; border-right: 1.5px solid var(--text3); border-bottom: 1.5px solid var(--text3);
    transform: rotate(45deg); margin-left: 17px; margin-top: -4px; margin-bottom: 4px;
  }
  .flow-loop-note {
    margin-top: 8px; padding: 10px 14px; border: 0.5px dashed var(--border2);
    border-radius: 6px; font-size: 11px; color: var(--text3); text-align: center;
  }

  .flow-legend {
    display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px;
    padding-top: 12px; border-top: 0.5px solid var(--border);
  }
  .flow-leg-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text2); }
  .flow-leg-dot { width: 8px; height: 8px; border-radius: 2px; }

  @media (max-width: 900px) {
    .flow-page { flex-direction: column; }
    .flow-panel { width: 100%; min-width: unset; border-right: none; position: static; max-height: none; }
  }
`;

type PanelContent = {
    badge: { label: string; color: string };
    heading: string;
    body: string;
    note?: string;
};

const PANELS: Record<string, PanelContent> = {
    company: {
        badge: { label: "会社情報", color: "pb-teal" },
        heading: "会社情報の登録",
        body: "Signs AI を使う会社の基本情報を登録します。最初のセットアップで管理者が入力。Slack 通知を送るための連携設定もここで行います。",
        note: "初回のみ登録。あとで会社名や Slack 設定を変更したいときも、ここから編集します。",
    },
    department: {
        badge: { label: "部署", color: "pb-teal" },
        heading: "部署の登録",
        body: "会社の中の部署を登録します。KPI 入力・ボイスチェック回答・人件費入力は、すべて「どの部署のデータか」が紐付きます。マネージャーは自分の部署のデータだけを編集できます。",
    },
    kpidef: {
        badge: { label: "KPI", color: "pb-purple" },
        heading: "KPI 項目の設定",
        body: "会社で測りたい KPI 項目を定義します（例：売上、新規契約数、解約率）。各 KPI には担当部署を指定し、その部署のマネージャーだけが入力できます。",
    },
    semantic: {
        badge: { label: "組織方針", color: "pb-coral" },
        heading: "組織方針の登録",
        body: "会社が大事にしている価値観・戦略・専門用語を文章で登録します。AI が組織を分析するときに「この会社らしさ」を理解するための材料になります。",
        note: "経営者がアクションを承認したあと、来月に向けて組織方針を更新するのが理想のサイクルです。",
    },
    invitation: {
        badge: { label: "メンバー招待", color: "pb-gray" },
        heading: "メンバーの招待",
        body: "メールアドレスを指定してメンバーを Signs AI に招待します。招待時にロール（管理者・マネージャー・メンバー・経営者）を指定。招待リンクは 7 日間有効です。",
    },
    "survey-setup": {
        badge: { label: "ボイスチェック設定", color: "pb-coral" },
        heading: "カスタム設問の設定",
        body: "標準 11 問に加えて、会社固有のオリジナル設問を最大 3 問まで追加できます。\n\n設定画面：「設定 → ボイスチェック → カスタム設問」\n\n標準設問と同じく 1〜5 のスコアで回答され、AI 分析にも反映されます。",
    },
    kpirec: {
        badge: { label: "KPI 入力", color: "pb-purple" },
        heading: "毎月の KPI 入力",
        body: "マネージャーが毎月、自分の部署の KPI 数値（実績と目標）を入力します。AI 分析時には、直近数ヶ月分のデータが時系列の文脈として使われます。",
        note: "入力が漏れると AI 分析の精度が下がるため、月初に必ず入力しましょう。",
    },
    resource: {
        badge: { label: "人数・人件費", color: "pb-purple" },
        heading: "人数・人件費の入力",
        body: "マネージャーが毎月、自部署の人数と人件費を入力します。AI はこの人件費と KPI（売上など）を組み合わせて、人件費の投資対効果を算出。ダッシュボードの「人件費ROI」マトリックス分析にも使われます。",
    },
    "slack-remind": {
        badge: { label: "Slack 通知", color: "pb-gray" },
        heading: "Slack でボイスチェック催促",
        body: "毎月決まった日に、Signs AI から未回答のメンバーへ Slack DM が自動送信されます。\n\n送信される条件：\n① メンバーの Slack ID が設定済み\n② 通知設定が ON（デフォルト ON）\n③ 当月のボイスチェックがまだ未回答",
    },
    surveyres: {
        badge: { label: "ボイスチェック", color: "pb-coral" },
        heading: "ボイスチェック回答",
        body: "メンバーがその月のボイスチェックに答えると、回答セット（11問のまとめ）として記録されます。回答スコアの平均が「組織の体温」として、AI 分析に使われる主要指標です。",
        note: "匿名 URL から回答した場合は、誰が答えたかは紐付きません。",
    },
    surveyanswer: {
        badge: { label: "ボイスチェック", color: "pb-coral" },
        heading: "11 問それぞれの回答",
        body: "ボイスチェックは 11 問あり、各問 1〜5 のスコアで回答します。AI はカテゴリ別（エンゲージメント・関係性・成長感など）に集計してインサイトを作成します。",
    },
    aiinsight: {
        badge: { label: "AI 分析", color: "pb-amber" },
        heading: "AI 分析レポートの生成",
        body: "AI が KPI・人件費・ボイスチェック・組織方針を総合して分析した、月次レポートです。\n\n含まれる内容：\n• 140 字の要約\n• 5 観点の詳細レポート（Deep Report）\n• 部署別メッセージ\n• ボイスチェックのフリーコメント分析\n• 推奨アクション",
    },
    actionitem: {
        badge: { label: "アクション", color: "pb-blue" },
        heading: "アクションアイテムの自動生成",
        body: "AI が自動でアクションアイテムを生成します（手動でも追加可能）。優先度は urgent / high / normal の 3 段階。完了または却下するとアーカイブされます。",
        note: "翌月の AI 分析では「実行中のアクション」として、改善状況も文脈に含まれます。",
    },
    "admin-review": {
        badge: { label: "管理者", color: "pb-teal" },
        heading: "管理者の分析レビュー",
        body: "AI 分析が完了するとアプリ内通知が届きます。Deep Report（5観点の全社分析）を確認し、必要ならアクションの優先度を調整したり、手動で追加したりします。すべての操作は自動でログに残ります。",
        note: "Slack 通知（ai_summary）は管理者にも届きます。",
    },
    "exec-action": {
        badge: { label: "経営者", color: "pb-amber" },
        heading: "経営者のアクション承認",
        body: "経営者は全社の KPI・人件費・ボイスチェックを横断的に確認し、アクションを承認または新規作成します。\n\nこのときに組織方針を更新すると、翌月の AI 分析に新しい方針が反映されます。",
    },
    "exec-semantic": {
        badge: { label: "組織方針", color: "pb-coral" },
        heading: "組織方針の更新（来月に向けて）",
        body: "経営者がアクションを承認したあと、来月に向けた組織方針・重点テーマを追記します。保存時に Slack で各部署へ方針通知を送ることもできます。",
    },
    "notify-create": {
        badge: { label: "通知", color: "pb-green" },
        heading: "マネージャーへの通知作成",
        body: "AI 分析完了後、Signs AI が部署ごとにマネージャー宛のアプリ内通知を自動作成します。これによって、各マネージャーが自部署の分析結果を確認できます。",
    },
    "notify-setting": {
        badge: { label: "通知設定", color: "pb-gray" },
        heading: "通知設定の確認",
        body: "Slack DM を送る前に、メンバーごとの通知設定を確認します。\n\n• Slack 通知 ON → Slack に DM 送信\n• Slack 通知 OFF → アプリ内通知のみ\n• Slack ID 未設定 → Slack 送信はスキップ",
    },
    "slack-dm": {
        badge: { label: "Slack 通知", color: "pb-green" },
        heading: "Slack DM 送信",
        body: "マネージャーが Slack DM で受け取る主な通知は、ボイスチェックの回答進捗通知です。\n\n送信される条件：\n① 会社の Slack 連携が有効\n② メンバーの Slack ID が設定済み\n③ 通知設定が ON",
        note: "AI 分析完了通知（ai_summary）は管理者・経営者宛に Slack で送られます。",
    },
    "slack-kpi-request": {
        badge: { label: "Slack 通知", color: "pb-green" },
        heading: "Slack で KPI 入力依頼",
        body: "前月の KPI が未入力の場合、Signs AI から担当マネージャーへ Slack DM で入力依頼を送ります。\n\n送信される条件：\n① 会社の Slack 連携が有効\n② 前月の KPI に未入力がある\n③ マネージャーの Slack ID が設定済み",
        note: "月初に自動で送信、または管理者が手動で発火することもできます。",
    },
    "slack-admin-done": {
        badge: { label: "Slack 通知", color: "pb-green" },
        heading: "AI 分析完了の Slack 通知",
        body: "AI 分析完了 + 管理者レビュー完了のタイミングで、経営者・管理者へ Slack 通知が送られます。ダッシュボードへのリンク付きで、これが「経営者のアクション承認」に進むトリガーになります。",
        note: "Slack のメッセージ文面は会社ごとにカスタマイズ可能です。",
    },
    "action-confirm": {
        badge: { label: "アクション", color: "pb-blue" },
        heading: "自部署のアクション確認",
        body: "マネージャーは自部署に紐付くアクションのみを閲覧できます。優先度・状態を確認して、来月の KPI 入力に向けた準備を行います。",
        note: "マネージャーは閲覧のみ。アクションの作成・編集はできません。",
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

export default function DocsFlowPage() {
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
        <div>
            {/* Intro */}
            <div className="mb-8 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal/5 text-teal rounded-full text-[10px] font-black uppercase tracking-widest border border-teal/10">
                    Signs AI の使い方
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    使い方の全体像（月次サイクル）
                </h1>
                <p className="text-base text-slate-500 font-medium leading-relaxed">
                    Signs AI は毎月の組織運営サイクルに沿って動いています。誰が何をいつ行うのかを、ステップごとに確認できます。
                    各ノードをクリックすると、左側に詳しい解説が表示されます。
                </p>
            </div>

            <div className="flow-root rounded-[24px] border border-slate-100 overflow-hidden">
                <style dangerouslySetInnerHTML={{ __html: CSS }} />
                <div className="flow-page">

                    {/* サイドパネル */}
                    <aside className="flow-panel">
                        <div className="flow-panel-title">解説パネル</div>
                        {!panel ? (
                            <div className="flow-panel-empty">
                                右の図のノードをクリックすると<br />ここに解説が表示されます
                            </div>
                        ) : (
                            <div className="flow-panel-content active">
                                <span className={`flow-panel-badge ${panel.badge.color}`}>{panel.badge.label}</span>
                                <div className="flow-panel-heading">{panel.heading}</div>
                                <div className="flow-panel-body" style={{ whiteSpace: "pre-line" }}>{panel.body}</div>
                                {panel.note && (
                                    <div className="flow-panel-note">💡 {panel.note}</div>
                                )}
                            </div>
                        )}
                    </aside>

                    {/* メイン図 */}
                    <main className="flow-main">
                        <div className="flow-diagram-title">Signs AI — 月次オペレーションサイクル</div>

                        {/* 準備：管理者セットアップ */}
                        <div className="flow-step">
                            <div className="flow-step-header s-teal">
                                <span className="flow-step-num sn-teal">準</span>
                                準備：管理者が会社・部署・KPI・メンバーをセットアップ
                            </div>
                            <div className="flow-nodes">
                                <Node nodeKey="s0_company"      panelId="company"      color="n-teal"   title="会社情報"       sub="会社名・Slack 連携など"        selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s0_department"   panelId="department"   color="n-teal"   title="部署"          sub="部署名・人数"                  selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s0_kpidef"       panelId="kpidef"       color="n-purple" title="KPI 項目設定"   sub="売上・契約数 など"             selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s0_semantic"     panelId="semantic"     color="n-coral"  title="組織方針"       sub="会社の価値観・戦略"             selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s0_survey-setup" panelId="survey-setup" color="n-coral"  title="ボイスチェック設定" sub="カスタム設問 × 3"             selectedKey={selectedKey} onSelect={handleSelect} />
                                <div style={{ width: "100%", maxWidth: 380 }}>
                                    <Node nodeKey="s0_invitation" panelId="invitation" color="n-gray"   title="メンバー招待"    sub="マネージャー・メンバー・経営者を招待" selectedKey={selectedKey} onSelect={handleSelect} />
                                </div>
                            </div>
                        </div>

                        <div className="flow-arrow-line" />
                        <div className="flow-arrow-dot" />

                        {/* ① マネージャー KPI入力 */}
                        <div className="flow-step">
                            <div className="flow-step-header s-green">
                                <span className="flow-step-num sn-green">①</span>
                                マネージャーが今月の KPI を入力（自分の部署分）
                            </div>
                            <div className="flow-nodes">
                                <Node nodeKey="s1_kpirec"            panelId="kpirec"            color="n-purple" title="KPI 入力"        sub="実績と目標を入力"           selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s1_resource"          panelId="resource"          color="n-purple" title="人数・人件費入力"  sub="投資対効果の算出に使用"      selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s1_slack-kpi-request" panelId="slack-kpi-request" color="n-green"  title="Slack で入力依頼"  sub="未入力時に自動通知"          selectedKey={selectedKey} onSelect={handleSelect} />
                            </div>
                        </div>

                        <div className="flow-arrow-line" />
                        <div className="flow-arrow-dot" />

                        {/* ② メンバー ボイスチェック */}
                        <div className="flow-step">
                            <div className="flow-step-header s-coral">
                                <span className="flow-step-num sn-coral">②</span>
                                メンバーがボイスチェックに回答
                            </div>
                            <div className="flow-nodes">
                                <Node nodeKey="s2_slack-remind" panelId="slack-remind" color="n-gray"  title="Slack 通知受信"   sub="未回答メンバーへ DM"     selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s2_surveyres"    panelId="surveyres"    color="n-coral" title="ボイスチェック回答" sub="11 問のまとめ・組織の体温" selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s2_surveyanswer" panelId="surveyanswer" color="n-coral" title="各問の回答"        sub="1〜5 のスコア"            selectedKey={selectedKey} onSelect={handleSelect} />
                            </div>
                        </div>

                        <div className="flow-arrow-line" />
                        <div className="flow-arrow-dot" />

                        {/* ③ AI 分析 */}
                        <div className="flow-step">
                            <div className="flow-step-header s-amber">
                                <span className="flow-step-num sn-amber">③</span>
                                AI が組織の状態を分析（管理者が手動 or 自動スケジュール）
                            </div>
                            <div className="flow-nodes">
                                <Node nodeKey="s3_kpirec"    panelId="kpirec"    color="n-purple" title="KPI"            sub="業績データ"            selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s3_resource"  panelId="resource"  color="n-purple" title="人数・人件費"     sub="投資対効果"             selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s3_surveyres" panelId="surveyres" color="n-coral"  title="ボイスチェック"   sub="組織の体温"             selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s3_semantic"  panelId="semantic"  color="n-coral"  title="組織方針"        sub="会社の価値観・文脈"      selectedKey={selectedKey} onSelect={handleSelect} />
                            </div>
                            <div style={{ padding: "6px 0 0 8px" }}>
                                <div className="flow-nodes">
                                    <div style={{ minWidth: 220 }}>
                                        <Node nodeKey="s3_aiinsight"  panelId="aiinsight"  color="n-amber" title="AI 分析レポート生成" sub="要約・5観点・部署別メッセージ" selectedKey={selectedKey} onSelect={handleSelect} />
                                    </div>
                                    <div style={{ minWidth: 200 }}>
                                        <Node nodeKey="s3_actionitem" panelId="actionitem" color="n-blue"  title="アクション自動生成"   sub="AI が部署別に提案"           selectedKey={selectedKey} onSelect={handleSelect} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flow-arrow-line" />
                        <div className="flow-arrow-dot" />

                        {/* ④ 管理者レビュー */}
                        <div className="flow-step">
                            <div className="flow-step-header s-teal">
                                <span className="flow-step-num sn-teal">④</span>
                                管理者が AI 分析を確認・アクションを編集
                            </div>
                            <div className="flow-nodes">
                                <Node nodeKey="s4_aiinsight"        panelId="aiinsight"        color="n-amber" title="AI 分析閲覧"        sub="Deep Report 全社分析"     selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s4_admin-review-act" panelId="admin-review"     color="n-blue"  title="アクション確認・編集" sub="優先度調整・手動追加"      selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s4_admin-review-log" panelId="admin-review"     color="n-gray"  title="操作ログ"            sub="自動で記録"                selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s4_slack-admin-done" panelId="slack-admin-done" color="n-green" title="Slack で完了報告"    sub="経営者へ通知"              selectedKey={selectedKey} onSelect={handleSelect} />
                            </div>
                        </div>

                        <div className="flow-arrow-line" />
                        <div className="flow-arrow-dot" />

                        {/* ⑤ 経営者 */}
                        <div className="flow-step">
                            <div className="flow-step-header s-amber">
                                <span className="flow-step-num sn-amber">⑤</span>
                                経営者がアクションを承認・組織方針を更新
                            </div>
                            <div className="flow-nodes">
                                <Node nodeKey="s5_exec-action-ai"   panelId="exec-action"   color="n-amber" title="AI 分析閲覧"      sub="経営者向けレポート"     selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s5_exec-action-item" panelId="exec-action"   color="n-blue"  title="アクション承認・作成" sub="優先度: urgent / high" selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s5_exec-semantic"    panelId="exec-semantic" color="n-coral" title="組織方針の更新"     sub="来月に向けた重点テーマ"   selectedKey={selectedKey} onSelect={handleSelect} />
                            </div>
                        </div>

                        <div className="flow-arrow-line" />
                        <div className="flow-arrow-dot" />

                        {/* ⑥ マネージャー受信 */}
                        <div className="flow-step">
                            <div className="flow-step-header s-green">
                                <span className="flow-step-num sn-green">⑥</span>
                                マネージャーが結果と自部署のアクションを確認
                            </div>
                            <div className="flow-nodes">
                                <Node nodeKey="s6_notify-create-api"    panelId="notify-create"  color="n-amber" title="AI 分析完了"        sub="部署ごとに通知作成"        selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s6_notify-create-record" panelId="notify-create"  color="n-gray"  title="アプリ内通知"        sub="マネージャー宛・部署別"     selectedKey={selectedKey} onSelect={handleSelect} />
                                <Node nodeKey="s6_notify-setting"       panelId="notify-setting" color="n-gray"  title="通知設定の確認"      sub="Slack ON/OFF"             selectedKey={selectedKey} onSelect={handleSelect} />
                            </div>
                            <div style={{ padding: "6px 0 0 8px" }}>
                                <div className="flow-nodes">
                                    <Node nodeKey="s6_slack-dm"       panelId="slack-dm"       color="n-green" title="Slack DM 送信"       sub="Slack ID 設定済みの人へ"   selectedKey={selectedKey} onSelect={handleSelect} />
                                    <Node nodeKey="s6_action-confirm" panelId="action-confirm" color="n-blue"  title="自部署アクション確認" sub="閲覧のみ・編集不可"         selectedKey={selectedKey} onSelect={handleSelect} />
                                </div>
                            </div>
                        </div>

                        <div className="flow-loop-note">↻ マネージャーが翌月の KPI を入力 → ① に戻る</div>

                        {/* 凡例 */}
                        <div className="flow-legend">
                            {[
                                { color: "#1D9E75", label: "会社・部署" },
                                { color: "#7F77DD", label: "KPI・人件費" },
                                { color: "#D85A30", label: "ボイスチェック・組織方針" },
                                { color: "#BA7517", label: "AI 分析" },
                                { color: "#378ADD", label: "アクション" },
                                { color: "#639922", label: "Slack 通知" },
                                { color: "#888780", label: "管理・通知設定" },
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
        </div>
    );
}

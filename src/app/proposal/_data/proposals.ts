/**
 * SignsAI 提案デッキ — 構造化コンテンツ
 *
 * 各スライドは「左パネル（画像/プレースホルダー）+ 右パネル（テキスト）」の
 * 16:9 レイアウトで表示される。右パネルに収まるよう各スライドは最大2〜3ブロック。
 * image フィールドに URL を指定すると左パネルが実画像に切り替わる。
 */

export type Block =
  | { type: "lead"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: { label?: string; text: string }[] }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
      highlightLastCol?: boolean;
    }
  | { type: "metrics"; items: { value: string; label: string }[] }
  | { type: "steps"; items: { tag: string; title: string; desc: string; kpi?: string }[] }
  | { type: "quote"; text: string; author?: string }
  | { type: "callout"; tone?: "accent" | "warn"; title?: string; text: string }
  | { type: "code"; text: string };

export interface Slide {
  kicker: string;
  title: string;
  /** 左パネルの実画像URL（未指定時はグラデーション＋アイコンのプレースホルダー） */
  image?: string;
  blocks: Block[];
}

export interface Deck {
  id: string;
  category: string;
  persona: string;
  personaEn: string;
  role: string;
  title: string;
  subtitle: string;
  tagline: string;
  accent: string;
  icon: string;
  slides: Slide[];
}

/* ════════════════════════════════════════════════════════
 *  DECK 1 ── 経営層・経営企画向け 総合提案
 * ════════════════════════════════════════════════════════ */
const executive: Deck = {
  id: "executive-brief",
  category: "経営層向け",
  persona: "経営層・経営企画",
  personaEn: "Executive Brief",
  role: "Signs AI ご提案資料",
  title: "経営層向け 総合提案",
  subtitle: "組織に体温を。",
  tagline: "KPIと現場の声を統合し、経営の解像度を上げる",
  accent: "#38B2AC",
  icon: "📊",
  slides: [
    {
      kicker: "01 ／ 課題提起",
      title: "なぜ今、組織の「兆候」なのか",
      blocks: [
        {
          type: "bullets",
          items: [
            { text: "ハイパフォーマーが黙って辞める——理由は事後にしかわからない" },
            { text: "数字は達成しているのに「組織の空気が重い」" },
            { text: "KPIが落ちる原因は、3〜6ヶ月前の現場にある" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "これは現場の問題ではない。経営が見るべきものを見ていなかった、構造的な問題だ。",
        },
      ],
    },
    {
      kicker: "02 ／ エビデンス",
      title: "エンゲージメントは「感情」ではなく「経営変数」だ",
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "+23%", label: "生産性向上" },
            { value: "▲43%", label: "離職率低減" },
            { value: "+10%", label: "顧客満足度向上" },
            { value: "8.8兆$", label: "世界の機会損失 / 年" },
          ],
        },
        {
          type: "paragraph",
          text: "Gallup 150カ国・230万人の組織研究。エンゲージメントが高い組織と低い組織の差。KPIが落ちる3〜6ヶ月前から、現場の数値は動き始めている。",
        },
      ],
    },
    {
      kicker: "03 ／ KPIの限界",
      title: "KPIだけでは、組織は動かない",
      blocks: [
        {
          type: "bullets",
          items: [
            { label: "売上・商談数", text: "→ チームの疲弊度と離職予兆は見えない" },
            { label: "成約率", text: "→ 現場が感じるやりがいと詰まりは見えない" },
            { label: "離職率（事後）", text: "→ 辞める「前」の兆候は見えない" },
          ],
        },
        {
          type: "callout",
          tone: "warn",
          text: "KPIが落ちる原因はすでに3〜6ヶ月前の現場にある。結果を追うだけでは、永遠に後手に回る。",
        },
      ],
    },
    {
      kicker: "04 ／ ビジョン",
      title: "Signs AI のビジョン：組織に体温を。",
      blocks: [
        {
          type: "lead",
          text: "数字と熱量を、同時に把握できる経営参謀へ。",
        },
        {
          type: "bullets",
          items: [
            { text: "「なにが起きているか」ではなく「なぜ起きているか」を提示する" },
            { text: "「次に何をすべきか」を、経営言語で提言する" },
            { text: "リアルタイム × AI——感覚経営からデータ経営へ" },
          ],
        },
      ],
    },
    {
      kicker: "05 ／ 解決",
      title: "Signs AI が解決する3つの構造問題",
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "①",
              title: "経営と現場のギャップ",
              desc: "KPIを見ている経営と現場のリアリティを、同一画面でつなぐ",
            },
            {
              tag: "②",
              title: "施策効果が見えない問題",
              desc: "打ち手の前後でKPIと体温がどう変化したか——因果を数字で語れる",
            },
            {
              tag: "③",
              title: "診断のブラックボックス",
              desc: "「なんか雰囲気が悪い」で終わらせず、原因と具体的アクションを提言",
            },
          ],
        },
      ],
    },
    {
      kicker: "06 ／ プロダクト概要",
      title: "Signs AI とは何か——3層データ統合",
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "KPI",
              title: "定量データ",
              desc: "部署ごとの生産性・商談数・解約率など月次実績",
            },
            {
              tag: "Voice",
              title: "定性データ",
              desc: "独自11問アンケートによる現場の本音スコア",
            },
            {
              tag: "Policy",
              title: "セマンティックレイヤー",
              desc: "経営方針・優先事項をAI診断の文脈として投入。蓄積するほど精度向上",
            },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "3データを統合したとき、初めて「なぜKPIが落ちたか」に答えられる。",
        },
      ],
    },
    {
      kicker: "07 ／ AIインサイト",
      title: "誰に、何を提言するか",
      blocks: [
        {
          type: "bullets",
          items: [
            { label: "経営層向け", text: "全社の兆候と優先介入ポイント" },
            { label: "Admin向け", text: "部署横断の比較と課題の構造分析" },
            { label: "マネージャー向け", text: "自部署の今月の動き方と具体的アクション" },
            { label: "現場向け", text: "チームの空気感の可視化と回答フィードバック" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "「数字は☀️なのに現場は☔️」という矛盾を検知し、即座に背景仮説と打ち手を提示。",
        },
      ],
    },
    {
      kicker: "08 ／ 運用",
      title: "月次運用フロー——シンプルな3ステップ",
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "STEP 1",
              title: "KPI入力",
              desc: "月次実績をWeb画面またはスプレッドシートで記録（5〜10分）",
            },
            {
              tag: "STEP 2",
              title: "アンケート配布",
              desc: "URLを現場に送付——回答は数分で完了、匿名集計",
            },
            {
              tag: "STEP 3",
              title: "AI診断実行",
              desc: "「集計を実行」で全階層のAI提言を自動生成、即座に経営に報告",
            },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "月あたり約1〜2時間。専任担当は不要。",
        },
      ],
    },
    {
      kicker: "09 ／ 差別化",
      title: "既存ツールとの差別化",
      blocks: [
        {
          type: "table",
          highlightLastCol: true,
          headers: ["比較軸", "HRサーベイ", "BI / 分析", "Signs AI"],
          rows: [
            ["KPI管理", "△", "◎", "◯"],
            ["組織定性把握", "◎", "✕", "◎"],
            ["KPI×定性の統合分析", "✕", "✕", "◎"],
            ["AIによる経営提言", "△", "△", "◎"],
            ["日本語・日本市場特化", "△", "△", "◎"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "勝ち筋は「統合 × 提言 × 日本特化」の3点セット。この重なる場所に競合は存在しない。",
        },
      ],
    },
    {
      kicker: "10 ／ ターゲット",
      title: "ターゲットと初期想定プラン",
      blocks: [
        {
          type: "bullets",
          items: [
            { label: "規模", text: "従業員50〜300名のSaaS企業" },
            { label: "課題", text: "KPIは追えているが「なぜ数字が動くか」の因果が掴めていない" },
            { label: "体制", text: "離職・モチベーション低下に悩むが、HR専任チームを持てていない" },
          ],
        },
        {
          type: "table",
          headers: ["プラン", "月額", "主な対象"],
          rows: [
            ["Free（70日間）", "無料", "現状スキャン・体験"],
            ["Standard", "5万円", "課題の深掘り・施策効果追跡"],
            ["Pro", "10万円", "全社統合・人事戦略・ROI管理"],
          ],
        },
      ],
    },
    {
      kicker: "11 ／ ROI",
      title: "投資対効果（ROI）シミュレーション",
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "約5倍", label: "年間ROI（保守試算）" },
            { value: "+387万円", label: "離職抑制の節約" },
            { value: "▲75万円", label: "年間費用（Standard）" },
            { value: "▲43%", label: "Gallup：離職率低減効果" },
          ],
        },
        {
          type: "paragraph",
          text: "モデルケース：従業員100名・年間離職率10%のSaaS企業。Signs AI Standard年間費用75万円に対し、離職3名抑制だけで387万円の節約。ROI約5倍（保守試算）。",
        },
      ],
    },
    {
      kicker: "12 ／ プラン比較",
      title: "プランごとの投資対効果",
      blocks: [
        {
          type: "table",
          headers: ["プラン", "年間総費用", "損益分岐点", "主な機能"],
          rows: [
            ["Free", "0円", "即日回収", "現状スキャン・基本ダッシュボード"],
            ["Standard", "75万円", "離職抑制1名未満", "部署横断・AI提言・施策追跡"],
            ["Pro", "135万円", "離職抑制1名以下", "全社統合・人事戦略・セマンティックレイヤー"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "「75万円で来期の離職3件を防げるか？」——その答えを、3ヶ月後に数字で出せるのが Signs AI だ。",
        },
      ],
    },
    {
      kicker: "13 ／ Closing",
      title: "経営層へのメッセージ",
      blocks: [
        {
          type: "lead",
          text: "あなたの組織は今、何度ですか？",
        },
        {
          type: "callout",
          tone: "accent",
          text: "KPIが達成されていても現場が燃え尽きていれば来期の問題。逆に数字が苦しくても体温が高ければ打てる手がある。Signs AI は「体温」を経営の意思決定に組み込む仕組みだ。",
        },
      ],
    },
  ],
};

/* ════════════════════════════════════════════════════════
 *  DECK 2 ── 人事・HR向け 提案
 * ════════════════════════════════════════════════════════ */
const hr: Deck = {
  id: "hr-brief",
  category: "人事向け",
  persona: "人事・HR",
  personaEn: "HR Brief",
  role: "人事向け ご提案資料",
  title: "人事向け 提案",
  subtitle: "利益を出す人事へ。",
  tagline: "人事施策の効果を、売上・利益に翻訳する",
  accent: "#4F46E5",
  icon: "👥",
  slides: [
    {
      kicker: "01 ／ 課題",
      title: "人事の成果は、売上に換算できるか",
      blocks: [
        {
          type: "lead",
          text: "「人事費用のROIは？」と聞かれて、即座に数字で答えられるか。",
        },
        {
          type: "bullets",
          items: [
            { text: "採用目標を達成した／研修を実施した／評価制度を刷新した／離職率を改善した" },
            { text: "——どれも「売上にいくら貢献したか」を語れない" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "これは人事の能力の問題ではない。施策効果を売上・利益に翻訳する仕組みがなかった、構造の問題だ。",
        },
      ],
    },
    {
      kicker: "02 ／ 採用の本質",
      title: "「採用要望」は本当に採用で解決すべきか",
      blocks: [
        {
          type: "lead",
          text: "冷えた組織に人を投入するのは、水漏れするバケツに水を注ぐのと同じだ。",
        },
        {
          type: "bullets",
          items: [
            { label: "生産性の低下", text: "チームが疲弊し、同じ成果に以前より工数がかかる" },
            { label: "エンゲージメント低下", text: "実質的な稼働率が落ちている" },
            { label: "マネジメント機能不全", text: "マネージャーが孤立し、チームが正しく動いていない" },
          ],
        },
        {
          type: "callout",
          tone: "warn",
          text: "これらが原因なら採用では解決しない。組織体温とKPIを照合し「採用か、組織改善が先か」を数字で判断する。",
        },
      ],
    },
    {
      kicker: "03 ／ 効果測定の壁",
      title: "人事施策の「前後」が見えない問題",
      blocks: [
        {
          type: "table",
          headers: ["打った施策", "現在の測定手段", "経営報告における限界"],
          rows: [
            ["マネージャー研修", "受講後アンケート", "組織パフォーマンスの変化まで追えない"],
            ["組織再編・統合", "数ヶ月後の業績", "市況・他施策との因果分離ができない"],
            ["評価制度の刷新", "サーベイ・1on1", "部署横断・時系列での定点観測が困難"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "施策の実施月を記録し、前後でKPIと組織体温の変化を時系列で可視化。「あの研修は翌月チームスコアを8pt改善した」と報告できる。",
        },
      ],
    },
    {
      kicker: "04 ／ エビデンス",
      title: "組織の温度が上がると、採用予算はどう変わるか",
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "▲43%", label: "離職率（採用予算が縮小）" },
            { value: "+23%", label: "生産性（採用せず解決）" },
            { value: "▲81%", label: "欠勤率（実質稼働率↑）" },
            { value: "▲18%", label: "品質不良（手戻り↓）" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "組織の体温を1度上げることは、採用計画を1件見直すよりも人事予算への効果が大きい。採用は「組織が健康な前提」でこそ機能する。",
        },
      ],
    },
    {
      kicker: "05 ／ もたらす変化",
      title: "Signs AIが人事にもたらす3つの変化",
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "①",
              title: "勘と経験 → データと根拠",
              desc: "「どの部署の・何が・どう悪いか」を具体的な言葉で経営層に報告できる",
            },
            {
              tag: "②",
              title: "施策の因果を可視化",
              desc: "実施月をマークし前後の変化を追う。予算申請がエビデンスで語れる武器になる",
            },
            {
              tag: "③",
              title: "採用か組織改善かの判断軸",
              desc: "採用を進める判断も止める判断も、数字で説明できる人事になれる",
            },
          ],
        },
      ],
    },
    {
      kicker: "06 ／ 運用",
      title: "月次運用フロー（人事担当者の動き方）",
      blocks: [
        {
          type: "steps",
          items: [
            { tag: "月初", title: "KPI入力", desc: "前月の売上・商談数・解約率などを記録" },
            { tag: "月中", title: "アンケート配布", desc: "URLを全社員へ配布。回答は3〜5分" },
            { tag: "月末", title: "集計実行", desc: "「集計を実行」でAIが診断を生成" },
            { tag: "翌月頭", title: "レポート共有", desc: "経営会議・マネージャーMTGに診断を共有" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "運用工数は月あたり約1〜2時間。人事専任でなくても回せる設計。",
        },
      ],
    },
    {
      kicker: "07 ／ 利益を出す人事",
      title: "人事がSigns AIで「利益を出す」とは",
      blocks: [
        {
          type: "lead",
          text: "人事は「コスト部門」ではない。生産性と定着率を動かし、利益に直結できる部門だ。",
        },
        {
          type: "table",
          highlightLastCol: true,
          headers: ["これまでの人事", "Signs AIを使った人事"],
          rows: [
            ["採用要望が来たら動く（受け身）", "組織体温を見て先手を打つ（能動）"],
            ["施策効果を感覚で語る", "前後をデータで比較・報告する"],
            ["離職してから原因を探る", "離職の予兆を3ヶ月前に察知する"],
            ["経営会議でROIを説明できない", "施策効果を数字で経営に報告する"],
          ],
        },
      ],
    },
    {
      kicker: "08 ／ ROI",
      title: "投資対効果（人事視点のROI試算）",
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "+687万円", label: "効果合計 / 年" },
            { value: "▲75万円", label: "年間費用（Standard）" },
            { value: "約9倍", label: "年間ROI（純効果+612万円）" },
            { value: "4倍", label: "離職1名抑制で回収" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "前提：従業員100名・年間離職率10%・離職コスト300万円/人。採用1件を正しく止めるだけで年間費用の4倍を回収——これが「利益を出す人事」の入口だ。",
        },
      ],
    },
    {
      kicker: "09 ／ プラン",
      title: "プラン・はじめ方",
      blocks: [
        {
          type: "table",
          headers: ["プラン", "月額", "最低契約", "こんな企業に"],
          rows: [
            ["Free（30日間）", "無料", "なし", "まず組織の現状を知りたい"],
            ["Standard", "5万円", "3ヶ月", "部署3〜5つ・効果検証したい"],
            ["Pro", "10万円", "3ヶ月", "全社統合・経営と連動させたい"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "まずはFreeで、自社の組織体温を測るところから。3ヶ月後「どこが冷えているか」が可視化され、次のアクションが明確になる。",
        },
      ],
    },
    {
      kicker: "10 ／ Closing",
      title: "人事担当者へのメッセージ",
      blocks: [
        {
          type: "lead",
          text: "「人事の成果を売上に換算できない」もどかしさは、正しい。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "価値がないのではない。翻訳する仕組みがなかっただけだ。組織の体温を上げることが採用費を削り、生産性を高め、利益に直結する。Signs AI は、あなたが「利益を出す人事」になるためのインフラだ。",
        },
      ],
    },
  ],
};

/* ════════════════════════════════════════════════════════
 *  DECK 3 ── ホワイトペーパー：AI時代の人事戦略
 * ════════════════════════════════════════════════════════ */
const whitepaper: Deck = {
  id: "whitepaper-hr",
  category: "ホワイトペーパー",
  persona: "人事・経営企画・CEO",
  personaEn: "Whitepaper",
  role: "ホワイトペーパー",
  title: "AI時代に残る人事と消える人事",
  subtitle: "人事の85%はAIで消える。残る10%こそ競争力。",
  tagline: "シゴトAI 2026年版・経産省・Gallup等の一次データをもとに",
  accent: "#0EA5E9",
  icon: "📄",
  slides: [
    {
      kicker: "01 ／ テーゼ",
      title: "人事の85%はAIで消える。残る10%こそ競争力。",
      blocks: [
        {
          type: "callout",
          tone: "accent",
          title: "あなたのHRはどちら側か？",
          text: "AIに代替される85%側か、AIで強くなる10%側か——2026年、企業の競争力はこの分岐点で決まる。",
        },
        {
          type: "bullets",
          items: [
            { text: "Block：従業員 -40%（4,000人超）— AIで一気に組織縮小（2026/2）" },
            { text: "McKinsey：2030年までに米国労働時間の最大30%が自動化" },
            { text: "経産省：2040年 事務系440万人余剰 ／ AI・データ人材339万人不足" },
            { text: "Gartner 2026：HR×AIが企業生産性に最大+29%寄与" },
          ],
        },
      ],
    },
    {
      kicker: "02 ／ 人事5業務 AI影響度マップ",
      title: "どの人事業務がAIに消え、どこが残るか",
      blocks: [
        {
          type: "table",
          headers: ["業務領域", "AI影響度", "代表ツール", "ポイント"],
          rows: [
            ["労務管理", "85%", "freee / SmartHR / MF", "給与計算70%削減事例多数"],
            ["採用業務", "75%", "HERP AI / YOUTRUST", "スカウト自律化が進行中"],
            ["人材育成", "50%", "Udemy AI / LinkedIn", "個別最適化が進展"],
            ["評価・配置", "40%", "カオナビ / タレントパレット", "最終判断は人間"],
            ["🎯 組織開発・人事戦略", "10%", "（補助のみ）", "★ Signs AIの主戦場 ★"],
          ],
        },
        {
          type: "paragraph",
          text: "出典：シゴトAI（shigoto-ai.net）2026年版『人事AI影響度マップ』／ 経産省・読売新聞・日経・HR総研・JDLA等の一次データを統合分析",
        },
      ],
    },
    {
      kicker: "03 ／ Gallupエビデンス",
      title: "エンゲージメントは「感情」ではなく「経営変数」だ",
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "+23%", label: "生産性向上（Gallup）" },
            { value: "▲51%", label: "離職率低減（Gallup）" },
            { value: "+68%", label: "ウェルビーイング向上" },
            { value: "8%", label: "日本のエンゲージメント率（世界最低水準）" },
          ],
        },
        {
          type: "paragraph",
          text: "Gallup 150カ国・230万人のメタアナリシス。エンゲージメント上位25%の組織は下位25%と比較して収益性+23%、離職率▲51%、欠勤率▲81%。日本のエンゲージメント率8%は先進国最低水準——これが最大の経営リスクである。",
        },
      ],
    },
    {
      kicker: "04 ／ 市場動向",
      title: "HR×AI市場は急拡大——意思決定を急ぐ理由",
      blocks: [
        {
          type: "bullets",
          items: [
            { label: "日本市場規模", text: "134億円・前年比120%成長（2026年）" },
            { label: "採用AI活用企業", text: "47%——最終判断をAIに任せる企業はわずか3%（HR総研）" },
            { label: "HRBP求人", text: "前年比1.4倍、年収800〜1,100万円へ上昇" },
            { label: "みずほFG", text: "事務職5,000人を10年スパンで配置転換（即リストラではない）" },
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "経営判断の窓は狭い",
          text: "AIツールを先行導入した企業が「組織開発の10%領域」を押さえると、後発企業との差は急速に広がる。",
        },
      ],
    },
    {
      kicker: "05 ／ Signs AIのポジション",
      title: "Signs AIが変えるもの——既存ツールとの差",
      blocks: [
        {
          type: "table",
          highlightLastCol: true,
          headers: ["項目", "従来のサーベイ", "Signs AI"],
          rows: [
            ["対象領域", "サーベイ実施で完結", "組織開発（10%領域）を強化"],
            ["分析", "スコア表示のみ", "AIが打ち手まで提示"],
            ["データ統合", "アンケートのみ", "KPI × アンケート × Slack × 組織方針"],
            ["回答負荷", "毎月30問以上", "月1回・11問・3分"],
            ["導入速度", "1〜3ヶ月", "最短1週間"],
            ["コスト", "年数百万円〜", "月額数万円から"],
          ],
        },
      ],
    },
    {
      kicker: "06 ／ ROI試算",
      title: "100名規模企業での投資対効果シミュレーション",
      blocks: [
        {
          type: "table",
          headers: ["指標", "現状", "Signs AI 導入1年後", "効果"],
          rows: [
            ["エンゲージメント率", "8%", "15〜20%", "+7〜12pt"],
            ["離職率", "10%", "5〜7%", "▲3〜5pt"],
            ["年間離職コスト", "5,000万円", "2,500〜3,500万円", "▲1,500〜2,500万円"],
            ["投資対効果", "—", "5〜25倍", "半年〜1年で回収"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "前提：従業員100名・年間離職率10%・離職コスト300万円/人。Signs AI Standard年間費用75万円に対し、離職3名抑制だけで387万円の節約。ROI約5倍（保守試算）。",
        },
      ],
    },
    {
      kicker: "07 ／ 結論",
      title: "2026年、企業が迫られている二択",
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "選択A",
              title: "AIで人を減らす",
              desc: "短期コスト削減。組織の魂を失い、残存メンバーのエンゲージメントも毀損する。",
            },
            {
              tag: "選択B",
              title: "AIで人を活かす",
              desc: "エンゲージメント向上 × 生産性改善 × 競争力強化。Signs AIは「選択B」を選ぶ企業のための戦略パートナー。",
            },
          ],
        },
        {
          type: "quote",
          text: "測定されないものはマネジメントされない。組織の体温を測ることが、経営の第一歩だ。",
          author: "Peter F. Drucker",
        },
      ],
    },
  ],
};

export const decks: Deck[] = [executive, hr, whitepaper];

export const decksByCategory: { category: string; decks: Deck[] }[] = decks.reduce(
  (acc, deck) => {
    const found = acc.find((g) => g.category === deck.category);
    if (found) found.decks.push(deck);
    else acc.push({ category: deck.category, decks: [deck] });
    return acc;
  },
  [] as { category: string; decks: Deck[] }[],
);

export function getDeck(id: string): Deck | undefined {
  return decks.find((d) => d.id === id);
}

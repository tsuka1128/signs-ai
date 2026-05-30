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
  accent: "#4F46E5",
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
 *  DECK 2 ── コトラー × 市場戦略・ポジショニング
 * ════════════════════════════════════════════════════════ */
const kotler: Deck = {
  id: "kotler-market",
  category: "市場戦略",
  persona: "コトラー",
  personaEn: "Philip Kotler",
  role: "CMO ／ 市場戦略・ポジショニング",
  title: "市場戦略・ポジショニング",
  subtitle: "「組織の内側」を、外部市場と同じ解像度で経営する",
  tagline: "KPIが語らない組織の兆候を、AIが経営言語に翻訳する経営参謀SaaS",
  accent: "#38B2AC",
  icon: "🎯",
  slides: [
    {
      kicker: "01 ／ 市場定義",
      title: "なぜ今、「組織の内側」がマーケットになるのか",
      blocks: [
        {
          type: "lead",
          text: "インターナルマーケティングは、エクスターナルマーケティングに先行する。",
        },
        {
          type: "bullets",
          items: [
            { text: "外部顧客を熱狂させるのは、最終的に人間だ" },
            { text: "多くの経営者は外部市場には精緻なデータを持ち込み、内部市場には感覚しか使わない" },
            { text: "Signs AI はこの非対称を解消するために作られた" },
          ],
        },
      ],
    },
    {
      kicker: "02 ／ セグメンテーション",
      title: "市場の空白：誰も埋めていない象限がある",
      blocks: [
        {
          type: "table",
          headers: ["市場レイヤー", "代表ツール", "できないこと"],
          rows: [
            ["HRサーベイ層", "Lattice / Culture Amp", "KPIとの接続・経営提言"],
            ["BI/KPI分析層", "Tableau / Looker", "現場の定性・人的要因の統合"],
            ["🔲 統合×提言層", "（空白）", "誰も埋めていない"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "「なぜKPIが落ちているか」既存ツールは答えられない。Signs AI は統合と提言を同時に出す唯一のカテゴリだ。",
        },
      ],
    },
    {
      kicker: "03 ／ ICP定義",
      title: "ターゲット顧客プロファイル（ICP）",
      blocks: [
        {
          type: "bullets",
          items: [
            { label: "規模", text: "従業員50〜200名のSaaS・IT・スタートアップ（Series B〜D）" },
            { label: "意思決定者", text: "CEO / 経営企画 / CHRO（不在ならCOO）" },
            { label: "ペインの瞬間①", text: "ハイパフォーマーが突然辞める。なぜかわからない" },
            { label: "ペインの瞬間②", text: "KPIは達成しているのに、組織の空気がどこか重い" },
          ],
        },
      ],
    },
    {
      kicker: "04 ／ ポジショニング",
      title: "パーセプチュアルマップ：右上の象限を独占する",
      blocks: [
        {
          type: "lead",
          text: "競合が存在しない場所に戦場を作る——これがコトラー流ポジショニング戦略だ。",
        },
        {
          type: "bullets",
          items: [
            { label: "KPI管理専業（Tableau系）", text: "経営への接続は強いが、定性データがない" },
            { label: "HRサーベイ専業（Lattice / Culture Amp）", text: "現場の声は拾えるが、経営提言がない" },
            { label: "Signs AI", text: "KPI×定性統合 × 経営提言——右上の象限を独占" },
          ],
        },
      ],
    },
    {
      kicker: "05 ／ バリュープロポジション",
      title: "バリュープロポジション（価値3層モデル）",
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "第1層",
              title: "コア価値",
              desc: "組織リスクを事前に察知し、経営判断のタイミングを3〜6ヶ月前倒しにする能力",
            },
            {
              tag: "第2層",
              title: "期待価値",
              desc: "KPI×サーベイの統合管理・月次レポート自動生成・部署横断の比較ビュー",
            },
            {
              tag: "第3層",
              title: "付加価値",
              desc: "セマンティックレイヤー・Slack参謀チャンネル・施策効果の時系列追跡",
            },
          ],
        },
      ],
    },
    {
      kicker: "06 ／ 競合差別化",
      title: "競合差別化マトリクス",
      blocks: [
        {
          type: "table",
          highlightLastCol: true,
          headers: ["比較軸", "Lattice / Culture Amp", "Tableau", "Signs AI"],
          rows: [
            ["KPI管理", "△", "◎", "◯"],
            ["組織定性把握", "◎", "✕", "◎"],
            ["両者の統合分析", "✕", "✕", "◎"],
            ["AIによる経営提言", "△", "△", "◎"],
            ["日本語・日本市場特化", "△", "△", "◎"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "勝ち筋は「統合 × 提言 × 日本特化」の3点セット。3つが重なる場所に戦場を作る。",
        },
      ],
    },
    {
      kicker: "07 ／ 4P",
      title: "マーケティングミックス（4P分析）",
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "Product",
              title: "製品",
              desc: "KPI×Voice×Policy の3レイヤー統合。「診断」ではなく「提言」まで出す点が核心",
            },
            {
              tag: "Price",
              title: "価格",
              desc: "Freemiumで摩擦ゼロのエントリー。無料で現状スキャンを体験させ、ROIを見せてからアップセル",
            },
            {
              tag: "Place",
              title: "流通",
              desc: "WebベースのSaaS + Slack連携で日常の中に価値を届ける",
            },
            {
              tag: "Promotion",
              title: "販促",
              desc: "Evidence-based（ROI試算）/ Proof of Concept（Freeで証明）/ Community（体温経営）",
            },
          ],
        },
      ],
    },
    {
      kicker: "08 ／ カスタマージャーニー",
      title: "カスタマージャーニー",
      blocks: [
        {
          type: "steps",
          items: [
            { tag: "認知", title: "Awareness", desc: "HR Tech文脈でコンテンツに接触。組織の数値化という課題を認識" },
            { tag: "体験", title: "Aha", desc: "Freeプラン：自社の組織体温を初めて数字で見る" },
            { tag: "導入", title: "Adopt", desc: "Standard：施策の前後を追い始める。ROIが見え始める" },
            { tag: "定着", title: "Retain", desc: "セマンティックレイヤーに自社方針が蓄積。代替不可能に" },
            { tag: "推薦", title: "Advocate", desc: "「うちの経営参謀」として他社経営者に紹介" },
          ],
        },
      ],
    },
    {
      kicker: "09 ／ メッセージング",
      title: "セグメント別メッセージング",
      blocks: [
        {
          type: "table",
          headers: ["ターゲット", "刺さるメッセージ", "提供する価値"],
          rows: [
            ["CEO", "組織リスクを経営判断に組み込む", "兆候を3ヶ月前に掴める経営"],
            ["CHRO / 人事", "施策の効果を数字で経営に報告", "利益を出す人事への転換"],
            ["経営企画", "KPIと人的資本を同一画面で管理", "先行指標で次の一手を打てる"],
            ["マネージャー", "AIが自部署の動き方を提言", "AIが参謀になってくれる"],
          ],
        },
      ],
    },
    {
      kicker: "10 ／ Closing",
      title: "コトラーからのメッセージ",
      blocks: [
        {
          type: "quote",
          text: "The aim of marketing is to know and understand the customer so well the product or service fits him and sells itself.",
          author: "Philip Kotler",
        },
        {
          type: "callout",
          tone: "accent",
          text: "Signs AI が戦うべき市場は、競合との戦いではない。「見えない組織リスクを放置する経営習慣」との戦いだ。",
        },
      ],
    },
  ],
};

/* ════════════════════════════════════════════════════════
 *  DECK 3 ── ベニオフ × 顧客成功・SaaS事業設計
 * ════════════════════════════════════════════════════════ */
const benioff: Deck = {
  id: "benioff-success",
  category: "顧客成功・事業設計",
  persona: "ベニオフ",
  personaEn: "Marc Benioff",
  role: "CSO ／ 顧客成功・SaaS事業設計",
  title: "顧客成功・SaaS事業設計",
  subtitle: "「No Spreadsheet for Org Management.」",
  tagline: "KPIを追うだけの経営から、組織の体温を持った経営へ",
  accent: "#3B82F6",
  icon: "☁️",
  slides: [
    {
      kicker: "01 ／ 宣言",
      title: "「No Software」が変えた世界、「No Spreadsheet」が変える次",
      blocks: [
        {
          type: "bullets",
          items: [
            { text: "1999年、Salesforceは「No Software」を宣言し、CRMをクラウドへ移した" },
            { text: "今も多くの企業は月次人事データをExcelで管理し、感覚的なレポートで意思決定している" },
            { text: "これは2025年に「オンプレミスのCRM」を使い続けるのと同義だ" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          title: "Signs AI の宣言",
          text: "No Spreadsheet for Org Management. 組織の健康状態を、月次・自動・AI分析で経営の意思決定に接続する。",
        },
      ],
    },
    {
      kicker: "02 ／ Org 360",
      title: "Org 360：組織の全貌を一つの画面で把握する",
      blocks: [
        {
          type: "steps",
          items: [
            { tag: "KPI", title: "定量", desc: "売上・商談数・解約率 → 経営の意思決定に直結" },
            { tag: "Voice", title: "定性", desc: "11問のエンゲージメントスコア → マネジメントの行動指針" },
            { tag: "Policy", title: "文脈", desc: "経営方針・今期優先事項 → 現場の動き方を規定" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "3層を統合しなければ組織管理に意味はない。AIが「今何が起きていて、次に何をすべきか」を出す。",
        },
      ],
    },
    {
      kicker: "03 ／ V2MOM",
      title: "V2MOM：Signs AI の存在意義",
      blocks: [
        {
          type: "callout",
          tone: "accent",
          title: "Vision",
          text: "すべての組織に、体温を持たせる。KPIと現場の声が統合された意思決定が、すべての経営者の手に届く世界。",
        },
        {
          type: "bullets",
          items: [
            { label: "Values", text: "透明性・先手・人への敬意" },
            { label: "Methods", text: "3層統合・セマンティックレイヤー・Slack参謀チャンネル" },
            { label: "Obstacles", text: "心理的抵抗→Freeで体験 / 移行コスト→並行運用 / 信頼不足→根拠開示" },
            { label: "Measures", text: "Free転換率 / NRR 120%以上 / AI診断実行回数" },
          ],
        },
      ],
    },
    {
      kicker: "04 ／ カスタマーサクセス",
      title: "カスタマーサクセスファースト設計",
      blocks: [
        {
          type: "steps",
          items: [
            { tag: "STEP 1", title: "Onboard", desc: "初月：KPIとアンケートを設定。組織のベースライン体温を測定", kpi: "回答率70%以上" },
            { tag: "STEP 2", title: "Activate", desc: "2〜3ヶ月：AI診断を経営会議・マネージャーMTGに組み込む", kpi: "意思決定で参照される" },
            { tag: "STEP 3", title: "Value", desc: "4〜6ヶ月：施策の前後比較で因果が見え始める", kpi: "効いた/効かないを数字で言える" },
            { tag: "STEP 4", title: "Habit", desc: "7〜12ヶ月：月次運用が習慣化。セマンティックレイヤーに方針が蓄積", kpi: "スイッチングコスト > 代替価値" },
            { tag: "STEP 5", title: "Expand", desc: "1年以降：部署数・ユーザー数が拡大。Pro移行・他部門展開", kpi: "NRR 120%超" },
          ],
        },
      ],
    },
    {
      kicker: "05 ／ 事業モデル",
      title: "SaaS収益モデル：Land and Expand",
      blocks: [
        {
          type: "table",
          headers: ["フェーズ", "プラン", "トリガー"],
          rows: [
            ["Land", "Free", "現状スキャン・兆候の発見"],
            ["Expand 1", "Standard", "「なぜ？」を深掘り・施策効果を追う"],
            ["Expand 2", "Pro", "全社統合・人事戦略・ROI管理"],
            ["Expand 3", "Enterprise", "グループ会社・多拠点展開"],
          ],
        },
        {
          type: "metrics",
          items: [
            { value: "25%", label: "Free→有料転換率" },
            { value: "175万円", label: "MRR（100社時点）" },
            { value: "120%+", label: "NRR" },
            { value: "3%以下", label: "月次チャーン率" },
          ],
        },
      ],
    },
    {
      kicker: "06 ／ Trust",
      title: "Trust as Foundation：なぜ信頼できるか",
      blocks: [
        {
          type: "bullets",
          items: [
            { label: "セキュリティ", text: "Row Level Security・会社IDベースのデータ分離・役割別アクセス制御" },
            { label: "AIの透明性", text: "診断には必ず根拠データを提示。断定せず「提言」を出す。文脈はユーザーが完全管理" },
            { label: "プライバシー", text: "回答は個人を特定しない集計ベース（部署単位の最小集計）" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "組織の内部データという最もセンシティブな情報を扱う。Trust（信頼）は Signs AI にとって死活問題だ。",
        },
      ],
    },
    {
      kicker: "07 ／ Slack参謀",
      title: "Slack参謀チャンネル：AIが「日常」に溶け込む",
      blocks: [
        {
          type: "code",
          text: `📢 #signs-ai-営業部

【今月の診断サマリー】
✅ KPI達成率：88%（先月比 +5pt）
⚠️ エンゲージメント：62pt（3ヶ月連続低下）

🤖 AIの提言：
「KPIは改善していますが、エンゲージメント低下が継続中。
 成果を出すメンバーほど疲弊している可能性があります。
 今月は1on1の頻度を上げ、達成者への感謝表明を意識してください。」`,
        },
        {
          type: "callout",
          tone: "accent",
          text: "ツールを開く必要がない。AIが日常の場所（Slack）に来る——これが定着率を高める最大の仕掛けだ。",
        },
      ],
    },
    {
      kicker: "08 ／ ROI",
      title: "ROI：投資対効果の「ストーリー」で語る",
      blocks: [
        {
          type: "table",
          headers: ["項目", "金額"],
          rows: [
            ["離職抑制コスト削減（2名分）", "+600万円"],
            ["Signs AI 年間費用（Pro）", "▲135万円"],
            ["純効果", "+465万円（ROI 約4.4倍）"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "ケースA：急成長SaaS（150名）。離職リスクのある2名を3ヶ月前に検知→介入→離職ゼロで次期を終えた。",
        },
      ],
    },
    {
      kicker: "09 ／ Ohana",
      title: "「Ohana」モデル：全ステークホルダーへの価値",
      blocks: [
        {
          type: "table",
          headers: ["ステークホルダー", "Signs AI が提供する価値"],
          rows: [
            ["経営者", "組織リスクの先行把握・ROIある意思決定"],
            ["人事 / HRBP", "施策効果の証明・経営への発言権"],
            ["マネージャー", "孤独なマネジメントにAI参謀が伴走"],
            ["従業員", "自分の声が組織改善につながる実感"],
            ["投資家・株主", "人的資本の定量管理と将来予測可能性"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "組織が健全であることが、すべてのステークホルダーへの最大の価値提供だ。",
        },
      ],
    },
    {
      kicker: "10 ／ Closing",
      title: "ベニオフからのメッセージ",
      blocks: [
        {
          type: "quote",
          text: "The business of business is improving the state of the world.",
          author: "Marc Benioff",
        },
        {
          type: "callout",
          tone: "accent",
          text: "KPIを追うだけの経営から、「組織の体温を持った経営」へ。その転換を今日始める最もシンプルな第一歩がFreeプランだ。",
        },
      ],
    },
  ],
};

export const decks: Deck[] = [executive, kotler, benioff];

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

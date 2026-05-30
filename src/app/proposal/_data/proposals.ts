/**
 * SignsAI 提案デッキ用 構造化コンテンツ
 *
 * 各 Deck = 1つの提案資料（担当CXOごと）
 * 各 Slide = 提案資料の1セクション
 * 各 Block = スライド内のコンテンツ単位（リード文／段落／表／指標カード等）
 *
 * コンテンツは TAION CMOコトラー / CSOベニオフ が作成した SignsAI 提案資料に基づく。
 */

export type Block =
  | { type: "lead"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: { label?: string; text: string }[] }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
      /** 最終列を強調（Signs AI列など） */
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
  blocks: Block[];
}

export interface Deck {
  id: string;
  /** 左ナビのカテゴリ */
  category: string;
  /** 担当CXO（日本語） */
  persona: string;
  /** 担当CXO（英語） */
  personaEn: string;
  /** 役職 */
  role: string;
  /** デッキタイトル */
  title: string;
  /** サブタイトル */
  subtitle: string;
  /** 一言タグライン */
  tagline: string;
  /** アクセントカラー（tailwind的なhex） */
  accent: string;
  /** アイコン絵文字 */
  icon: string;
  slides: Slide[];
}

/* ════════════════════════════════════════════════════════
 *  DECK 1 ── コトラー × 市場戦略・ポジショニング
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
          text: "外部顧客を熱狂させる前に、内部顧客（従業員）を熱狂させなければならない。",
        },
        {
          type: "paragraph",
          text: "「インターナルマーケティングは、エクスターナルマーケティングに先行する」。顧客に素晴らしい体験を届けるのは、最終的に人間だ。その人間が熱量を持って動いているかは、外部市場の結果に直接影響する。",
        },
        {
          type: "paragraph",
          text: "ところが多くの経営者は、外部市場（売上・獲得・競合）には精緻なデータと分析を持ち込みながら、内部市場（組織・人・エンゲージメント）の管理には感覚と経験しか持っていない。",
        },
        {
          type: "callout",
          tone: "accent",
          title: "Signs AI の市場定義",
          text: "組織の内側を、外部市場と同じ解像度で経営する。この非対称を解消するために Signs AI は作られた。",
        },
      ],
    },
    {
      kicker: "02 ／ セグメンテーション",
      title: "市場のセグメンテーション：なぜここに「空白」があるのか",
      blocks: [
        {
          type: "paragraph",
          text: "HR Tech と経営分析ツールはそれぞれ巨大な市場として成長してきた。しかし両者の間には、誰も埋めていない構造的な空白が存在する。",
        },
        {
          type: "table",
          headers: ["市場レイヤー", "代表ツール", "提供できること", "提供できないこと"],
          rows: [
            ["HRサーベイ層", "Lattice, Culture Amp, Qualtrics", "現場の声・エンゲージメントスコア", "KPIとの接続・経営提言"],
            ["BI/KPI分析層", "Tableau, Looker, SF Analytics", "定量データの可視化・分析", "現場の定性・人的要因の統合"],
            ["🔲 統合×提言層", "（空白）", "—", "—"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "「なぜKPIが落ちているか」既存ツールは答えられない。「何をすべきか」サーベイは提言を出せない。Signs AI は両方を同時に出す唯一のカテゴリだ。",
        },
        { type: "quote", text: "Good companies will meet needs; great companies will create markets.", author: "Philip Kotler" },
      ],
    },
    {
      kicker: "03 ／ ICP定義",
      title: "ターゲット顧客プロファイル（ICP）",
      blocks: [
        { type: "paragraph", text: "プライマリーターゲット：急成長期のSaaS企業" },
        {
          type: "table",
          headers: ["属性", "定義"],
          rows: [
            ["従業員規模", "50〜200名"],
            ["業種", "SaaS・IT・スタートアップ"],
            ["成長フェーズ", "Series B〜D ／ 売上2〜20億円"],
            ["組織課題", "急拡大による組織の希薄化・採用コスト増・エース離職"],
            ["意思決定者", "CEO ／ 経営企画 ／ CHRO（不在ならCOO）"],
          ],
        },
        {
          type: "bullets",
          items: [
            { label: "ペインの瞬間", text: "ハイパフォーマーが突然辞める、なぜかわからない" },
            { text: "採用し続けているのに「人が足りない」感覚が消えない" },
            { text: "KPIは達成しているのに、組織の空気がどこか重い" },
          ],
        },
      ],
    },
    {
      kicker: "04 ／ ポジショニング",
      title: "ポジショニング：パーセプチュアルマップ",
      blocks: [
        { type: "paragraph", text: "Signs AI の競合ポジションを2軸（経営への接続度 × KPIと人的資本の統合）で表現すると明快だ。" },
        {
          type: "code",
          text: `　　　　　高：経営への接続度
　　　　　　　　｜
　　Signs AI ●　 ← 経営参謀SaaS（新カテゴリ）
　　　　　　　　｜
KPIのみ ━━━━╋━━━━ KPI×人的資本の統合
（Tableau）　 ｜
　　Culture Amp ●
　　Lattice 　　 ← HRサーベイ専業
　　　　　　　　｜
　　　　　低：経営への接続度`,
        },
        {
          type: "callout",
          tone: "accent",
          title: "ポジショニングステートメント",
          text: "KPIが語らない組織の兆候を、AIが経営言語に翻訳する——経営参謀SaaS。右上の象限を独占しており、ここに競合は存在しない。",
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
            { tag: "第1層", title: "コア価値", desc: "組織リスクを事前に察知し、経営判断のタイミングを前倒しにする能力。離職が起きてから動くのではなく、3〜6ヶ月前に手を打てる。" },
            { tag: "第2層", title: "期待価値", desc: "KPIと組織サーベイの統合管理／月次レポートの自動生成／部署横断の比較ビュー／セキュアなデータ管理。" },
            { tag: "第3層", title: "付加価値", desc: "セマンティックレイヤー（自社化）／Slack参謀チャンネル（行動提言）／施策効果の時系列追跡（因果で語れる）。" },
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
          headers: ["比較軸", "Lattice", "Culture Amp", "Tableau", "Signs AI"],
          rows: [
            ["KPI管理", "△", "△", "◎", "◯"],
            ["組織定性把握（サーベイ）", "◎", "◎", "✕", "◎"],
            ["両者の統合分析", "✕", "✕", "✕", "◎"],
            ["AIによる経営提言", "△", "△", "△", "◎"],
            ["セマンティック文脈投入", "✕", "✕", "✕", "◎"],
            ["施策効果の因果追跡", "△", "△", "✕", "◎"],
            ["日本語・日本市場特化", "△", "△", "◯", "◎"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "勝ち筋は「統合 × 提言 × 日本特化」の3点セット。3つが重なる場所に戦場を作る——これがコトラー流ポジショニング戦略だ。",
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
            { tag: "Product", title: "製品", desc: "KPI×Voice×Policy の3レイヤーをAIが統合。「診断」ではなく「提言」まで出す点が核心。" },
            { tag: "Price", title: "価格", desc: "Freemiumで摩擦ゼロのエントリー。無料で現状スキャンを体験させ、課題を数字で見せてからアップセル。" },
            { tag: "Place", title: "流通", desc: "WebベースのSaaS（Vercel）。Slack連携で日常の中に価値を届ける。" },
            { tag: "Promotion", title: "販促", desc: "Evidence-based（ROI試算）／Proof of Concept（Freeで証明）／Community（体温経営）。" },
          ],
        },
        {
          type: "table",
          headers: ["プラン", "月額", "ポジション"],
          rows: [
            ["Free", "無料", "現状スキャン・体験"],
            ["Standard", "5万円", "課題が見えた組織のネクストステップ"],
            ["Pro", "10万円", "経営と人事の統合管理・全社戦略"],
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
            { tag: "認知", title: "Awareness", desc: "組織の数値化・HR Tech文脈でコンテンツに接触。" },
            { tag: "検討", title: "Consideration", desc: "「KPIとサーベイを統合できる唯一のツール」として評価。" },
            { tag: "体験", title: "Aha", desc: "Freeプラン：自社の組織体温を初めて数字で見る。" },
            { tag: "導入", title: "Adopt", desc: "Standard：施策の前後を追い始める。ROIが見え始める。" },
            { tag: "定着", title: "Retain", desc: "セマンティックレイヤーに自社方針が蓄積。代替不可能に。" },
            { tag: "拡張", title: "Expand", desc: "Pro：経営企画・人事・マネージャーが全員ユーザーに。" },
            { tag: "推薦", title: "Advocate", desc: "「うちの経営参謀」として他社経営者に紹介。" },
          ],
        },
        { type: "quote", text: "The best advertising is done by satisfied customers.", author: "Philip Kotler" },
      ],
    },
    {
      kicker: "09 ／ メッセージング",
      title: "セグメント別メッセージング",
      blocks: [
        {
          type: "table",
          headers: ["ターゲット", "刺さるメッセージ", "恐怖訴求", "希望訴求"],
          rows: [
            ["CEO", "組織リスクを経営判断に組み込む", "ハイパフォーマーが黙って辞める前に", "兆候を3ヶ月前に掴める経営"],
            ["CHRO/人事", "施策の効果を数字で経営に報告", "ROIを聞かれて答えられない人事", "利益を出す人事への転換"],
            ["経営企画", "KPIと人的資本を同一画面で管理", "数字は良いのに組織が壊れていく", "先行指標で次の一手を打てる"],
            ["マネージャー", "自部署の今月の動き方をAIが提言", "何をすれば良いかわからない孤独", "AIが参謀になってくれる"],
          ],
        },
      ],
    },
    {
      kicker: "10 ／ Closing",
      title: "コトラーからのメッセージ",
      blocks: [
        { type: "quote", text: "The aim of marketing is to know and understand the customer so well the product or service fits him and sells itself.", author: "Philip Kotler" },
        { type: "paragraph", text: "Signs AI はプロダクトを「売る」必要がない。組織を可視化した経営者は、すでに必要性を自分で理解している。データが語り、ROIが証明し、成功した顧客が次の顧客を連れてくる。" },
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
 *  DECK 2 ── ベニオフ × 顧客成功・SaaS事業設計
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
        { type: "paragraph", text: "1999年、Salesforceは「No Software」を宣言した。CRMをオンプレミスからクラウドへ——当時は荒唐無稽に聞こえたが、それはSaaS時代の幕開けだった。今、組織管理の世界で同じことが起きようとしている。" },
        { type: "paragraph", text: "多くの企業は今もなお、月次の人事データをExcelで管理し、会議で感覚的なレポートを聞いて意思決定している。これは2025年に「オンプレミスのCRM」を使い続けるのと同義だ。" },
        { type: "callout", tone: "accent", title: "Signs AI の宣言", text: "No Spreadsheet for Org Management. 組織の健康状態を、月次・自動・AI分析で経営の意思決定に接続する。" },
      ],
    },
    {
      kicker: "02 ／ Org 360",
      title: "Org 360：組織の全貌を一つの画面で把握する",
      blocks: [
        { type: "paragraph", text: "Salesforceが「Customer 360」で顧客の全タッチポイントを統合したように、Signs AI は「Org 360」で組織の全貌を統合する。" },
        {
          type: "steps",
          items: [
            { tag: "KPI", title: "定量", desc: "売上・商談数・解約率 → 経営の意思決定" },
            { tag: "Voice", title: "定性", desc: "11問のエンゲージメントスコア → マネジメントの行動" },
            { tag: "Policy", title: "文脈", desc: "経営方針・今期優先事項 → 現場の動き方" },
          ],
        },
        { type: "callout", tone: "accent", text: "KPI・Voice・Policy を統合しなければ組織管理に意味はない。AIが3層を統合解析し『今、何が起きていて、次に何をすべきか』を出す。" },
      ],
    },
    {
      kicker: "03 ／ V2MOM",
      title: "V2MOM：Signs AI の存在意義",
      blocks: [
        { type: "callout", tone: "accent", title: "Vision", text: "すべての組織に、体温を持たせる。KPIと現場の声が統合された意思決定が、すべての経営者の手に届く世界。" },
        {
          type: "bullets",
          items: [
            { label: "Values", text: "透明性／先手／人への敬意" },
            { label: "Methods", text: "3層統合／セマンティックレイヤー／Slack参謀チャンネル" },
            { label: "Obstacles", text: "心理的抵抗→Freeで体験／移行コスト→並行運用／信頼不足→根拠開示" },
            { label: "Measures", text: "Free転換率／NRR 120%以上／AI診断実行回数" },
          ],
        },
      ],
    },
    {
      kicker: "04 ／ カスタマーサクセス",
      title: "カスタマーサクセスファースト設計",
      blocks: [
        { type: "lead", text: "顧客の成功なくして、自社の成功はない。" },
        {
          type: "steps",
          items: [
            { tag: "STEP 1", title: "Onboard", desc: "初月：KPIとアンケートを設定。組織のベースライン体温を測定。", kpi: "回答率70%以上" },
            { tag: "STEP 2", title: "Activate", desc: "2〜3ヶ月：AI診断を経営会議・マネージャーMTGに組み込む。", kpi: "意思決定で参照される" },
            { tag: "STEP 3", title: "Value", desc: "4〜6ヶ月：施策の前後比較で因果が見え始める。", kpi: "効いた/効かないを数字で言える" },
            { tag: "STEP 4", title: "Habit", desc: "7〜12ヶ月：月次運用が習慣化。セマンティックレイヤーに方針が蓄積。", kpi: "スイッチングコスト>代替価値" },
            { tag: "STEP 5", title: "Expand", desc: "1年以降：部署数・ユーザー数が拡大。Pro移行・他部門展開。", kpi: "NRR 120%超" },
          ],
        },
      ],
    },
    {
      kicker: "05 ／ 事業モデル",
      title: "SaaS収益モデル：Land and Expand",
      blocks: [
        { type: "paragraph", text: "最初のハードルは「導入判断」ではなく「現状スキャン」だ。「まず自社の組織体温を測ってみませんか」——この提案に断る経営者はいない。" },
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
        { type: "paragraph", text: "組織の内部データという最もセンシティブな情報を扱う。Trust（信頼）は Signs AI にとって死活問題だ。" },
        {
          type: "bullets",
          items: [
            { label: "セキュリティ", text: "Row Level Security／会社IDベースのデータ分離／役割別アクセス制御" },
            { label: "AIの透明性", text: "診断には必ず根拠データを提示／断定せず『提言』を出す／文脈はユーザーが完全管理" },
            { label: "プライバシー", text: "回答は個人を特定しない集計ベース（部署単位の最小集計）" },
          ],
        },
      ],
    },
    {
      kicker: "07 ／ Slack参謀",
      title: "Slack参謀チャンネル：AIが「日常」に溶け込む",
      blocks: [
        { type: "paragraph", text: "Salesforceが Slack を買収した理由は「仕事が起きている場所にCRMを持ち込む」ためだった。Slack参謀チャンネルはこの思想の実装だ。" },
        {
          type: "code",
          text: `📢 #signs-ai-営業部

【今月の診断サマリー】
✅ KPI達成率：88%（先月比 +5pt）
⚠️ エンゲージメント：62pt（3ヶ月連続低下）

🤖 AIの提言：
「KPIは改善しているが、エンゲージメントの低下が
 続いています。成果を出すメンバーほど疲弊している
 可能性があります。今月は1on1の頻度を上げ、達成者
 への感謝表明を意識してください。」`,
        },
        { type: "callout", tone: "accent", text: "ツールを開く必要がない。AIが日常の場所（Slack）に来る——これが定着率を高める最大の仕掛けだ。" },
      ],
    },
    {
      kicker: "08 ／ ROI",
      title: "ROI：投資対効果の「ストーリー」で語る",
      blocks: [
        { type: "paragraph", text: "ケースA：急成長SaaS（150名、年間離職率12%）。離職した2名と同じスコアパターンを3ヶ月前に検知し、介入。離職ゼロで次の期を終えた。" },
        {
          type: "table",
          headers: ["項目", "金額"],
          rows: [
            ["離職抑制コスト削減（2名分）", "+600万円"],
            ["Signs AI 年間費用（Pro）", "▲135万円"],
            ["純効果", "+465万円（ROI 約4.4倍）"],
          ],
        },
        { type: "callout", tone: "accent", text: "ケースB：中堅製造業。経営会議の質が変わった。「感覚の議論」から「データの議論」へ。" },
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
            ["人事/HRBP", "施策効果の証明・経営への発言権"],
            ["マネージャー", "孤独なマネジメントにAI参謀が伴走"],
            ["従業員", "自分の声が組織改善につながる実感"],
            ["投資家・株主", "人的資本の定量管理と将来予測可能性"],
          ],
        },
        { type: "callout", tone: "accent", text: "組織が健全であることが、すべてのステークホルダーへの最大の価値提供だ。" },
      ],
    },
    {
      kicker: "10 ／ Closing",
      title: "ベニオフからのメッセージ",
      blocks: [
        { type: "quote", text: "The business of business is improving the state of the world.", author: "Marc Benioff" },
        { type: "paragraph", text: "Signs AI が解決しようとしているのは、テクノロジーの問題ではない。「組織の健康が見えないまま経営されている」という構造的な問題だ。" },
        { type: "callout", tone: "accent", text: "KPIを追うだけの経営から、「組織の体温を持った経営」へ。その転換を今日始める最もシンプルな第一歩がFreeプランだ。" },
      ],
    },
  ],
};

/* ════════════════════════════════════════════════════════
 *  DECK 0 ── 経営層・経営企画向け 総合提案（フラッグシップ）
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
        { type: "quote", text: "経営判断が遅れる本当の理由は、情報不足ではなく、正しい情報を正しいタイミングで見ていないことにある。" },
        { type: "paragraph", text: "離職・生産性低下・チームの機能不全といった問題は、結果指標（売上・利益）に現れてから初めて認識される。しかし現実には、それらはずっと前から現場に兆候として存在している。" },
        {
          type: "bullets",
          items: [
            { text: "「なんとなく空気が重い」" },
            { text: "「このチームは頑張っているのに数字が出ない」" },
            { text: "「辞めると言ってきたとき、もう手遅れだった」" },
          ],
        },
        { type: "callout", tone: "accent", text: "これは現場の問題ではない。経営が見るべきものを見ていなかった、構造的な問題だ。" },
      ],
    },
    {
      kicker: "02 ／ エビデンス",
      title: "エンゲージメントは「感情」ではなく「経営変数」だ",
      blocks: [
        { type: "quote", text: "State of the Global Workplace 2023 — 150カ国・約230万人を対象にした、現時点で最大規模の組織研究。", author: "Gallup" },
        {
          type: "table",
          headers: ["指標", "差異", "意味するところ"],
          rows: [
            ["生産性", "+23%", "同じ人数・同じコストで2割以上の成果差"],
            ["離職率", "▲43%", "採用・引き継ぎ・戦力化コストが半減に近づく"],
            ["品質不良・事故", "▲18%", "オペレーション品質とブランドリスクに直結"],
            ["顧客満足度", "+10%", "現場の熱量はそのまま顧客体験に伝播する"],
          ],
        },
        { type: "paragraph", text: "これは相関ではなく、Gallupが因果モデルで検証した「先行指標としてのエンゲージメント」の効果量だ。エンゲージメントが下がると、数四半期後にKPIが落ちる。世界全体での損失は年間8.8兆ドル（世界GDPの約9%）に上る。" },
        { type: "callout", tone: "warn", text: "「うちは数字を見ている」だけでは、すでに遅い。KPIが落ちたとき、原因は3〜6ヶ月前の現場にある。" },
      ],
    },
    {
      kicker: "03 ／ KPIの限界",
      title: "KPIだけでは、組織は動かない",
      blocks: [
        { type: "paragraph", text: "現代の経営管理は「KPI管理」に偏りすぎている。KPIは結果を教えてくれるが、なぜその結果になったかを教えてくれない。" },
        {
          type: "table",
          headers: ["KPIが示すもの", "KPIが示さないもの"],
          rows: [
            ["売上・利益・解約率", "チームの士気・疲弊度・不満の蓄積"],
            ["商談数・成約率", "現場が感じている「やりがい」と「詰まり」"],
            ["離職率（事後）", "離職する前の「予兆」"],
          ],
        },
        { type: "callout", tone: "accent", text: "KPIが落ちる原因はすでに3〜6ヶ月前の現場にある。結果だけを追っていては、永遠に後手に回る。" },
      ],
    },
    {
      kicker: "04 ／ ビジョン",
      title: "Signs AI のビジョン：組織に体温を。",
      blocks: [
        { type: "lead", text: "数字と熱量を同時に把握できる、経営参謀へ。" },
        { type: "paragraph", text: "KPI（定量）と現場の声（定性）を掛け合わせ、経営者が今まで見えていなかった「組織の兆候」を、リアルタイムかつAIの力で可視化する。これは新しいダッシュボードを増やすことではない。" },
        { type: "callout", tone: "accent", text: "「なにが起きているか」ではなく、「なぜ起きているか」と「次に何をすべきか」を提示する。" },
      ],
    },
    {
      kicker: "05 ／ 解決",
      title: "Signs AI が解決する3つの構造問題",
      blocks: [
        {
          type: "steps",
          items: [
            { tag: "①", title: "経営と現場の認識ギャップ", desc: "KPIを見ている経営と、現場のリアリティは乖離している。Signs AI は両者を同一画面でつなぐ。" },
            { tag: "②", title: "施策の効果が見えない問題", desc: "施策の前後でKPIと体温がどう変化したかを月次で記録し「打ち手の因果」を可視化。経営企画が施策のROIを語れるようになる。" },
            { tag: "③", title: "診断のブラックボックス", desc: "「なんか雰囲気が悪い」で終わらせず、AIが構造的な原因と具体的なアクションを、それぞれの立場に合った言葉で提言する。" },
          ],
        },
      ],
    },
    {
      kicker: "06 ／ プロダクト概要",
      title: "Signs AI とは何か",
      blocks: [
        { type: "paragraph", text: "Signs AI は、KPIと組織の体温を統合するBtoB SaaS。対象は従業員50〜300名規模のSaaS企業を初期想定。" },
        {
          type: "table",
          headers: ["データ種別", "内容"],
          rows: [
            ["定量（KPI）", "部署ごとの生産性・商談数・解約率など月次実績"],
            ["定性（Voice）", "独自11問のアンケートによる現場の本音スコア"],
            ["セマンティックレイヤー", "経営フェーズ・KPIの解釈・今期の優先事項をMarkdownで記述。AI診断のコンテキストとして機能"],
          ],
        },
        { type: "callout", tone: "accent", title: "独自性の核心：セマンティックレイヤー", text: "「商談数が減っている」を「今期は量より質への転換フェーズ」という文脈で解釈できるか否かで、AI診断の品質はまるで変わる。蓄積するほど精度が上がり、スイッチングコストも高まる。" },
      ],
    },
    {
      kicker: "07 ／ インサイト",
      title: "AIが生み出すインサイト",
      blocks: [
        { type: "paragraph", text: "単なるデータ表示ではなく、AIが断定的な提言を出す点が Signs AI の核心だ。" },
        {
          type: "table",
          headers: ["対象", "診断内容"],
          rows: [
            ["経営層向け", "全社の兆候と優先介入ポイント"],
            ["Admin向け", "部署横断の比較と課題の構造分析"],
            ["マネージャー向け", "自部署の今月の動き方"],
            ["現場向け", "チームの空気感の可視化"],
          ],
        },
        { type: "callout", tone: "accent", text: "「数字は☀️なのに、現場の体温は☔️」という矛盾を検知したとき、即座にアラートし、その背景仮説と打ち手を提示する。" },
      ],
    },
    {
      kicker: "08 ／ 運用",
      title: "月次運用フロー（シンプルな3ステップ）",
      blocks: [
        {
          type: "code",
          text: `① 月次KPIを入力（Web画面 or スプレッドシート）
    ↓
② アンケートURLを現場に配布（回答は数分）
    ↓
③「集計を実行」ボタンで、AIが全診断を生成`,
        },
        { type: "callout", tone: "accent", text: "運用工数は月あたり約1〜2時間を想定。専任担当は不要。" },
      ],
    },
    {
      kicker: "09 ／ 差別化",
      title: "競合との差別化",
      blocks: [
        { type: "paragraph", text: "既存のエンゲージメントサーベイは「現場の声を集める」ことはできる。しかし、それをKPIと接続して経営判断に変換する機能がない。そこが Signs AI の独自領域だ。" },
        {
          type: "table",
          highlightLastCol: true,
          headers: ["比較軸", "既存のHRツール", "既存のBI/分析", "Signs AI"],
          rows: [
            ["KPI管理", "△", "◎", "◯"],
            ["組織の定性把握", "◎", "✕", "◎"],
            ["両者の統合分析", "✕", "✕", "◎"],
            ["AIによる提言", "△", "△", "◎"],
            ["経営層へのレポート", "△", "△", "◎"],
          ],
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
            { label: "課題", text: "経営数字は追えているが「なぜ数字が動くのか」の因果が掴めていない" },
            { label: "体制", text: "離職やモチベーション低下に悩むが、HR専任チームを持てていない" },
          ],
        },
        {
          type: "table",
          headers: ["プラン", "想定規模", "主な対象"],
          rows: [
            ["Free（70日間）", "小規模検証", "試してみたい企業"],
            ["Standard", "中小規模", "部署3〜5つ程度"],
            ["Pro", "成長期SaaS", "全社統合管理・人事戦略機能"],
          ],
        },
      ],
    },
    {
      kicker: "10.5 ／ ROI",
      title: "投資対効果（ROI）シミュレーション",
      blocks: [
        { type: "quote", text: "Signs AI への投資は、離職1件・生産性損失1ヶ月分で回収できる。" },
        { type: "paragraph", text: "前提（モデルケース：従業員100名のSaaS企業）" },
        {
          type: "table",
          headers: ["前提項目", "数値", "根拠"],
          rows: [
            ["平均年収", "600万円", "想定モデル"],
            ["年間離職率（低エンゲージ）", "約10%（10名）", "業界平均"],
            ["1名あたり離職コスト", "300〜600万円", "採用・引き継ぎ・戦力化"],
            ["離職率低減", "▲43%", "Gallup 2023"],
            ["生産性向上", "+23%", "同上"],
          ],
        },
        {
          type: "table",
          headers: ["項目（Standard・年間）", "試算", "計算根拠"],
          rows: [
            ["Signs AI 年間費用", "▲75万円", "初期15万円＋月5万円×12"],
            ["離職抑制による節約", "+387万円", "3名分抑制（300万×3×0.43）"],
            ["生産性向上による効果", "+1,380万円", "人件費6億×23%÷100×10名分"],
            ["年間ROI（保守試算）", "約5倍（400%超）", "（387−75）÷75"],
          ],
        },
        {
          type: "metrics",
          items: [
            { value: "約5倍", label: "年間ROI（保守試算）" },
            { value: "+387万円", label: "離職抑制の節約" },
            { value: "▲75万円", label: "年間費用（Standard）" },
            { value: "8.8兆$", label: "世界の損失額/年" },
          ],
        },
        { type: "callout", tone: "warn", text: "※ 生産性向上効果を含めた場合、ROIは桁違いに拡大する。上記は離職抑制効果のみの保守試算。" },
      ],
    },
    {
      kicker: "10.5 ／ プラン比較",
      title: "プランごとの投資対効果",
      blocks: [
        {
          type: "table",
          headers: ["プラン", "初期費用", "月額", "年間総費用", "損益分岐点"],
          rows: [
            ["Free", "無料", "無料", "0円", "即日回収"],
            ["Standard", "150,000円", "50,000円", "750,000円", "離職抑制1名未満で回収"],
            ["Pro", "150,000円", "100,000円", "1,350,000円", "離職抑制1名以下で回収"],
          ],
        },
        { type: "callout", tone: "accent", text: "「75万円の投資で、来期の離職3件を防げるか？」——その答えを、3ヶ月後に数字で出せるのが Signs AI だ。" },
      ],
    },
    {
      kicker: "11 ／ Closing",
      title: "経営層へのメッセージ",
      blocks: [
        { type: "lead", text: "あなたの組織は今、何度ですか？" },
        { type: "paragraph", text: "KPIが達成されていても、現場が燃え尽きていれば、それは来期の問題だ。逆に、数字が苦しくても、現場の体温が高ければ、それは打てる手がある。Signs AI は、その「体温」を経営の意思決定に組み込む仕組みを提供する。" },
        { type: "callout", tone: "accent", text: "経営の解像度を上げる。それが Signs AI の存在意義だ。" },
      ],
    },
  ],
};

export const decks: Deck[] = [executive, kotler, benioff];

/** カテゴリ単位でグルーピング（左ナビ用） */
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

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
  | { type: "code"; text: string }
  /* ── 機能紹介スライド用（OSUSHIケーススタディ型） ── */
  /** メタ情報の行（対象 / 場面 など、ラベル+値の組） */
  | { type: "meta"; items: { label: string; value: string }[] }
  /**
   * 見出し付きセクション（○課題 / ●効果）。
   * marker="outline" で白丸（課題）、省略時は塗り丸（効果）。
   * items 内の **強調** はアクセント色の太字でレンダリングされる。
   */
  | { type: "section"; marker?: "outline" | "filled"; title: string; items: string[] }
  /** 関連データ・連携チップ群（TECH STACK 相当） */
  | { type: "chips"; label?: string; items: string[] };

/**
 * 左パネルに描画するビジュアル。
 * 指定があるスライドは、ゴースト番号＋タイトル再掲の代わりに図解を表示する。
 * （SlideVisuals.tsx でレンダリング。白系配色・静的CSSのみ）
 */
export type Visual =
  | {
      kind: "quadrant";
      xLabel: string;
      yLabel: string;
      /** 表示順: 左上 → 右上 → 左下 → 右下 */
      cells: { sub: string; title: string; emph?: boolean }[];
    }
  | { kind: "bigstat"; value: string; label: string; sub?: string }
  | { kind: "statgrid"; items: { value: string; label: string }[] }
  | {
      kind: "bars";
      items: { label: string; value: number; highlight?: boolean }[];
      max?: number;
      suffix?: string;
      note?: string;
    }
  | { kind: "flow"; inputs: { tag: string; label: string }[]; core: string; output: string }
  | { kind: "cycle"; items: { tag: string; label: string; desc?: string }[]; note?: string }
  | { kind: "brand"; title: string; sub?: string };

export interface Slide {
  kicker: string;
  title: string;
  /** 左パネルの実画像URL（未指定時はグラデーション＋アイコンのプレースホルダー） */
  image?: string;
  /** 左パネルの図解（image より優先度低・未指定時はゴースト番号） */
  visual?: Visual;
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
  /** lucide-react のアイコン名（DeckHub の DECK_ICONS でコンポーネントに解決） */
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
  tagline: "数字の裏側にある「組織の状態」を、経営の意思決定に",
  accent: "#38B2AC",
  icon: "BarChart3",
  slides: [
    {
      kicker: "01 ／ 課題提起",
      title: "経営に届くのは、いつも「結果」だけ",
      blocks: [
        {
          type: "lead",
          text: "月次の数字は、起きたことを教えてくれます。しかし「なぜそうなったのか」「次に何をすべきか」は、数字の外側にあります。",
        },
        {
          type: "bullets",
          items: [
            { text: "好調な部署と低迷する部署。その差が「人」によるものか「組織」によるものか、判然としない" },
            { text: "数字は届いているのに、現場の活力が失われているように感じる" },
            { text: "課題に気づいたときには、すでに数字に表れた後である" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "これは現場の問題ではなく、「組織の状態」を捉える仕組みを持たなかった、経営の構造的な課題です。",
        },
      ],
    },
    {
      kicker: "02 ／ 本質的な問い",
      title: "その増員は、本当に必要でしょうか",
      blocks: [
        {
          type: "lead",
          text: "「人手が足りない」——その要望の背景には、別の原因が隠れていることが少なくありません。",
        },
        {
          type: "bullets",
          items: [
            { label: "生産性の低下", text: "チームが疲弊し、以前と同じ成果により多くの工数がかかっている" },
            { label: "活力の低下", text: "在籍はしていても、実質的な稼働が落ちている" },
            { label: "機能不全", text: "マネジメントが孤立し、組織として力を発揮できていない" },
          ],
        },
        {
          type: "callout",
          tone: "warn",
          text: "解決すべき課題を放置したまま人を増やしても、成果には結びつきません。冷えた組織への増員は、穴の空いたバケツに水を注ぐようなものです。",
        },
      ],
    },
    {
      kicker: "03 ／ 見えること①",
      title: "「組織の温度」と「KPI」を重ねると、打ち手が変わる",
      visual: {
        kind: "quadrant",
        xLabel: "KPI（成果） → 高",
        yLabel: "組織の温度 → 高",
        cells: [
          { sub: "温度 高 × KPI 低", title: "打ち手を見直す" },
          { sub: "温度 高 × KPI 高", title: "強みを横展開" },
          { sub: "温度 低 × KPI 低", title: "立て直しが先" },
          { sub: "温度 低 × KPI 高", title: "疲弊のサイン", emph: true },
        ],
      },
      blocks: [
        {
          type: "table",
          highlightLastCol: true,
          headers: ["組織の状態", "示している意味", "経営の打ち手"],
          rows: [
            ["温度 高 × KPI 高", "健全な成長状態", "強みを横展開し、再現性を高める"],
            ["温度 高 × KPI 低", "意欲はあるが戦略・やり方に課題", "増員ではなく、打ち手の見直しを"],
            ["温度 低 × KPI 高", "数字は出ているが疲弊が進行", "最も見落とされやすい危険信号"],
            ["温度 低 × KPI 低", "構造的な課題", "立て直しが先、採用は後"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "同じ「KPI低迷」でも、組織の温度が分かれば原因はまったく異なります。人を変えるべきか、打ち手を変えるべきか——その判断軸が手に入ります。",
        },
      ],
    },
    {
      kicker: "04 ／ 見えること②",
      title: "経営が最も知りたいのは、部署ごとの「生産性」",
      visual: {
        kind: "bars",
        max: 140,
        items: [
          { label: "営業1課（5名）", value: 132, highlight: true },
          { label: "CS部（5名）", value: 96 },
          { label: "開発部（5名）", value: 88 },
          { label: "営業2課（5名）", value: 74, highlight: true },
        ],
        note: "一人当たり生産性の対目標比（イメージ）。同じ人数でも、部署の成果はここまで変わる。",
      },
      blocks: [
        {
          type: "lead",
          text: "同じ人数でも、部署が生み出す成果は何倍にも変わります。どこに投資し、どこを立て直すべきか——その解像度を高めます。",
        },
        {
          type: "bullets",
          items: [
            { text: "どの部署が、少ない人数で高い成果を上げているのか" },
            { text: "どの部署が、人数に見合った成果を出せていないのか" },
            { text: "その差は「人材」によるものか、「組織の状態」によるものか" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "部署ごとの生産性と温度を並べて捉えることで、増員・再配置・立て直しの優先順位を、根拠を持って判断できます。",
        },
      ],
    },
    {
      kicker: "05 ／ エビデンス",
      title: "組織の状態は、業績を動かす「経営変数」です",
      visual: {
        kind: "statgrid",
        items: [
          { value: "+18%", label: "生産性（上位 vs 下位組織）" },
          { value: "+23%", label: "収益性" },
          { value: "▲81%", label: "欠勤率" },
          { value: "8%", label: "日本のエンゲージメント率" },
        ],
      },
      blocks: [
        {
          type: "lead",
          text: "組織の状態が良い企業群は、業績で明確に上回る——これは感覚論ではなく、統計です。",
        },
        {
          type: "paragraph",
          text: "Gallupの大規模なメタ分析によれば、組織の状態が良好な企業群は、そうでない企業群に比べ生産性・収益性で明確に上回ります。一方、日本のエンゲージメント率は8%と世界最低水準。裏を返せば、日本企業にはここに世界で最も大きな改善余地が残されています。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "「組織の状態」は福利厚生の話ではなく、生産性・収益性を直接動かす経営変数です。測らない理由は、ありません。",
        },
      ],
    },
    {
      kicker: "06 ／ ビジョン",
      title: "Signs AI のビジョン：組織に体温を。",
      visual: {
        kind: "brand",
        title: "組織に体温を。",
        sub: "数字と熱量を、同じ画面で。",
      },
      blocks: [
        {
          type: "lead",
          text: "数字（KPI）と熱量（組織の状態）を、同じ画面で捉える。感覚に頼る経営から、根拠に基づく経営へ。",
        },
        {
          type: "bullets",
          items: [
            { text: "「何が起きているか」ではなく「なぜ起きているか」を明らかにする" },
            { text: "「次に何をすべきか」を、経営の言葉で提言する" },
            { text: "リアルタイム × AI で、意思決定の精度とスピードを高める" },
          ],
        },
      ],
    },
    {
      kicker: "07 ／ 仕組み",
      title: "Signs AI とは何か——3つのデータの統合",
      visual: {
        kind: "flow",
        inputs: [
          { tag: "KPI", label: "定量データ" },
          { tag: "Voice", label: "現場の声" },
          { tag: "Policy", label: "経営方針" },
        ],
        core: "AI 統合分析",
        output: "「なぜ」と「次の一手」",
      },
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "KPI",
              title: "定量データ",
              desc: "部署ごとの生産性・商談数・解約率などの月次実績",
            },
            {
              tag: "Voice",
              title: "定性データ",
              desc: "独自設計のアンケートによる、現場の率直な声",
            },
            {
              tag: "Policy",
              title: "経営の文脈",
              desc: "経営方針や優先事項をAIの判断軸として投入。運用するほど精度が高まる",
            },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "この3つが統合されて初めて、「なぜその数字なのか」に答えられます。",
        },
      ],
    },
    {
      kicker: "08 ／ AIの提言",
      title: "それぞれの立場に、必要な示唆を",
      blocks: [
        {
          type: "bullets",
          items: [
            { label: "経営層へ", text: "全社の状態と、優先して手を打つべき領域" },
            { label: "部門責任者へ", text: "自部署の今の状態と、取るべき具体的な行動" },
            { label: "現場へ", text: "チームの状態の可視化と、声が届いているという実感" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "「数字は良好なのに、現場の活力は失われている」といった矛盾を捉え、その背景にある仮説と打ち手を、すぐに提示します。",
        },
      ],
    },
    {
      kicker: "09 ／ 差別化",
      title: "既存の仕組みとは、見ている対象が違います",
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "サーベイ",
              title: "「測る」で終わる",
              desc: "組織の状態を点数化するが、原因や打ち手までは示さない",
            },
            {
              tag: "BI・分析",
              title: "「数字」しか見ない",
              desc: "結果は分かるが、その背景にある人の状態は捉えられない",
            },
            {
              tag: "Signs AI",
              title: "「なぜ」と「次の一手」",
              desc: "数字と人の状態を統合し、原因の解明と打ち手の提言まで踏み込む",
            },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "既存ツールが「結果の可視化」にとどまるのに対し、Signs AI は「原因の解明と打ち手の提言」までを担います。ここに重なる仕組みは、存在しません。",
        },
      ],
    },
    {
      kicker: "10 ／ 運用",
      title: "運用は、無理なく続けられる設計です",
      visual: {
        kind: "cycle",
        items: [
          { tag: "月初", label: "KPI入力", desc: "前月実績を記録（数分）" },
          { tag: "月中", label: "ボイスチェック配布", desc: "匿名回答・3〜5分" },
          { tag: "月末", label: "AI診断", desc: "各層向けの提言を自動生成" },
        ],
        note: "毎月くり返す・月1〜2時間",
      },
      blocks: [
        {
          type: "lead",
          text: "月初にKPIを入れ、月中に現場へアンケートを配り、月末にAIが診断する。それだけです。",
        },
        {
          type: "bullets",
          items: [
            { label: "入力の負担", text: "KPIはWeb画面またはスプレッドシートで数分。回答は匿名で3〜5分" },
            { label: "分析の負担", text: "ゼロ。「集計を実行」を押せば、各層向けの提言まで自動生成" },
            { label: "続ける工夫", text: "Slack連携で回答リマインドと診断共有まで自動化" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "月あたりおよそ1〜2時間。専任の担当者がいなくても、継続的に組織の状態を捉えられます。組織診断は「続けられるか」がすべてです。",
        },
      ],
    },
    {
      kicker: "11 ／ Closing",
      title: "経営の皆様へ",
      visual: {
        kind: "brand",
        title: "その組織は、成果を出せる状態にあるか。",
        sub: "Signs AI — 組織に体温を。",
      },
      blocks: [
        {
          type: "lead",
          text: "増員や投資を決める前に、まず問うべきことがあります。「その組織は、成果を出せる状態にあるか」。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "解決すべき課題を残したままの組織に人や資金を投じても、実を結びません。組織の状態を経営の意思決定に組み込むこと——それが、Signs AI のご提案です。",
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
  subtitle: "組織を強くする人事へ。",
  tagline: "人事の貢献を、組織の変化として可視化する",
  accent: "#4F46E5",
  icon: "Users",
  slides: [
    {
      kicker: "01 ／ 課題",
      title: "人事の貢献は、どうすれば示せるのか",
      blocks: [
        {
          type: "lead",
          text: "採用も、育成も、評価制度の改定も。一つひとつは確かに組織を支えています。それでも「成果は？」と問われると、数字で語りにくい——そう感じる場面は、少なくありません。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "これは人事の力不足ではありません。施策の影響を「組織の変化」として捉える仕組みが、これまで無かっただけです。",
        },
      ],
    },
    {
      kicker: "02 ／ 人事の本質",
      title: "人事の役割は、採用ではなく「組織を強くすること」",
      blocks: [
        {
          type: "lead",
          text: "採用は手段の一つにすぎません。本来の使命は、組織が継続して成果を出せる状態をつくることにあります。",
        },
        {
          type: "bullets",
          items: [
            { text: "良い人を採ること以上に、採った人が活躍できる環境をつくること" },
            { text: "制度や研修を「実施する」ことより、それを組織の力に変えること" },
            { text: "目の前の欠員対応より、組織が強くなり続ける仕組みづくり" },
          ],
        },
      ],
    },
    {
      kicker: "03 ／ KPIの再定義",
      title: "採用のKPIは、「何人採ったか」だけではない",
      blocks: [
        {
          type: "lead",
          text: "本当に問うべきは採用数ではなく、「活躍できる人材を迎えられたか」です。",
        },
        {
          type: "bullets",
          items: [
            { label: "採用数", text: "目標は達成した。しかし、その先が見えていない" },
            { label: "定着と活躍", text: "迎えた人材は、力を発揮できているか" },
            { label: "組織への影響", text: "その採用は、チームの状態を良くしたか" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "採用の成否は、入社後の活躍と組織の変化で測れます。KPIと組織の状態を併せて見ることで、「良い採用だったか」を後から検証できます。",
        },
      ],
    },
    {
      kicker: "04 ／ 施策の可視化",
      title: "その施策は、本当に意味があったのか",
      blocks: [
        {
          type: "lead",
          text: "研修も、組織再編も、評価制度の刷新も——「やった」で終わらせず、組織にどう効いたのかを定量で確かめたいはずです。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "施策の実施月を記録し、前後で組織の状態とKPIの変化を追う。「あの研修は、翌月にチームの状態を改善した」と、根拠を持って語れるようになります。",
        },
      ],
    },
    {
      kicker: "05 ／ 経営と同じ言語",
      title: "「組織の温度」と「KPI」で、人事の打ち手を決める",
      visual: {
        kind: "quadrant",
        xLabel: "KPI（成果） → 高",
        yLabel: "組織の温度 → 高",
        cells: [
          { sub: "温度 高 × KPI 低", title: "業務設計を支援" },
          { sub: "温度 高 × KPI 高", title: "採用・育成の基準に" },
          { sub: "温度 低 × KPI 低", title: "組織開発が先" },
          { sub: "温度 低 × KPI 高", title: "離職予防を急ぐ", emph: true },
        ],
      },
      blocks: [
        {
          type: "table",
          highlightLastCol: true,
          headers: ["組織の状態", "示している意味", "人事の打ち手"],
          rows: [
            ["温度 高 × KPI 高", "健全な状態", "強みを言語化し、採用・育成の基準に"],
            ["温度 高 × KPI 低", "やり方・戦略に課題", "増員より、業務設計とマネジメント支援"],
            ["温度 低 × KPI 高", "疲弊が進行中の危険信号", "早期の離職予防・対話の強化"],
            ["温度 低 × KPI 低", "構造的な課題", "組織開発が先、採用は後"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "経営が見ている「組織の温度 × KPI」と同じ視点で語れること。それが、人事が経営に信頼される第一歩です。",
        },
      ],
    },
    {
      kicker: "06 ／ 継続観測",
      title: "一度の調査ではなく、継続して組織の体温を見る",
      blocks: [
        {
          type: "lead",
          text: "組織の状態は、絶えず変化します。一度きりのサーベイでは、その変化も、施策の効果も捉えられません。",
        },
        {
          type: "bullets",
          items: [
            { text: "毎月、同じ指標で組織の体温を観測する" },
            { text: "定量の変化を時系列で追い、施策の前後を比較する" },
            { text: "「意味のあった施策」と「そうでない施策」を見分ける" },
          ],
        },
      ],
    },
    {
      kicker: "07 ／ エビデンス",
      title: "組織の状態は、会社の利益に直結する",
      visual: {
        kind: "statgrid",
        items: [
          { value: "+23%", label: "収益性（上位 vs 下位組織）" },
          { value: "+18%", label: "生産性" },
          { value: "▲43%", label: "離職率（最大）" },
          { value: "8%", label: "日本のエンゲージメント率" },
        ],
      },
      blocks: [
        {
          type: "lead",
          text: "組織を強くする人事の仕事は、そのまま経営の利益に結びついています。",
        },
        {
          type: "paragraph",
          text: "Gallupの大規模なメタ分析によれば、組織の状態が良好な企業群は、収益性・生産性で明確に上回り、離職率は大きく下がります。離職を1人防ぐだけで、採用・育成コストの数百万円が守られます。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "「エンゲージメント向上」を福利厚生の言葉ではなく、利益の言葉で経営に語れるようになります。",
        },
      ],
    },
    {
      kicker: "08 ／ 仕組み",
      title: "声・数字・方針の複雑さを、AIが読み解く",
      visual: {
        kind: "flow",
        inputs: [
          { tag: "Voice", label: "現場の声" },
          { tag: "KPI", label: "定量データ" },
          { tag: "Policy", label: "会社の方針" },
        ],
        core: "AI 統合分析",
        output: "次に手を打つべき場所",
      },
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "Voice",
              title: "現場の声",
              desc: "アンケートで集まる、定性的な組織の状態",
            },
            {
              tag: "KPI",
              title: "定量データ",
              desc: "部署ごとの生産性・成果などの月次実績",
            },
            {
              tag: "Policy",
              title: "会社の方針",
              desc: "経営方針や優先事項を、判断の文脈として投入",
            },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "本来は結びつけにくいこの3つを、AIが統合して読み解き、「次にどこへ手を打つべきか」を提示します。",
        },
      ],
    },
    {
      kicker: "09 ／ 運用",
      title: "運用は、無理なく続けられる設計です",
      visual: {
        kind: "cycle",
        items: [
          { tag: "月初", label: "KPI入力", desc: "前月実績を記録（数分）" },
          { tag: "月中", label: "ボイスチェック配布", desc: "匿名回答・3〜5分" },
          { tag: "月末", label: "AI診断", desc: "診断と提言を自動生成" },
        ],
        note: "毎月くり返す・月1〜2時間",
      },
      blocks: [
        {
          type: "lead",
          text: "サーベイ疲れを起こさない。それが継続的な組織観測の絶対条件です。",
        },
        {
          type: "bullets",
          items: [
            { label: "回答者", text: "匿名・3〜5分。設問は標準11問＋自社カスタム最大3問" },
            { label: "運用者", text: "KPI入力とURL配布のみ。リマインドはSlack連携で自動化" },
            { label: "分析", text: "ゼロ。「集計を実行」で診断と提言まで自動生成" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "運用工数は月あたりおよそ1〜2時間。専任の担当者がいなくても、人事が一人でも回せる設計です。",
        },
      ],
    },
    {
      kicker: "10 ／ はじめ方",
      title: "まずは、自社の組織の体温を測ることから",
      visual: {
        kind: "bigstat",
        value: "70日間",
        label: "無料トライアル",
        sub: "Standard全機能・カード登録不要",
      },
      blocks: [
        {
          type: "table",
          headers: ["プラン", "月額", "こんな段階に"],
          rows: [
            ["Free トライアル", "0円（70日間）", "Standard全機能をまるごと体験"],
            ["Team", "3万円", "小規模チームでまず始めたい"],
            ["Standard", "10万円", "部署ごとに課題を深掘りしたい"],
            ["Pro", "30万円〜", "人件費ROIまで、経営と連動させたい"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "まずは70日間のトライアルで、現状を可視化するところから。2〜3回の月次サイクルを回せば、どこが冷えているか、どの施策が効いたかが、数字で見えてきます。",
        },
      ],
    },
    {
      kicker: "11 ／ Closing",
      title: "人事は、経営の利益に最も近い部門です",
      visual: {
        kind: "brand",
        title: "人事を、戦略部門へ。",
        sub: "Signs AI — 組織に体温を。",
      },
      blocks: [
        {
          type: "lead",
          text: "人を動かし、組織を強くする人事の仕事は、本来、企業の成果に最も大きく影響します。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "貢献が見えにくかったのは、価値がなかったからではなく、示す手段が無かっただけです。組織の変化を数字で語れるようになったとき、人事は「組織を強くする戦略部門」になります。Signs AI は、そのための土台です。",
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
  subtitle: "定型業務は消える。組織を動かす人事は残る。",
  tagline: "Gallup・経済産業省・矢野経済研究所ほか一次データに基づく調査レポート",
  accent: "#0EA5E9",
  icon: "FileText",
  slides: [
    {
      kicker: "01 ／ 序論",
      title: "「人事はAIに消される」は、正しい問いではない",
      blocks: [
        {
          type: "lead",
          text: "問うべきは「人事が消えるか」ではなく、「人事のどの仕事が消え、どの仕事が残るか」だ。",
        },
        {
          type: "paragraph",
          text: "労務・採用といった定型業務はクラウドとAIへ急速にシフトしている。一方で、組織開発や人事戦略といった上流の判断業務は、AI時代にむしろ重要性を増している。本レポートはGallup・経済産業省・矢野経済研究所などの一次データをもとに、その分岐点を5業務に分解して検証する。",
        },
        {
          type: "callout",
          tone: "accent",
          title: "本レポートの結論（先出し）",
          text: "人事の将来性は「AIに奪われるか」ではなく、「人事自身がAIを使う側に回れるか」で決まる。",
        },
      ],
    },
    {
      kicker: "02 ／ 世界の危機",
      title: "従業員エンゲージメントは、世界規模で後退している",
      visual: {
        kind: "statgrid",
        items: [
          { value: "20%", label: "世界の従業員エンゲージメント率（2025）" },
          { value: "4,380億ドル", label: "低下による世界経済の損失（推計）" },
          { value: "34%", label: "「人生で開花している」と答えた人" },
          { value: "12年で2度目", label: "グローバル指標が前年から下落" },
        ],
      },
      blocks: [
        {
          type: "lead",
          text: "世界の従業員エンゲージメント率は23%→21%→20%と低下。過去12年で2度目の前年割れだ。",
        },
        {
          type: "paragraph",
          text: "この低下による世界経済への損失は4,380億ドル（約65兆円）と試算される。とりわけマネージャー層の落ち込みが顕著で、チームを支える中間層から先に消耗が進んでいる。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "出典：Gallup, Inc. — State of the Global Workplace 2026 Report（gallup.com/workplace/349484）",
        },
      ],
    },
    {
      kicker: "03 ／ 日本の現在地",
      title: "日本のエンゲージメント率は、世界最低水準",
      visual: {
        kind: "bigstat",
        value: "8%",
        label: "日本の従業員エンゲージメント率",
        sub: "世界平均 20%・東アジア平均 18%",
      },
      blocks: [
        {
          type: "lead",
          text: "日本のエンゲージメント率は8%。世界平均20%・東アジア18%を大きく下回る、世界最低水準だ。",
        },
        {
          type: "paragraph",
          text: "前日に強いストレスを経験した人は39%、「人生で開花している」と答えた人は31%（世界34%）と、ストレス・ウェルビーイング指標も世界平均より悪い。裏を返せば、日本企業にはエンゲージメント改善の伸びしろが世界で最も大きく残されている。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "出典：Gallup — State of the Global Workplace: Japan Country-Level Data（gallup.com/workplace/705794）",
        },
      ],
    },
    {
      kicker: "04 ／ 影響度マップ",
      title: "人事5業務のAI影響度マップ（2026年版）",
      visual: {
        kind: "bars",
        items: [
          { label: "労務管理", value: 85 },
          { label: "採用業務", value: 75 },
          { label: "人材育成・研修", value: 50 },
          { label: "評価・配置・異動", value: 40 },
          { label: "組織開発・人事戦略", value: 10, highlight: true },
        ],
        note: "AI影響度（代替されやすさ）。組織開発だけが、AIに置き換わらない。",
      },
      blocks: [
        {
          type: "table",
          highlightLastCol: true,
          headers: ["業務領域", "AI影響度", "残る人間の役割"],
          rows: [
            ["労務管理（給与・社保）", "85%", "法改正解釈・労務トラブル対応"],
            ["採用業務", "75%", "最終採用判断・信頼構築・条件交渉"],
            ["人材育成・研修", "50%", "戦略逆算の研修設計・現場接続"],
            ["評価・配置・異動", "40%", "相性判断・制度設計・面談"],
            ["組織開発・人事戦略", "10%", "経営との連動・組織文化設計"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "出典：シゴトAI（shigoto-ai.net）2026年版『人事AI影響度マップ』。経産省・読売新聞・日経・HR総研・JDLA等の一次データを統合分析。",
        },
      ],
    },
    {
      kicker: "05 ／ 消える業務",
      title: "定型処理はAIへ——「消える人事」の正体",
      blocks: [
        {
          type: "bullets",
          items: [
            { label: "労務管理 85%", text: "給与計算・年末調整・社保手続きはfreee/SmartHR/MF＋AI-OCRで自動化。給与計算工数70%削減の事例が複数報告。" },
            { label: "採用業務 75%", text: "書類スクリーニング・日程調整・スカウト原稿はAIの主戦場。自律型スカウトAIも実用化。" },
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "ただし「最終判断」は人間に残る",
          text: "HR総研2025：採用にAIを活用する企業は47%に達したが、最終採用判断をAIに任せる企業はわずか3%。AIは定型処理を代替するが、判断と責任は人間に残る。",
        },
      ],
    },
    {
      kicker: "06 ／ 残る業務",
      title: "組織開発という、価値の源泉（AI影響度10%）",
      visual: {
        kind: "bigstat",
        value: "10%",
        label: "組織開発・人事戦略のAI影響度",
        sub: "5業務の中で、最もAIに代替されない領域",
      },
      blocks: [
        {
          type: "lead",
          text: "経営戦略と連動した人材戦略、組織文化の設計、HRBPとして事業に伴走する役割——ここはAI代替がほぼ進まない。",
        },
        {
          type: "paragraph",
          text: "「経営が何に困っているか」を察知し、人材データと事業データを掛け合わせて打ち手を設計する。この上流工程こそが、AI時代の人事の価値を左右する。エンゲージメント測定の世界標準であるGallup Q12フレームワーク（25年以上・2,500万人超の回答データに基づく12項目／4階層）も、数値の先にある「組織をどう動かすか」の判断は人間に委ねられている。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "出典：Gallup, Inc. — The Q12 Employee Engagement Survey（gallup.com/workplace/356063）／ Q12はGallupの著作物。",
        },
      ],
    },
    {
      kicker: "07 ／ 構造データ",
      title: "440万人余剰と339万人不足——橋を架けるのは人事",
      visual: {
        kind: "statgrid",
        items: [
          { value: "440万人", label: "2040年 事務系の余剰（経産省）" },
          { value: "339万人", label: "2040年 AI・データ人材の不足" },
          { value: "5,000人", label: "みずほFG 配置転換（10年スパン）" },
          { value: "16万人", label: "事務派遣大手3社の育成計画" },
        ],
      },
      blocks: [
        {
          type: "lead",
          text: "余剰と不足は表裏一体。リスキリングで橋を架けられる距離にある。",
        },
        {
          type: "paragraph",
          text: "経産省「未来人材ビジョン」は2040年に事務系440万人余剰、AI・データ人材339万人不足と推計する。みずほFGの5,000人は即時リストラではなく10年スパンの配置転換であり、その配置先設計・リスキリング・新ポジション創出こそ人事の仕事である。",
        },
        {
          type: "callout",
          tone: "accent",
          text: "出典：経済産業省「未来人材ビジョン」／ 読売新聞オンライン（みずほFG報道, 2026/2）／ 日本経済新聞（事務派遣16万人育成, 2026/1）",
        },
      ],
    },
    {
      kicker: "08 ／ 警鐘",
      title: "「AI風リストラ」——人事が陥る加害者ジレンマ",
      blocks: [
        {
          type: "quote",
          text: "AIが浸透しようがしまいが、元々やりたかったリストラをAIブームのどさくさでやっているだけではないか。",
          author: "テック系ベンチャーキャピタリスト（X, 2026/2）",
        },
        {
          type: "paragraph",
          text: "「AIだから仕方ない」というナラティブが、本来は経営判断として説明されるべきリストラを覆い隠す。この構造を見抜けない人事は加害者側に立たされる。逆に、配置転換先を真剣に設計しリスキリング機会を提供できる人事は、経営からも社員からも信頼される稀少な人材になる。これが2026年以降の人事のコアバリューだ。",
        },
      ],
    },
    {
      kicker: "09 ／ 残る人事の市場価値",
      title: "「残る人事」のキャリアと、伸びる市場",
      blocks: [
        {
          type: "table",
          headers: ["キャリア移動先", "想定年収", "備考"],
          rows: [
            ["HRBP（事業部門に伴走）", "800〜1,100万円", "求人 前年比1.4倍"],
            ["ピープルアナリティクス専門家", "700〜1,000万円", "人材データ分析の専門職"],
            ["HRテック × AI業務設計", "650〜900万円", "AI導入の主導役"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "日本の従業員エンゲージメント市場は2025年に134億円（前年比120.4%）へ急成長。AI時代に「組織を動かす人事」の市場価値は上がり続けている。出典：矢野経済研究所『従業員エンゲージメント市場に関する調査』2025年版／ 各社転職データ。",
        },
      ],
    },
    {
      kicker: "10 ／ 結論",
      title: "AI時代に残る人事の条件",
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "①",
              title: "AIを「使う側」に回る",
              desc: "定型業務はAIに任せ、浮いた時間を組織開発・ピープルアナリティクス・HRテック企画へ投資する。",
            },
            {
              tag: "②",
              title: "経営と現場をつなぐ",
              desc: "人材データと事業データを掛け合わせ、「次に何をすべきか」を経営言語で提言する。",
            },
            {
              tag: "③",
              title: "配置転換とリスキリングを設計する",
              desc: "余剰と不足の間に橋を架ける。AI化が進むほど、この戦略職としての需要は高まる。",
            },
          ],
        },
        {
          type: "quote",
          text: "測定できないものは、改善できない。",
          author: "Peter F. Drucker（経営思想家）",
        },
      ],
    },
    {
      kicker: "11 ／ 出典一覧",
      title: "調査ソース・参考文献",
      blocks: [
        {
          type: "bullets",
          items: [
            { label: "Gallup（世界）", text: "State of the Global Workplace 2026 Report — gallup.com/workplace/349484" },
            { label: "Gallup（日本）", text: "State of the Global Workplace: Japan Country-Level Data — gallup.com/workplace/705794" },
            { label: "Gallup（Q12）", text: "The Q12 Employee Engagement Survey — gallup.com/workplace/356063" },
            { label: "経済産業省", text: "未来人材ビジョン — meti.go.jp/shingikai/economy/mirai_jinzai" },
            { label: "矢野経済研究所", text: "従業員エンゲージメント市場に関する調査 2025年版 — yano.co.jp" },
            { label: "シゴトAI", text: "人事AI影響度マップ 2026年版 — shigoto-ai.net/ai-impact/jinji-ai-shourasei" },
            { label: "HR総研 / 報道", text: "採用AI活用調査2025（hrpro.co.jp）／ 読売新聞・日本経済新聞" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "本レポートの数値は各一次ソース（取得時点2026年5月）に基づく。引用・転載の際は各機関の利用規約に従うこと。Gallup Q12は著作物であり無断複製・調査利用には許諾が必要。",
        },
      ],
    },
    {
      kicker: "12 ／ Signs AI",
      title: "このレポートが示した課題を、解決するために。",
      visual: {
        kind: "brand",
        title: "組織に体温を。",
        sub: "Signs AI — 70日間無料トライアル",
      },
      blocks: [
        {
          type: "lead",
          text: "日本8%という世界最低のエンゲージメント率。組織開発10%領域の放置。施策の効果が数字で語れない人事。Signs AIはこの3つの構造問題に、正面から向き合う。",
        },
        {
          type: "steps",
          items: [
            {
              tag: "課題①",
              title: "エンゲージメント8% → 可視化と改善",
              desc: "KPI×現場の声を月次で統合。「どの部署が・なぜ・冷えているか」を数字で把握する。",
            },
            {
              tag: "課題②",
              title: "組織開発10%領域 → AIで強化",
              desc: "AIに代替されない上流業務を、AIがさらに強くする。戦略職としての人事を支えるインフラ。",
            },
            {
              tag: "課題③",
              title: "施策効果が語れない → ROIを数字に",
              desc: "施策の前後でKPIと体温の変化を追い、「あの研修は翌月スコアを改善した」と経営に報告できる。",
            },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          title: "Signs AI — 組織に体温を。",
          text: "KPIと現場の声を統合し、AIが経営と人事に「次の打ち手」を提言する。70日間無料で、自社の組織体温を測るところから始められる。",
        },
      ],
    },
  ],
};

/* ════════════════════════════════════════════════════════
 *  DECK 4 ── 機能紹介（Product Tour）
 *  ・1機能 = 1スライド。OSUSHIケーススタディ型のレイアウト
 *  ・meta（対象/場面）→ lead（価値1行）→ section○課題 → section●効果 → chips（連携）
 * ════════════════════════════════════════════════════════ */
const featureTour: Deck = {
  id: "feature-tour",
  category: "機能紹介",
  persona: "Signs AI 全機能ガイド",
  personaEn: "Product Tour",
  role: "Signs AI 機能紹介",
  title: "Signs AI 機能紹介",
  subtitle: "組織の体温を、すべての機能で。",
  tagline: "KPI・現場の声・経営方針を統合する10の機能",
  accent: "#F43F5E",
  icon: "Blocks",
  slides: [
    {
      kicker: "01 ／ KPI管理",
      title: "組織のKPI・KPI推移",
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "経営・部門長" },
            { label: "画面", value: "KPIダッシュボード" },
          ],
        },
        {
          type: "lead",
          text: "部署ごとの月次実績を一元管理し、推移を時系列で追う。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "数字が部署ごとにバラバラなシートへ散在している",
            "前月比やトレンドが直感的に見えない",
            "入力が手間で、記録が続かない",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "月次KPIを **数分** で入力・記録",
            "部署×指標を **時系列グラフ** で可視化",
            "第2軸での内訳分析にも対応",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["組織のKPI", "KPI推移", "スプレッドシート入力"],
        },
      ],
    },
    {
      kicker: "02 ／ 現場の声",
      title: "ボイスチェック",
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "全社員" },
            { label: "頻度", value: "毎月・匿名" },
          ],
        },
        {
          type: "lead",
          text: "現場の率直な声を、匿名アンケートで毎月収集する。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "数字だけでは現場の温度が分からない",
            "年1回のサーベイでは変化を捉えられない",
            "本音がなかなか集まらない",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "URL配布で **3〜5分** ・匿名回答",
            "独自設計の設問で組織の状態を定量化",
            "毎月の定点観測で変化を追跡",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["ボイスチェック", "匿名アンケート", "回答フォーム"],
        },
      ],
    },
    {
      kicker: "03 ／ 可視化",
      title: "マトリックス分析（温度×KPI）",
      visual: {
        kind: "quadrant",
        xLabel: "KPI達成率 → 高",
        yLabel: "組織の温度 → 高",
        cells: [
          { sub: "温度 高 × KPI 低", title: "打ち手を見直す" },
          { sub: "温度 高 × KPI 高", title: "強みを横展開" },
          { sub: "温度 低 × KPI 低", title: "立て直しが先" },
          { sub: "温度 低 × KPI 高", title: "疲弊のサイン", emph: true },
        ],
      },
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "経営・部門長" },
            { label: "画面", value: "マトリックス" },
          ],
        },
        {
          type: "lead",
          text: "温度×KPIの4象限で、“今すぐ手を打つべき部署”が一目でわかる。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "KPI低迷の原因が人か組織か判別できない",
            "温度低×KPI高の危険信号を見落とす",
            "全社を俯瞰して優先順位がつけられない",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "全部署を **バブルチャート** でプロット",
            "4象限ごとに **推奨アクション** を提示",
            "時系列で象限の移動を追える",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["マトリックス", "バブルチャート", "KPI×温度"],
        },
      ],
    },
    {
      kicker: "04 ／ 体温",
      title: "組織の体温",
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "経営・人事" },
            { label: "画面", value: "組織の体温" },
          ],
        },
        {
          type: "lead",
          text: "組織のエンゲージメントを定点観測し、変化を可視化する。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "エンゲージメントが感覚値でしか語れない",
            "施策の効果を温度で測れない",
            "部署間の温度差が見えない",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "部署別の **組織体温** をスコア化",
            "月次の推移と前月比を表示",
            "冷えている部署を早期に検知",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["組織の体温", "エンゲージメント", "部署別スコア"],
        },
      ],
    },
    {
      kicker: "05 ／ AI診断",
      title: "AI組織診断・アクション",
      visual: {
        kind: "flow",
        inputs: [
          { tag: "KPI", label: "定量データ" },
          { tag: "Voice", label: "現場の声" },
          { tag: "Policy", label: "経営方針" },
        ],
        core: "AI 統合分析",
        output: "役割別の提言",
      },
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "経営・部門長・人事" },
            { label: "出力", value: "各層向けの提言" },
          ],
        },
        {
          type: "lead",
          text: "KPI・現場の声・経営方針をAIが統合し、次の打ち手を提言する。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "データはあるが「で、何をすべきか」が分からない",
            "立場ごとに必要な示唆が異なる",
            "分析に時間がかかる",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "3データ統合でAIが **自動診断**",
            "経営／部門長／現場へ **役割別の提言**",
            "「集計を実行」で即時に生成",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["AI組織診断", "アクション", "Claude API"],
        },
      ],
    },
    {
      kicker: "06 ／ 生産性",
      title: "人件費・生産性分析",
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "経営・経営企画" },
            { label: "画面", value: "人件費分析" },
          ],
        },
        {
          type: "lead",
          text: "部署ごとの「人数あたりの成果」を可視化する。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "増員要望の妥当性が判断できない",
            "部署の生産性を横比較できない",
            "人件費と成果が結びつかない",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "部署別の **生産性** を算出・比較",
            "人件費とKPIを突き合わせ",
            "増員・再配置の **根拠** を提示",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["人件費分析", "生産性", "労働分配"],
        },
      ],
    },
    {
      kicker: "07 ／ 判断軸",
      title: "組織方針・セマンティックレイヤー",
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "経営・管理者" },
            { label: "役割", value: "AIの判断軸" },
          ],
        },
        {
          type: "lead",
          text: "経営方針や独自の指標定義を、AIの判断軸として投入する。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "自社特有の文脈をAIが汲めない",
            "指標の定義が人によって揺れる",
            "方針と現場の打ち手がずれる",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "経営方針を **Policy** としてAIに投入",
            "独自KPIの **意味づけ** を定義",
            "運用するほど診断精度が向上",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["組織方針", "セマンティックレイヤー", "Policy投入"],
        },
      ],
    },
    {
      kicker: "08 ／ 効果測定",
      title: "PDCA・施策効果測定",
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "人事・部門長" },
            { label: "場面", value: "施策の前後" },
          ],
        },
        {
          type: "lead",
          text: "施策の前後で、KPIと体温の変化を検証する。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "研修や制度改定が「やって終わり」になる",
            "効果を数字で語れない",
            "何が効いたのか分からない",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "施策の実施月を記録",
            "前後の **KPI×体温の変化** を比較",
            "「効いた施策」を根拠を持って報告",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["PDCA", "施策効果測定", "前後比較"],
        },
      ],
    },
    {
      kicker: "09 ／ 連携",
      title: "Slack連携・通知",
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "全社・管理者" },
            { label: "連携", value: "Slack" },
          ],
        },
        {
          type: "lead",
          text: "診断結果やアラートを、現場のチャットへ自動で届ける。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "ダッシュボードを開かないと気づけない",
            "危険信号の共有が遅れる",
            "通知が分散する",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "診断・アラートを **Slackへ自動通知**",
            "危険信号を早期にチームへ共有",
            "回答リマインドも自動化",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["Slack連携", "通知", "アラート"],
        },
      ],
    },
    {
      kicker: "10 ／ 戦略",
      title: "人事戦略支援",
      blocks: [
        {
          type: "meta",
          items: [
            { label: "対象", value: "人事・経営" },
            { label: "画面", value: "人事戦略" },
          ],
        },
        {
          type: "lead",
          text: "採用・配置・リスキリングの意思決定材料を提供する。",
        },
        {
          type: "section",
          marker: "outline",
          title: "こんな悩みに",
          items: [
            "採用判断が勘に頼りがち",
            "活躍人材の定着が読めない",
            "配置の最適解が見えない",
          ],
        },
        {
          type: "section",
          title: "この機能でできること",
          items: [
            "温度×KPIで **採用の要否** を判断",
            "活躍と定着の観点でKPIを再定義",
            "配置・育成の **優先順位** を提示",
          ],
        },
        {
          type: "chips",
          label: "関連機能・データ",
          items: ["人事戦略", "採用判断", "リスキリング"],
        },
      ],
    },
  ],
};

export const decks: Deck[] = [executive, hr, whitepaper, featureTour];

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

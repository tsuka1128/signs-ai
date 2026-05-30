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
  tagline: "数字の裏側にある「組織の状態」を、経営の意思決定に",
  accent: "#38B2AC",
  icon: "📊",
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
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "+18%", label: "生産性（上位 vs 下位組織）" },
            { value: "+23%", label: "収益性" },
            { value: "▲81%", label: "欠勤率" },
            { value: "8%", label: "日本のエンゲージメント率（世界最低水準）" },
          ],
        },
        {
          type: "paragraph",
          text: "Gallupの大規模なメタ分析によれば、組織の状態が良好な企業群は、そうでない企業群に比べ生産性・収益性で明確に上回ります。一方、日本のエンゲージメント率は世界最低水準にあり、裏を返せば、ここには大きな改善余地が残されています。",
        },
      ],
    },
    {
      kicker: "06 ／ ビジョン",
      title: "Signs AI のビジョン：組織に体温を。",
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
      blocks: [
        {
          type: "steps",
          items: [
            {
              tag: "STEP 1",
              title: "KPI入力",
              desc: "月次実績をWeb画面またはスプレッドシートで記録（数分）",
            },
            {
              tag: "STEP 2",
              title: "アンケート配布",
              desc: "URLを現場へ配布。回答は匿名で数分",
            },
            {
              tag: "STEP 3",
              title: "AI診断",
              desc: "「集計を実行」で、各層向けの提言が自動で生成されます",
            },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "月あたりおよそ1〜2時間。専任の担当者がいなくても、継続的に組織の状態を捉えられます。",
        },
      ],
    },
    {
      kicker: "11 ／ Closing",
      title: "経営の皆様へ",
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
  icon: "👥",
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
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "+23%", label: "収益性（上位 vs 下位組織）" },
            { value: "+18%", label: "生産性" },
            { value: "▲43%", label: "離職率（最大）" },
            { value: "8%", label: "日本のエンゲージメント率（世界最低水準）" },
          ],
        },
        {
          type: "paragraph",
          text: "Gallupの大規模なメタ分析によれば、組織の状態が良好な企業群は、収益性・生産性で明確に上回り、離職率は大きく下がります。組織を強くする人事の仕事は、そのまま経営の利益に結びついています。",
        },
      ],
    },
    {
      kicker: "08 ／ 仕組み",
      title: "声・数字・方針の複雑さを、AIが読み解く",
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
      blocks: [
        {
          type: "steps",
          items: [
            { tag: "月初", title: "KPI入力", desc: "前月の売上・成果などを記録（数分）" },
            { tag: "月中", title: "アンケート配布", desc: "URLを配布。回答は匿名で3〜5分" },
            { tag: "月末", title: "AI診断", desc: "集計を実行すると、診断と提言が生成されます" },
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "運用工数は月あたりおよそ1〜2時間。専任の担当者がいなくても、継続的に組織の状態を捉えられます。",
        },
      ],
    },
    {
      kicker: "10 ／ はじめ方",
      title: "まずは、自社の組織の体温を測ることから",
      blocks: [
        {
          type: "table",
          headers: ["プラン", "月額", "こんな段階に"],
          rows: [
            ["Free（30日間）", "無料", "まず組織の現状を知りたい"],
            ["Standard", "5万円", "部署ごとに課題を深掘りしたい"],
            ["Pro", "10万円", "全社で経営と連動させたい"],
          ],
        },
        {
          type: "callout",
          tone: "accent",
          text: "まずはFreeで、現状を可視化するところから。数ヶ月続けることで、どこが冷えているか、どの施策が効いたかが、数字で見えてきます。",
        },
      ],
    },
    {
      kicker: "11 ／ Closing",
      title: "人事は、経営の利益に最も近い部門です",
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
  icon: "📄",
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
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "20%", label: "世界の従業員エンゲージメント率（2025）" },
            { value: "438億$", label: "エンゲージメント低下による世界経済の損失" },
            { value: "34%", label: "「人生で開花している」と答えた人の割合" },
            { value: "12年で2度目", label: "グローバル指標が前年から下落" },
          ],
        },
        {
          type: "paragraph",
          text: "世界の従業員エンゲージメント率は23%→21%→20%と低下し、過去12年で2度目の前年割れを記録。この低下による世界経済への損失は438億ドルと試算される。マネージャー層の落ち込みが特に顕著だ。",
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
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "8%", label: "日本の従業員エンゲージメント率" },
            { value: "18%", label: "東アジア地域の平均" },
            { value: "39%", label: "前日に強いストレスを経験した人" },
            { value: "31%", label: "「人生で開花している」（世界34%）" },
          ],
        },
        {
          type: "paragraph",
          text: "日本のエンゲージメント率は8%で、世界平均20%・東アジア18%を大きく下回る最低水準。ストレス・ウェルビーイング指標も世界平均より悪い。裏を返せば、日本企業にはエンゲージメント改善の伸びしろが世界で最も大きい。",
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
      blocks: [
        {
          type: "metrics",
          items: [
            { value: "440万人", label: "2040年 事務系の余剰（経産省）" },
            { value: "339万人", label: "2040年 AI・データ人材の不足" },
            { value: "5,000人", label: "みずほFG 配置転換（10年スパン）" },
            { value: "16万人", label: "事務派遣大手3社の「AIを使う側」育成計画" },
          ],
        },
        {
          type: "paragraph",
          text: "経産省「未来人材ビジョン」は2040年に事務系440万人余剰、AI・データ人材339万人不足と推計。両者は表裏一体で、リスキリングで橋を架けられる距離だ。みずほFGの5,000人は即時リストラではなく10年スパンの配置転換であり、その配置先設計・リスキリング・新ポジション創出こそ人事の仕事である。",
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

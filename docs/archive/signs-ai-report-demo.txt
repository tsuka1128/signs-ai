import { useState } from "react";

const MINT = "#A8E6CF";
const MINT_L = "#E8F8F0";
const BLUE_L = "#DCEEFB";
const TEAL = "#38B2AC";
const DARK = "#1A202C";
const GRAY = "#64748B";
const GRAY_L = "#F1F5F9";
const WHITE = "#FFFFFF";
const SUN = "#F59E0B";
const CLOUD = "#94A3B8";
const RED = "#EF4444";
const GREEN = "#10B981";
const ORANGE = "#F97316";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes glow{0%,100%{box-shadow:0 0 15px rgba(168,230,207,.2)}50%{box-shadow:0 0 30px rgba(168,230,207,.5)}}
*{box-sizing:border-box;}
`;

function WIcon({ t, s }: { t: string, s?: number }) {
  const sz = s || 40;
  const e = t === "sun" ? "☀️" : t === "cloud" ? "☁️" : "☔️";
  return (<span style={{ fontSize: sz, lineHeight: 1, display: "inline-block", animation: "fl 3s ease-in-out infinite" }}>{e}</span>);
}

function Arrow({ d, c }: { d: string, c: string }) {
  const ch = d === "up" ? "↑" : d === "down" ? "↓" : "→";
  return (<span style={{ color: c, fontWeight: 700, fontSize: 16 }}>{ch}</span>);
}

function Badge({ children, c, bg }: { children: React.ReactNode, c: string, bg: string }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color: c, background: bg, letterSpacing: 0.5 }}>
      {children}
    </span>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: any[], active: string, onChange: (id: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, background: GRAY_L, borderRadius: 12, padding: 4 }}>
      {tabs.map(function (t) {
        return (
          <button key={t.id} onClick={function () { onChange(t.id); }} style={{
            flex: 1, padding: "9px 14px", borderRadius: 10, border: "none", cursor: "pointer",
            background: active === t.id ? WHITE : "transparent",
            color: active === t.id ? DARK : GRAY,
            fontWeight: active === t.id ? 600 : 400, fontSize: 12,
            fontFamily: "'Noto Sans JP',sans-serif",
            boxShadow: active === t.id ? "0 2px 8px rgba(0,0,0,.08)" : "none",
            transition: "all .2s"
          }}>{t.label}</button>
        );
      })}
    </div>
  );
}

function Pills({ items, active, onChange }: { items: any[], active: string, onChange: (id: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
      {items.map(function (s) {
        return (
          <button key={s.id} onClick={function () { onChange(s.id); }} style={{
            padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer",
            background: active === s.id ? DARK : WHITE,
            color: active === s.id ? WHITE : GRAY,
            fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            boxShadow: active === s.id ? "0 2px 8px rgba(0,0,0,.15)" : "0 1px 3px rgba(0,0,0,.06)",
            transition: "all .2s"
          }}>{s.label}</button>
        );
      })}
    </div>
  );
}

const products = [
  { id: "a", name: "プロダクトA", head: 22, productivity: 129, pulse: 3.8, weather: "sun", mrr: 1800 },
  { id: "b", name: "プロダクトB", head: 14, productivity: 86, pulse: 2.1, weather: "rain", mrr: 520 },
  { id: "c", name: "プロダクトC", head: 9, productivity: 156, pulse: 4.3, weather: "sun", mrr: 460 }
];

const deptData = [
  {
    id: "sales", name: "営業部", head: 12, pulse: 2.1, weather: "cloud", arrow: "down", mrr: 2840,
    kpis: [
      { name: "MRR", val: "2,840万", ach: 108, type: "stack" },
      { name: "商談数", val: "45件", ach: 90, type: "stack" },
      { name: "成約率", val: "22%", ach: 110, type: "rate" }
    ]
  },
  {
    id: "mktg", name: "マーケ部", head: 8, pulse: 4.2, weather: "sun", arrow: "up", mrr: 384,
    kpis: [
      { name: "リード数", val: "384件", ach: 112, type: "stack" }
    ]
  },
  {
    id: "dev", name: "開発部", head: 15, pulse: 2.4, weather: "rain", arrow: "down", mrr: 200,
    kpis: [
      { name: "機能利用率", val: "38%", ach: 76, type: "rate" }
    ]
  },
  {
    id: "cs", name: "CS部", head: 6, pulse: 3.1, weather: "cloud", arrow: "flat", mrr: 300,
    kpis: [
      { name: "解約率", val: "4.2%", ach: 72, type: "inverse" },
      { name: "解約金額", val: "118万", ach: null, type: "inverse" },
      { name: "NPS", val: "32pt", ach: 80, type: "rate" }
    ]
  },
  {
    id: "hr", name: "人事部", head: 4, pulse: 4.0, weather: "sun", arrow: "up", mrr: 150,
    kpis: [
      { name: "採用数", val: "3名", ach: 60, type: "stack" }
    ]
  }
];

const prodKpis = [
  {
    id: "prod_a", name: "プロダクトA", head: 22, pulse: 3.8, weather: "sun", arrow: "up",
    kpis: [
      { name: "MRR", val: "1,800万", ach: 115, type: "stack" },
      { name: "解約率", val: "1.8%", ach: 110, type: "inverse" },
      { name: "NPS", val: "42pt", ach: 105, type: "rate" }
    ]
  },
  {
    id: "prod_b", name: "プロダクトB", head: 14, pulse: 2.1, weather: "rain", arrow: "down",
    kpis: [
      { name: "MRR", val: "520万", ach: 68, type: "stack" },
      { name: "解約率", val: "8.1%", ach: 37, type: "inverse" },
      { name: "NPS", val: "18pt", ach: 45, type: "rate" }
    ]
  },
  {
    id: "prod_c", name: "プロダクトC", head: 9, pulse: 4.3, weather: "sun", arrow: "up",
    kpis: [
      { name: "MRR", val: "460万", ach: 128, type: "stack" },
      { name: "解約率", val: "2.2%", ach: 95, type: "inverse" },
      { name: "NPS", val: "38pt", ach: 95, type: "rate" }
    ]
  }
];

const months = ["9月", "10月", "11月", "12月", "1月", "2月"];

const kpiDefs = [
  {
    id: "mrr", name: "MRR", unit: "万円", val: 2840, target: 2630, prev: [2100, 2250, 2380, 2490, 2630, 2840], dept: "営業部", voices: [
      { text: "目標超過だが、トップ営業1人に依存。属人リスクが顕在化しつつある", mood: "rain" },
      { text: "大型案件2件は値引き幅が大きく、利益率は悪化傾向", mood: "rain" },
      { text: "新規偏重で既存フォローが後手に回っている実感がある", mood: "cloud" }
    ]
  },
  {
    id: "deals", name: "商談数", unit: "件", val: 45, target: 50, prev: [38, 42, 48, 51, 47, 45], dept: "営業部", voices: [
      { text: "リード質は改善したが、初回→2回目に進まないケースが増加", mood: "cloud" },
      { text: "競合の比較検討フェーズで負けるパターンが出始めている", mood: "rain" },
      { text: "商談数より受注率を見るフェーズに入ったのでは", mood: "sun" }
    ]
  },
  {
    id: "close", name: "成約率", unit: "%", val: 22, target: 20, prev: [18, 17, 19, 21, 20, 22], dept: "営業部", voices: [
      { text: "プロダクトAの提案パターンが確立できた手応えがある", mood: "sun" },
      { text: "値引きで成約率を上げている面もあり、真の成約力か疑問", mood: "cloud" },
      { text: "業界特化の事例が増えたことが刺さっている", mood: "sun" }
    ]
  },
  {
    id: "leads", name: "リード数", unit: "件", val: 384, target: 343, prev: [280, 295, 310, 328, 343, 384], dept: "マーケ部", voices: [
      { text: "ターゲティング精度向上が奏功。CPAも改善傾向", mood: "sun" },
      { text: "展示会経由リードは質にばらつきがある", mood: "cloud" },
      { text: "コンテンツマーケのリードは商談化率が高い。集中すべき", mood: "sun" }
    ]
  },
  {
    id: "churn", name: "解約率", unit: "%", val: 4.2, target: 3.0, prev: [2.8, 3.1, 3.0, 3.2, 3.5, 4.2], dept: "CS部", voices: [
      { text: "プロダクトBの解約が突出。機能不足が主因と顧客から聞いている", mood: "rain" },
      { text: "オンボーディング完了前の離脱が先月から急増", mood: "rain" },
      { text: "解約阻止の打ち手が属人的。仕組み化が急務", mood: "cloud" }
    ]
  },
  {
    id: "churn_amt", name: "解約金額", unit: "万円", val: 118, target: null, prev: [45, 52, 48, 61, 78, 118], dept: "CS部", voices: [
      { text: "大口1社の解約が大きい。兆候はあったが対応が遅れた", mood: "rain" },
      { text: "小口解約は減少傾向だが1件あたり単価が上昇", mood: "cloud" },
      { text: "解約金額の可視化自体が初めてで、危機感を持てるようになった", mood: "sun" }
    ]
  },
  {
    id: "nps", name: "NPS", unit: "pt", val: 32, target: 40, prev: [28, 30, 31, 33, 34, 32], dept: "プロダクト", voices: [
      { text: "UIリニューアル後の評価は向上したがAPI安定性への不満が根強い", mood: "cloud" },
      { text: "競合比較が増えた。機能差よりサポート品質で勝っている", mood: "sun" },
      { text: "推奨者は熱狂的だが中間層の引き上げができていない", mood: "cloud" }
    ]
  },
  {
    id: "adopt", name: "機能利用率", unit: "%", val: 38, target: 50, prev: [32, 33, 35, 36, 37, 38], dept: "プロダクト", voices: [
      { text: "新機能のオンボーディング導線が弱い。リリースして終わり", mood: "rain" },
      { text: "コア機能の利用率は高いが差別化機能が使われていない", mood: "cloud" },
      { text: "ヘルプドキュメントの質を上げないとCS問合せが減らない", mood: "cloud" }
    ]
  },
  {
    id: "hire", name: "採用数", unit: "名", val: 3, target: 5, prev: [2, 3, 4, 3, 2, 3], dept: "人事部", voices: [
      { text: "エンジニア採用が特に難航。市場の給与水準に追いついていない", mood: "rain" },
      { text: "リファラル経由の質は高い。社員満足度が上がれば増えるはず", mood: "sun" },
      { text: "採用広報が弱い。候補者からの認知がそもそも低い", mood: "cloud" }
    ]
  }
];

const insights = {
  exec: { icon: "👔", title: "経営層", tone: "戦略的分析", text: "MRRは目標超過だが、営業部の体温スコア2.1は過去最低値。数字の裏側でトップ営業への依存が深刻化している可能性が高い。仮にこの状態が継続すれば、来月以降のパイプラインに影響が出ることが想定される。リソース配分の見直しを検討すべき局面。" },
  admin: { icon: "📋", title: "経企・人事", tone: "構造分析", text: "営業部と開発部の間で仕様変更プロセスの摩擦が発生しており、双方の体温を押し下げている構造が見られる。また、解約率4.2%はCS部の属人対応の限界を示唆。承認フローの短縮と業務標準化を並行で進めることを推奨。" },
  mgr: { icon: "🎯", title: "マネージャー", tone: "現場支援", text: "チームから『承認フロー遅延』と『仕様変更の突発性』が主要ボトルネックとして挙がっています。メンバーの疲弊は手法ではなく仕組みに起因する可能性が高い。数字を追う前に、障害の除去を優先することが結果的に早道になるケースが多い。" },
  player: { icon: "💪", title: "現場", tone: "前向きな共有", text: "『仕様決定のスピード』が今月のボトルネック上位に挙がっており、組織として改善の優先度が上がっています。同じ課題感を持つメンバーが複数おり、あなただけの悩みではありません。改善プロセスが動き始めているので、次月の変化に注目してください。" }
};

function ScatterPlot({ data }: { data: any[] }) {
  const W = 680, H = 340;
  const PAD = { t: 30, r: 30, b: 50, l: 60 };
  const pw = W - PAD.l - PAD.r;
  const ph = H - PAD.t - PAD.b;
  const maxH = Math.max.apply(null, data.map(function (d) { return d.head; })) * 1.3;
  const maxP = Math.max.apply(null, data.map(function (d) { return d.productivity; })) * 1.2;
  const avgH = data.reduce(function (s, d) { return s + d.head; }, 0) / data.length;
  const avgP = data.reduce(function (s, d) { return s + d.productivity; }, 0) / data.length;

  function cx(h: number) { return PAD.l + (h / maxH) * pw; }
  function cy(p: number) { return PAD.t + ph - (p / maxP) * ph; }

  const quads = [
    { x: PAD.l, y: PAD.t, w: cx(avgH) - PAD.l, h: cy(avgP) - PAD.t, label: "Question Mark", sub: "少人数×高生産性", color: "#DBEAFE", emoji: "🌱" },
    { x: cx(avgH), y: PAD.t, w: PAD.l + pw - cx(avgH), h: cy(avgP) - PAD.t, label: "Star", sub: "多人数×高生産性", color: "#D1FAE5", emoji: "⭐" },
    { x: PAD.l, y: cy(avgP), w: cx(avgH) - PAD.l, h: PAD.t + ph - cy(avgP), label: "Dog", sub: "少人数×低生産性", color: "#FEE2E2", emoji: "⚠️" },
    { x: cx(avgH), y: cy(avgP), w: PAD.l + pw - cx(avgH), h: PAD.t + ph - cy(avgP), label: "Cash Cow", sub: "多人数×低生産性", color: "#FEF3C7", emoji: "🐄" }
  ];

  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", fontFamily: "'Inter','Noto Sans JP',sans-serif" }}>
      {quads.map(function (q, i) {
        return (
          <g key={i}>
            <rect x={q.x} y={q.y} width={q.w} height={q.h} fill={q.color} opacity={0.35} />
            <text x={q.x + 8} y={q.y + 18} fontSize={10} fill={GRAY} fontWeight={600}>{q.emoji + " " + q.label}</text>
            <text x={q.x + 8} y={q.y + 32} fontSize={9} fill={GRAY}>{q.sub}</text>
          </g>
        );
      })}
      <line x1={cx(avgH)} y1={PAD.t} x2={cx(avgH)} y2={PAD.t + ph} stroke={GRAY} strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />
      <line x1={PAD.l} y1={cy(avgP)} x2={PAD.l + pw} y2={cy(avgP)} stroke={GRAY} strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />
      {data.map(function (d, i) {
        const x = cx(d.head), y = cy(d.productivity);
        const r = Math.max(16, Math.min(30, d.mrr / 60));
        const col = d.weather === "sun" ? GREEN : d.weather === "rain" ? RED : ORANGE;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={col} opacity={0.2} stroke={col} strokeWidth={2} />
            <circle cx={x} cy={y} r={4} fill={col} />
            <text x={x} y={y - r - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill={DARK}>{d.name}</text>
            <text x={x} y={y - r + 6} textAnchor="middle" fontSize={9} fill={GRAY}>{"体温 " + d.pulse}</text>
          </g>
        );
      })}
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize={11} fill={GRAY}>{"人数（リソース） →"}</text>
      <text x={14} y={H / 2} textAnchor="middle" fontSize={11} fill={GRAY} transform={"rotate(-90,14," + H / 2 + ")"}>{"一人当たり生産性 →"}</text>
    </svg>
  );
}

function Spark({ data, color }: { data: number[], color: string }) {
  const w = 200, h = 50;
  const mn = Math.min.apply(null, data) * 0.9;
  const mx = Math.max.apply(null, data) * 1.1;
  const pts = data.map(function (v, i) {
    return (i / (data.length - 1)) * w + "," + (h - ((v - mn) / (mx - mn)) * h);
  }).join(" ");
  const area = "0," + h + " " + pts + " " + w + "," + h;
  const lastX = w;
  const lastY = h - ((data[data.length - 1] - mn) / (mx - mn)) * h;

  return (
    <svg viewBox={"0 0 " + w + " " + h} style={{ width: "100%", height: h }}>
      <polygon points={area} fill={color} opacity={0.08} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={3.5} fill={color} />
    </svg>
  );
}

const crossFeedback = [
  { from: "営業", to: "マーケ", emoji: "👍", msg: "リードの質が改善傾向。ターゲティング精度の向上が商談の質に好影響を与えている。", col: GREEN },
  { from: "営業", to: "開発", emoji: "⚠️", msg: "仕様変更の頻度と突発性が提案資料の手戻りを生んでおり、営業部の体温低下の一因になっている可能性がある。", col: RED },
  { from: "CS", to: "開発", emoji: "⚠️", msg: "バグ対応の優先順位が不透明で、顧客への説明に窮する場面が増えているとの声が複数あがっている。", col: RED },
  { from: "開発", to: "全社", emoji: "🗣️", msg: "承認フローの3段階構造が開発速度のボトルネックとして最も多く挙げられている。短縮の検討を推奨。", col: SUN }
];

const actions = [
  { pri: "🔴 緊急", title: "営業部のトップ営業依存を解消する", desc: "属人化が進行しており、仮にキーパーソンが離脱した場合のインパクトが大きい。今週中にナレッジ共有セッションを設定し、商談プロセスの標準化に着手することを推奨。", dept: "営業部", owner: "営業部長" },
  { pri: "🔴 緊急", title: "承認フローの2段階への短縮を検討する", desc: "全部署横断でボトルネック1位。開発速度・意思決定スピードの両方に影響しており、組織全体の体温を押し下げている構造的要因と考えられる。", dept: "全社", owner: "CEO" },
  { pri: "🟡 今月中", title: "開発↔営業の仕様変更プロセスを整備する", desc: "仕様変更の事前通知ルール（最低3営業日前）の設定が有効と考えられる。双方の体温改善に寄与する可能性が高い。", dept: "開発×営業", owner: "PdM" },
  { pri: "🟡 今月中", title: "解約率4.2%の原因を構造的に分析する", desc: "直近解約5社のヒアリングを実施し、プロダクト起因か対応起因かを切り分けることを推奨。プロダクトBの解約集中が確認できれば、事業判断の材料になる。", dept: "CS部", owner: "CS部長" },
  { pri: "🟢 継続", title: "マーケ部の成功パターンを営業と共有する", desc: "リード品質改善の要因（コンテンツマーケ強化）を営業部と共有し、商談化率改善につなげる。好循環を組織的に再現する仕組みづくりを。", dept: "マーケ→営業", owner: "マーケ部長" }
];

export default function Report() {
  const [tab, setTab] = useState("exec");
  const [sec, setSec] = useState("matrix");
  const [matView, setMatView] = useState("product");
  const [selKpi, setSelKpi] = useState("mrr");
  const [orgView, setOrgView] = useState("dept");
  const [semEdit, setSemEdit] = useState(false);
  const [semText, setSemText] = useState("# 経営方針 v1.2（2026年2月〜）\n\n## 組織の現在地\n- フェーズ: ユニットエコノミクス改善期\n- 前フェーズ（〜1月）: 垂直立ち上げ → 量重視\n- 現フェーズ（2月〜）: 質重視へ転換。筋肉質な黒字化が最優先\n- 現場に求める空気感: 1件1件の質にこだわる執着心\n\n## KPIの解釈ガイド\n- MRR: 月次15%成長を維持しつつ、値引き率を抑制方向へ\n- 商談数: 量より質へ転換中。数の減少は想定内。成約率で判断\n- 成約率: 最重要指標。20%以上を死守\n- リード数: コンテンツマーケ経由の質の高いリードを重視\n- 解約率: 3%以下が健全ライン。4%超は即座にアラート\n- 解約金額: 大口解約は事前察知が必須。CS部に月次ヒアリングを義務化\n- NPS: 40pt到達が年度目標。中間層の引き上げに注力\n- 機能利用率: 差別化機能の利用率向上がNPS改善の鍵\n- 採用数: エンジニア採用が最優先。給与テーブルの見直しを検討中\n\n## 数字と体温の関係\n- ☀️なのに☔️（オーバーヒート）: 前フェーズでは許容していたが、現フェーズでは即座に介入。持続不能な成果は評価しない\n- ☔️なのに☀️: プロダクトBが該当。3月末までに改善が見られなければピボットを検討\n\n## 組織の注意点\n- 営業部トップ営業への依存が深刻化。属人化解消を2月の最優先アジェンダに\n- 開発↔営業の仕様変更摩擦が体温を下げている。承認フロー短縮で構造的に解決\n\n## 地雷ワード（AIが検知したら最優先で報告）\n- 「辞めたい」「転職」「意味がない」「誰も聞いてくれない」「もう限界」");

  const ins = insights[tab as keyof typeof insights];
  const kpi = kpiDefs.find(function (k) { return k.id === selKpi; }) || kpiDefs[0];
  const achRate = kpi.target ? Math.round((kpi.val / kpi.target) * 100) : null;

  return (
    <div style={{ background: "#F8FAFB", minHeight: "100vh", fontFamily: "'Noto Sans JP',sans-serif" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg," + WHITE + " 0%," + MINT_L + " 50%," + BLUE_L + " 100%)", padding: "28px 20px 20px", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: DARK, fontFamily: "'Inter',sans-serif", letterSpacing: -0.5 }}>Signs AI</span>
                <Badge c={TEAL} bg={TEAL + "15"}>MONTHLY REPORT</Badge>
              </div>
              <span style={{ fontSize: 11, color: GRAY, letterSpacing: 1 }}>組織に体温を。</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: GRAY }}>株式会社サンプルSaaS</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: DARK }}>2026年2月度</div>
            </div>
          </div>

          {/* Main Insight Card */}
          <div style={{ background: WHITE, borderRadius: 18, padding: "22px 26px", boxShadow: "0 4px 20px rgba(0,0,0,.06)", animation: "glow 4s ease-in-out infinite" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 64 }}>
                <WIcon t="cloud" s={48} />
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: CLOUD }}>☁️</span>
                  <Arrow d="down" c={RED} />
                </div>
                <span style={{ fontSize: 10, color: GRAY }}>全体体温</span>
              </div>
              <div style={{ width: 1, height: 60, background: "#E2E8F0" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{ins.icon}</span>
                  <Badge c={TEAL} bg={TEAL + "15"}>{ins.title + "向け"}</Badge>
                  <span style={{ fontSize: 10, color: GRAY }}>{"トーン: " + ins.tone}</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.75, color: DARK, fontWeight: 400, margin: 0 }}>{ins.text}</p>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <TabBar
                tabs={[
                  { id: "exec", label: "👔 経営層" },
                  { id: "admin", label: "📋 経企・人事" },
                  { id: "mgr", label: "🎯 マネージャー" },
                  { id: "player", label: "💪 現場" }
                ]}
                active={tab}
                onChange={setTab}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Nav */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 20px 0" }}>
        <Pills
          items={[
            { id: "matrix", label: "📊 マトリックス" },
            { id: "kpi", label: "📈 KPI詳細" },
            { id: "org", label: "🏢 部署・プロダクト" },
            { id: "action", label: "📌 アクション" },
            { id: "semantic", label: "🧬 経営方針" }
          ]}
          active={sec}
          onChange={setSec}
        />
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 20px 40px" }}>

        {/* ===== MATRIX ===== */}
        {sec === "matrix" && (
          <div>
            <div style={{ background: WHITE, borderRadius: 16, padding: 22, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>プロダクト / 事業部マトリックス</div>
                  <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>縦軸: 一人当たり生産性 ｜ 横軸: 人数 ｜ 円サイズ: MRR</div>
                </div>
                <TabBar
                  tabs={[{ id: "product", label: "プロダクト別" }, { id: "dept", label: "事業部別" }]}
                  active={matView}
                  onChange={setMatView}
                />
              </div>
              <ScatterPlot data={matView === "product" ? products : deptData} />
              <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid " + GREEN, background: GREEN + "30" }} />
                  <span style={{ fontSize: 10, color: GRAY }}>☀️ 体温良好</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid " + ORANGE, background: ORANGE + "30" }} />
                  <span style={{ fontSize: 10, color: GRAY }}>☁️ 要注意</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid " + RED, background: RED + "30" }} />
                  <span style={{ fontSize: 10, color: GRAY }}>☔️ 危険域</span>
                </div>
              </div>
            </div>

            <div style={{ background: WHITE, borderRadius: 16, padding: "18px 22px", marginTop: 12, border: "1px solid #E2E8F0", borderLeft: "4px solid " + TEAL }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>🧠</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>AIのマトリックス分析</span>
              </div>
              {matView === "product" ? (
                <div style={{ fontSize: 13, lineHeight: 1.8, color: DARK }}>
                  <p style={{ margin: "0 0 8px" }}><strong>プロダクトC</strong>は少人数ながら一人当たり生産性が最も高く、体温も4.3と良好。現在の成功パターンが再現可能であれば、<strong>プロダクトBから2〜3名の配置転換</strong>を検討する余地がある。</p>
                  <p style={{ margin: "0 0 8px" }}><strong>プロダクトB</strong>は14名体制で生産性86、体温2.1と深刻な状態。人数に対してアウトプットが見合っておらず、現場の疲弊も顕著。事業としての方向性の判断が求められる局面と考えられる。</p>
                  <p style={{ margin: 0, color: TEAL, fontWeight: 500 }}>💡 プロダクトBの余剰リソースをCに移動させた場合、全社MRRへの影響をシミュレーションすることを推奨。</p>
                </div>
              ) : (
                <div style={{ fontSize: 13, lineHeight: 1.8, color: DARK }}>
                  <p style={{ margin: "0 0 8px" }}><strong>マーケ部</strong>は8名で高い生産性と体温4.2。少人数で成果を出しているが、キャパシティの限界に近い可能性がある。追加リソース投入の効果を検証する価値がある。</p>
                  <p style={{ margin: "0 0 8px" }}><strong>営業部</strong>はトップ営業依存が顕著で体温2.1。一人当たり生産性は高く見えるが、実態は偏在。属人化の解消が最優先課題。</p>
                  <p style={{ margin: 0, color: TEAL, fontWeight: 500 }}>💡 開発部（15名・体温2.4）の承認フロー改善が、営業・CSの体温改善にも波及する可能性が高い。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== KPI DETAIL ===== */}
        {sec === "kpi" && (
          <div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
              {kpiDefs.map(function (k) {
                const isA = selKpi === k.id;
                return (
                  <button key={k.id} onClick={function () { setSelKpi(k.id); }} style={{
                    padding: "8px 14px", borderRadius: 12,
                    border: isA ? "2px solid " + TEAL : "1px solid #E2E8F0",
                    background: isA ? TEAL + "08" : WHITE,
                    cursor: "pointer", minWidth: 90, textAlign: "left", transition: "all .2s"
                  }}>
                    <div style={{ fontSize: 11, color: GRAY, marginBottom: 2 }}>{k.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: DARK, fontFamily: "'Inter',sans-serif" }}>{k.val}</span>
                      <span style={{ fontSize: 10, color: GRAY }}>{k.unit}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ background: WHITE, borderRadius: 16, padding: 22, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>{kpi.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <Badge c={DARK} bg="#E2E8F0">{"担当: " + kpi.dept}</Badge>
                    {kpi.target && (<span style={{ fontSize: 11, color: GRAY }}>{"目標: " + kpi.target + kpi.unit}</span>)}
                    {achRate !== null && (
                      <Badge c={achRate >= 100 ? GREEN : RED} bg={achRate >= 100 ? "#D1FAE5" : "#FEE2E2"}>{"達成率 " + achRate + "%"}</Badge>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: DARK, fontFamily: "'Inter',sans-serif" }}>{kpi.val}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: GRAY, marginLeft: 3 }}>{kpi.unit}</span>
                </div>
              </div>

              <div style={{ marginTop: 16, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>6ヶ月推移</div>
                <Spark data={kpi.prev} color={kpi.prev[5] >= kpi.prev[4] ? GREEN : RED} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  {months.map(function (m, i) {
                    return (<span key={i} style={{ fontSize: 9, color: GRAY }}>{m}</span>);
                  })}
                </div>
              </div>

              {achRate !== null && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: GRAY }}>目標進捗</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: achRate >= 100 ? GREEN : RED }}>{achRate + "%"}</span>
                  </div>
                  <div style={{ height: 6, background: GRAY_L, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: Math.min(achRate, 100) + "%", background: achRate >= 100 ? GREEN : RED, borderRadius: 6, transition: "width 1s ease" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Voices */}
            <div style={{ background: WHITE, borderRadius: 16, padding: "20px 22px", marginTop: 12, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>🗣️</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{kpi.dept + "の匿名アンケート要約"}</span>
                <Badge c={GRAY} bg={GRAY_L}>{kpi.name + "に関する声"}</Badge>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {kpi.voices.map(function (v, i) {
                  const moodIcon = v.mood === "sun" ? "☀️" : v.mood === "cloud" ? "☁️" : "☔️";
                  const moodColor = v.mood === "sun" ? GREEN : v.mood === "rain" ? RED : ORANGE;
                  const moodBg = v.mood === "sun" ? GREEN + "08" : v.mood === "rain" ? RED + "08" : SUN + "08";
                  const moodBorder = v.mood === "sun" ? GREEN + "25" : v.mood === "rain" ? RED + "25" : SUN + "25";
                  return (
                    <div key={i} style={{
                      display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 16px",
                      background: moodBg, borderRadius: 10,
                      border: "1px solid " + moodBorder
                    }}>
                      <span style={{ fontSize: 18, marginTop: 0, flexShrink: 0 }}>{moodIcon}</span>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: DARK, margin: 0 }}>{v.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== ORG (DEPT / PRODUCT) ===== */}
        {sec === "org" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <TabBar
                tabs={[{ id: "dept", label: "🏢 部署別" }, { id: "product", label: "📦 プロダクト別" }]}
                active={orgView}
                onChange={setOrgView}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(orgView === "dept" ? deptData : prodKpis).map(function (d, i) {
                const risk = d.pulse < 2.5 ? "overheat" : d.pulse >= 3.5 ? "stable" : "caution";
                const rCol = risk === "overheat" ? RED : risk === "stable" ? GREEN : SUN;
                const rLbl = risk === "overheat" ? "🔥 オーバーヒート" : risk === "stable" ? "✅ 適温" : "⚠️ 要注意";
                const pulseColor = d.pulse >= 3.5 ? GREEN : d.pulse >= 2.5 ? SUN : RED;

                return (
                  <div key={i} style={{
                    background: risk === "overheat" ? "#FEF2F2" : WHITE,
                    borderRadius: 16, overflow: "hidden",
                    border: risk === "overheat" ? "1px solid #FECACA" : "1px solid #E2E8F0"
                  }}>
                    {/* Top: Pulse + Header */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 20px",
                      background: pulseColor + "08",
                      borderBottom: "1px solid " + pulseColor + "20"
                    }}>
                      {/* Pulse block */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 100 }}>
                        <WIcon t={d.weather} s={32} />
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: DARK, fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>{d.pulse}</div>
                          <div style={{ fontSize: 9, color: GRAY }}>/5.0 体温</div>
                        </div>
                      </div>

                      <div style={{ width: 1, height: 36, background: pulseColor + "30" }} />

                      {/* Name + meta */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: DARK }}>{d.name}</span>
                          <span style={{ fontSize: 11, color: GRAY }}>{d.head + "名"}</span>
                          <Arrow d={d.arrow} c={d.arrow === "up" ? GREEN : d.arrow === "down" ? RED : GRAY} />
                        </div>
                      </div>

                      <Badge c={rCol} bg={risk === "overheat" ? "#FEE2E2" : risk === "stable" ? "#D1FAE5" : "#FEF3C7"}>{rLbl}</Badge>
                    </div>

                    {/* Bottom: KPI grid */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(" + d.kpis.length + ", 1fr)",
                      gap: 0
                    }}>
                      {d.kpis.map(function (k, j) {
                        const achColor = k.ach === null ? GRAY : k.ach >= 100 ? GREEN : k.ach >= 80 ? SUN : RED;
                        const typeLabel = k.type === "stack" ? "積上" : k.type === "rate" ? "率" : "抑制";
                        const isLast = j === d.kpis.length - 1;
                        return (
                          <div key={j} style={{
                            padding: "14px 16px",
                            borderRight: isLast ? "none" : "1px solid #F1F5F9"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                              <span style={{ fontSize: 11, color: GRAY, fontWeight: 500 }}>{k.name}</span>
                              <span style={{ fontSize: 8, color: GRAY, background: GRAY_L, padding: "1px 5px", borderRadius: 4 }}>{typeLabel}</span>
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: DARK, fontFamily: "'Inter',sans-serif", marginBottom: 6 }}>{k.val}</div>
                            {k.ach !== null && (
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                  <span style={{ fontSize: 10, color: GRAY }}>達成率</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: achColor }}>{k.ach + "%"}</span>
                                </div>
                                <div style={{ height: 4, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: Math.min(k.ach, 120) / 1.2 + "%", background: achColor, borderRadius: 4, transition: "width 1s ease" }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cross-dept feedback */}
            <div style={{ background: WHITE, borderRadius: 16, padding: "20px 22px", marginTop: 14, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>🔗</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{orgView === "dept" ? "部署間フィードバック（AIサマリー）" : "プロダクト間の比較分析（AI）"}</span>
              </div>
              {orgView === "dept" ? (
                crossFeedback.map(function (f, i) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: GRAY_L, borderRadius: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, marginTop: 1 }}>{f.emoji}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                          <Badge c={DARK} bg="#E2E8F0">{f.from}</Badge>
                          <span style={{ fontSize: 10, color: GRAY }}>→</span>
                          <Badge c={DARK} bg="#E2E8F0">{f.to}</Badge>
                        </div>
                        <p style={{ fontSize: 12, lineHeight: 1.65, color: DARK, margin: 0 }}>{f.msg}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: 13, lineHeight: 1.8, color: DARK }}>
                  <div style={{ padding: "10px 14px", background: GREEN + "08", borderRadius: 10, marginBottom: 8, border: "1px solid " + GREEN + "20" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span>⭐</span>
                      <span style={{ fontWeight: 700 }}>プロダクトA</span>
                      <span style={{ fontSize: 11, color: GREEN }}>Star</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: DARK, lineHeight: 1.65 }}>全指標で目標超過かつ体温良好。成功パターンが確立されている。このチームのナレッジをBに展開することで、組織全体の底上げが見込める。</p>
                  </div>
                  <div style={{ padding: "10px 14px", background: RED + "08", borderRadius: 10, marginBottom: 8, border: "1px solid " + RED + "20" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span>⚠️</span>
                      <span style={{ fontWeight: 700 }}>プロダクトB</span>
                      <span style={{ fontSize: 11, color: RED }}>Dog</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: DARK, lineHeight: 1.65 }}>解約率8.1%は危険水域。14名のリソースに対してMRR520万は効率が悪い。経営方針では「3月末までに改善なければピボット検討」と記載あり。期限まで残り1ヶ月。</p>
                  </div>
                  <div style={{ padding: "10px 14px", background: TEAL + "08", borderRadius: 10, border: "1px solid " + TEAL + "20" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span>🌱</span>
                      <span style={{ fontWeight: 700 }}>プロダクトC</span>
                      <span style={{ fontSize: 11, color: TEAL }}>Question Mark → Star候補</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: DARK, lineHeight: 1.65 }}>9名で一人当たりMRRが最高値。体温4.3は全プロダクト中1位。プロダクトBからの配置転換2〜3名で、さらにスケールする可能性がある。</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== ACTION ===== */}
        {sec === "action" && (
          <div>
            <div style={{ background: WHITE, borderRadius: 16, padding: 22, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 16 }}>📌 今月のアクション提案</div>
              {actions.map(function (a, i) {
                return (
                  <div key={i} style={{ padding: "14px 16px", borderRadius: 12, marginBottom: 8, background: GRAY_L }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{a.pri}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{a.title}</span>
                    </div>
                    <p style={{ fontSize: 12, lineHeight: 1.7, color: GRAY, margin: "0 0 8px" }}>{a.desc}</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Badge c={TEAL} bg={TEAL + "15"}>{a.dept}</Badge>
                      <Badge c={DARK} bg="#E2E8F0">{"推奨担当: " + a.owner}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div style={{ marginTop: 20, background: "linear-gradient(135deg," + DARK + " 0%,#2D3748 100%)", borderRadius: 18, padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>🌡️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, marginBottom: 4 }}>この診断を、あなたの会社でも。</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 18, lineHeight: 1.7 }}>
                KPIとアンケートを入力するだけ。<br />AIが事実ベースで、今月本当に起きていたことを分析します。
              </div>
              <div style={{ display: "inline-block", padding: "12px 36px", borderRadius: 12, background: "linear-gradient(135deg," + TEAL + "," + MINT + ")", color: DARK, fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 15px " + TEAL + "50" }}>
                1ヶ月無料で試す →
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 10 }}>Team 月額2万円〜 / Organization 月額5万円〜</div>
            </div>
          </div>
        )}

        {/* ===== SEMANTIC LAYER ===== */}
        {sec === "semantic" && (
          <div>
            {/* Overview Card */}
            <div style={{ background: WHITE, borderRadius: 16, padding: "22px 26px", border: "1px solid #E2E8F0", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🧬</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: DARK }}>経営方針</span>
                    <Badge c={TEAL} bg={TEAL + "15"}>AIの判断基準</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: GRAY, margin: "6px 0 0", lineHeight: 1.6 }}>
                    経営方針・KPIの解釈・組織のフェーズをMarkdownで記述。AIはこの文書を毎月の診断時に読み込み、数字の良し悪しを「あなたの会社の文脈」で判断します。
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ padding: "10px 16px", borderRadius: 10, background: MINT_L, flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: TEAL, fontWeight: 600, marginBottom: 4 }}>現在のフェーズ</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>ユニットエコノミクス改善期</div>
                  <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>量→質への転換中</div>
                </div>
                <div style={{ padding: "10px 16px", borderRadius: 10, background: BLUE_L, flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600, marginBottom: 4 }}>最重要KPI</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>成約率 20%以上</div>
                  <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>値引きに頼らない真の成約力</div>
                </div>
                <div style={{ padding: "10px 16px", borderRadius: 10, background: "#FEF2F2", flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: RED, fontWeight: 600, marginBottom: 4 }}>最優先アジェンダ</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>営業部の属人化解消</div>
                  <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>トップ営業依存からの脱却</div>
                </div>
              </div>
            </div>

            {/* How it affects AI */}
            <div style={{ background: WHITE, borderRadius: 16, padding: "20px 24px", border: "1px solid #E2E8F0", borderLeft: "4px solid " + TEAL, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>🧠</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>AIはこう読み取っています</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { q: "商談数が先月比で減少していますが…", a: "現フェーズは「質重視」に転換中。商談数の減少は想定内。成約率が20%以上を維持しているため、方針通りの推移と判断。" },
                  { q: "プロダクトBの数字が悪いのに体温が高いケースは？", a: "セマンティックレイヤーに「3月末まで改善なければピボット検討」と記載あり。現時点では仕込み期間として許容するが、期限を明示して経営層に報告。" },
                  { q: "営業部がオーバーヒート状態ですが…", a: "前フェーズでは「踏ん張り時」として許容していたが、現フェーズでは「即座に介入」と方針変更済み。最優先アラートとして出力。" }
                ].map(function (item, i) {
                  return (
                    <div key={i} style={{ padding: "12px 16px", background: GRAY_L, borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: DARK, marginBottom: 4 }}>{"Q. " + item.q}</div>
                      <div style={{ fontSize: 12, lineHeight: 1.65, color: GRAY }}>{"→ " + item.a}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Version History */}
            <div style={{ background: WHITE, borderRadius: 16, padding: "20px 24px", border: "1px solid #E2E8F0", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>📜</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>方針変遷ログ</span>
              </div>
              {[
                { ver: "v1.2", date: "2026/02/01", phase: "ユニットエコノミクス改善", change: "オーバーヒートを即介入に変更。成約率を最重要指標に昇格", bg: TEAL + "10" },
                { ver: "v1.1", date: "2026/01/15", phase: "垂直立ち上げ（後期）", change: "プロダクトBに3月末の期限を設定。解約率の閾値を3%→即アラートに変更", bg: GRAY_L },
                { ver: "v1.0", date: "2026/01/01", phase: "垂直立ち上げ", change: "初版。量重視。商談数を最大化。体温☔️は成長痛として許容", bg: GRAY_L }
              ].map(function (v, i) {
                return (
                  <div key={i} style={{ display: "flex", gap: 14, padding: "12px 16px", background: v.bg, borderRadius: 10, marginBottom: 6, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 44 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? TEAL : GRAY }}>{v.ver}</div>
                      <div style={{ fontSize: 10, color: GRAY }}>{v.date}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{v.phase}</div>
                      <div style={{ fontSize: 11, color: GRAY, marginTop: 2, lineHeight: 1.5 }}>{v.change}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Editor */}
            <div style={{ background: WHITE, borderRadius: 16, padding: "20px 24px", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>✏️</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Markdown編集</span>
                  <span style={{ fontSize: 11, color: GRAY }}>Notionからコピペ可能</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {semEdit ? (
                    <button onClick={function () { setSemEdit(false); }} style={{
                      padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                      background: "linear-gradient(135deg," + TEAL + "," + MINT + ")",
                      color: DARK, fontWeight: 600, fontSize: 12
                    }}>保存する</button>
                  ) : (
                    <button onClick={function () { setSemEdit(true); }} style={{
                      padding: "7px 20px", borderRadius: 8, border: "1px solid #E2E8F0", cursor: "pointer",
                      background: WHITE, color: DARK, fontWeight: 500, fontSize: 12
                    }}>編集する</button>
                  )}
                </div>
              </div>
              {semEdit ? (
                <textarea
                  value={semText}
                  onChange={function (e) { setSemText(e.target.value); }}
                  style={{
                    width: "100%", minHeight: 400, padding: 16, borderRadius: 10,
                    border: "2px solid " + TEAL, background: "#FAFFFE",
                    fontFamily: "'Courier New', monospace", fontSize: 13, lineHeight: 1.7,
                    color: DARK, resize: "vertical", outline: "none"
                  }}
                />
              ) : (
                <div style={{
                  padding: 16, borderRadius: 10, background: GRAY_L,
                  fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.8,
                  color: DARK, whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto"
                }}>
                  {semText}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ fontSize: 11, color: GRAY }}>最終更新: 2026/02/01 09:30</span>
                <span style={{ fontSize: 11, color: GRAY }}>次回の集計実行時にAIが読み込みます</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 36, padding: "16px 0", borderTop: "1px solid #E2E8F0" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: DARK, fontFamily: "'Inter',sans-serif" }}>Signs AI</span>
          <span style={{ fontSize: 11, color: GRAY, marginLeft: 6 }}>by 株式会社Taion</span>
          <div style={{ fontSize: 10, color: GRAY, marginTop: 3 }}>組織に体温を。</div>
        </div>
      </div>
    </div>
  );
}

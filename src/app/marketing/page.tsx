"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Check, ArrowRight, Zap, Target, Heart, Layers,
  BarChart3, TrendingUp, Users, Briefcase,
  ChevronDown, ArrowUpRight, Building2, ShieldCheck,
  Code2, Headphones, GraduationCap, Landmark,
  MessageCircleHeart, Lightbulb, Compass
} from "lucide-react";

/* ─── スクロール検知カスタムフック ─── */
function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─── Revealラッパー ─── */
function Reveal({ children, delay = 0, className = "", direction = "up" }: {
  children: React.ReactNode; delay?: number; className?: string; direction?: "up" | "left" | "right";
}) {
  const { ref, visible } = useScrollReveal();
  const translate = direction === "left" ? "-40px, 0" : direction === "right" ? "40px, 0" : "0, 40px";
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0,0)" : `translate(${translate})`,
        transition: `opacity 0.8s cubic-bezier(0.2,0.8,0.2,1) ${delay}s, transform 0.8s cubic-bezier(0.2,0.8,0.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
/* ─── AI提案スライダーデータ ─── */
const AI_PROPOSALS = [
  {
    department: "営業部 × マーケ部",
    tag: "クロスファンクション分析",
    relevance: "Very High",
    accuracy: "High",
    text: "「マーケ部のリード質スコアと営業部の受注率に強い関連性が確認されています。ボイスチェックでは『リードの精査に十分な時間が取れていない』という声が集中しており、リードスコアリング基準の見直しが改善の第一歩として有効です。類似パターンの改善事例では、基準再設計から2ヶ月で受注率が大幅に改善しています。」",
  },
  {
    department: "人事部",
    tag: "離職リスク早期検知",
    relevance: "High",
    accuracy: "High",
    text: "「入社1〜2年目メンバーの組織体温が3ヶ月連続で低下しています。ボイスチェックでは『キャリアパスが見えない』『成長実感がない』という声が増加傾向にあり、メンター制度の導入やスキル開発プログラムの提供が有効です。同規模企業の成功事例では、1on1の頻度を月2回に増やしたことで離職率が半減しています。」",
  },
  {
    department: "カスタマーサクセス部",
    tag: "チャーン予防分析",
    relevance: "Very High",
    accuracy: "High",
    text: "「CS部のNPSスコアと顧客チャーン率に強い関連が見られます。ボイスチェックで『対応に追われて能動的な提案ができない』という声が多く、ヘルススコア運用の自動化が改善の鍵です。先行導入企業ではプロアクティブ対応比率が3倍に改善し、チャーン率が大幅に低下しています。」",
  },
  {
    department: "ブランド・広報担当",
    tag: "ブランド一貫性分析",
    relevance: "High",
    accuracy: "Medium",
    text: "「全社ブランドガイドラインの浸透度と顧客からのブランド想起率に関連が見られます。ボイスチェックでは『ブランドの方向性が部署によって解釈が違う』との声があり、部門横断ワークショップの開催が有効です。類似ケースでは四半期に1回の全社共有会でブランド一貫性スコアが改善しています。」",
  },
  {
    department: "開発チーム",
    tag: "生産性・技術負債分析",
    relevance: "Very High",
    accuracy: "High",
    text: "「リリース速度の低下とチームのエンゲージメント低下に強い関連が確認されています。ボイスチェックで『技術的負債の返済に時間が取れない』という声が急増しており、スプリントの20%を負債解消に充てる施策が有効です。導入チームではデプロイ頻度が倍増し、チーム満足度も回復しています。」",
  },
];

/** AI提案サンプルの自動スライダー */
function AiProposalSlider() {
  const [current, setCurrent] = useState(0);
  /** 手動で一度でも選択されたら true → 以降は自動スライドしない */
  const [stopped, setStopped] = useState(false);
  const { ref, visible } = useScrollReveal();

  useEffect(() => {
    if (stopped || !visible) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % AI_PROPOSALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [stopped, visible]);

  /** 手動選択ハンドラ — 以降は自動スライドを停止 */
  const handleSelect = (index: number) => {
    setCurrent(index);
    setStopped(true);
  };

  const slide = AI_PROPOSALS[current];

  /** 部署名の短縮ラベル（インジケーター用） */
  const shortLabels = AI_PROPOSALS.map((p) => {
    const name = p.department;
    // 「営業部 × マーケ部」→ そのまま使う（短い）、それ以外もそのまま
    return name;
  });

  return (
    <div
      ref={ref}
      className="mt-12 relative"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.2s, transform 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.2s",
      }}
    >
      {/* ── カード本体 ── */}
      <div className="p-8 md:p-10 rounded-[32px] bg-slate-900 border border-slate-800 overflow-hidden relative">
        {/* プログレスバー — 自動中のみアニメーション */}
        {!stopped && (
          <div className="absolute top-0 left-0 h-[3px] bg-teal-400 transition-all duration-300 ease-linear"
            style={{ width: `${((current + 1) / AI_PROPOSALS.length) * 100}%` }}
          />
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-black tracking-widest text-slate-500">AI提案サンプル</p>
          <span className="text-[10px] font-black tracking-widest text-teal-400 bg-teal-400/10 px-3 py-1 rounded-full">
            {slide.department}
          </span>
        </div>

        {/* スライドコンテンツ（フェード切替） */}
        <div className="grid">
          {AI_PROPOSALS.map((s, i) => (
            <p
              key={i}
              className="col-start-1 row-start-1 text-white font-black text-base md:text-lg leading-relaxed italic transition-all duration-500"
              style={{
                opacity: i === current ? 1 : 0,
                transform: i === current ? "translateX(0)" : i < current ? "translateX(-20px)" : "translateX(20px)",
                pointerEvents: i === current ? "auto" : "none",
                visibility: i === current ? "visible" : "hidden"
              }}
            >
              {s.text}
            </p>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-slate-800 text-xs font-black text-slate-500 uppercase tracking-widest">
          <span>対象: {slide.tag}</span>
          <span className="text-teal-400">関連性: {slide.relevance}</span>
          <span>提案精度: {slide.accuracy}</span>
        </div>
      </div>

      {/* ── 部署名付きインジケーター（カードの外・真下） ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
        {AI_PROPOSALS.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`px-4 py-2 rounded-full text-[11px] font-black tracking-wide transition-all duration-300 ${i === current
              ? "bg-teal-500 text-white shadow-lg shadow-teal-200/40 scale-105"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            aria-label={`${shortLabels[i]} の提案を表示`}
          >
            {shortLabels[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── 料金カード ─── */
function PricingCard({ plan, price, sub, features, recommended, cta, note }: {
  plan: string; price: string; sub: string; features: string[]; recommended?: boolean; cta: string; note?: string;
}) {
  return (
    <div className={`relative p-8 md:p-10 rounded-[36px] flex flex-col transition-all duration-500 ${recommended
      ? "bg-white border-2 border-teal-400 shadow-2xl shadow-teal-100 md:scale-105 z-10"
      : "bg-white/50 border border-slate-200 shadow-lg"
      }`}>
      {recommended && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-teal-200">
          最も選ばれています
        </span>
      )}
      <h3 className="text-2xl font-black mb-1 text-slate-800 tracking-tight">{plan}</h3>
      <p className="text-xs text-slate-400 font-bold mb-5">{sub}</p>
      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-4xl font-black text-slate-900">{price.startsWith("¥") ? price : `¥${price}`}</span>
        <span className="text-slate-400 font-bold text-sm">/ 月（税別）</span>
      </div>
      <ul className="space-y-3.5 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-slate-600 font-bold text-sm leading-snug">
            <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" /> {f}
          </li>
        ))}
      </ul>
      {note && <p className="text-[11px] text-slate-400 font-bold mb-4 italic">{note}</p>}
      <button className={`w-full py-4 rounded-2xl font-black transition-all duration-300 ${recommended
        ? "bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-200 hover:scale-105"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}>
        {cta}
      </button>
    </div>
  );
}

/* ─── ヒーロービジュアル: ダッシュボード画面切替 + フローティングサイン ─── */

const FLOATING_SIGNS = [
  { value: "営業部の体温スコア2.1は過去最低値。\nトップ営業への依存構造を解消する施策が急務です。", position: "top-4 left-4 md:top-6 md:left-6" },
  { value: "開発部15名のリソースに対し生産性が低迷。\n技術負債の返済にスプリント20%の確保を推奨します。", position: "top-[32%] right-4 md:right-6" },
  { value: "全社の組織体温3.2は前月比-0.3。\n営業・開発の体温が全体を押し下げています。", position: "bottom-4 left-1/2 -translate-x-1/2 md:bottom-6" },
  { value: "入社1〜2年目の組織体温が3ヶ月連続低下。\nメンター制度の導入で離職率の半減が見込めます。", position: "top-[32%] left-4 md:left-6" },
  { value: "マーケ部のリード質と営業受注率に強い相関を検出。\nリードスコアリング基準の見直しが有効です。", position: "top-4 right-4 md:top-6 md:right-6" },
];
/**
 * 同時表示は最大2つまで。各6.5秒表示、ゆったりサイクル。
 * t=0-3.5:  0のみ    t=3.5-7:  0+1
 * t=7-8:    1のみ    t=8-10:   1+2
 * t=10-11:  2のみ    t=11-14.5: 2+3
 * t=14.5-15.5: 3のみ t=15.5-17.5: 3+4
 * t=17.5-22: 4のみ
 */
const SIGN_SCHEDULE = [
  { appear: 0.5, disappear: 7.0 },    // 0: 左上
  { appear: 3.5, disappear: 10.0 },   // 1: 右中
  { appear: 8.0, disappear: 14.5 },   // 2: 下中央
  { appear: 11.0, disappear: 17.5 },  // 3: 左中
  { appear: 15.5, disappear: 22.0 },  // 4: 右上
];
const SIGN_CYCLE = 23;

function HeroVisual() {
  const [si, setSi] = useState(0);
  const [el, setEl] = useState(0);
  const [tlIdx, setTlIdx] = useState(0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProduct, setIsProduct] = useState(false);

  useEffect(() => { const t = setInterval(() => setSi(p => (p + 1) % 3), 5000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setEl(p => (p + 0.1) % SIGN_CYCLE), 100); return () => clearInterval(t); }, []);
  /* 画面2表示中にタイムラプスを自動サイクル */
  useEffect(() => {
    if (si !== 1) { setTlIdx(0); return; }
    const t = setInterval(() => setTlIdx(p => (p + 1) % 4), 1200);
    return () => clearInterval(t);
  }, [si]);
  const vis = (i: number) => { const s = SIGN_SCHEDULE[i]; return el >= s.appear && el < s.disappear; };

  return (
    <div className="mt-24 w-full max-w-4xl relative" style={{ animation: "fadeUp 1.1s 0.4s ease both" }}>
      <p className="text-center text-sm md:text-base font-black text-slate-500 tracking-wide mb-4">💡 AIが組織のサインを読み取り、改善アクションを提案</p>
      <div className="absolute -inset-8 bg-teal-400/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="relative p-2 bg-white rounded-[40px] shadow-2xl shadow-slate-200/80 border border-white/80">
        <div className="aspect-video rounded-[32px] overflow-hidden relative bg-slate-50">

          {/* ═══ 画面1: ダッシュボード TOP ═══ */}
          <div className="absolute inset-0 transition-opacity duration-1000 bg-slate-50" style={{ opacity: si === 0 ? 1 : 0 }}>
            <div className="bg-gradient-to-br from-white via-slate-50 to-white px-5 md:px-8 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm md:text-base font-extrabold text-slate-800 tracking-tighter">Signs AI</span>
                    <span className="px-1.5 py-0.5 bg-teal-500/10 rounded text-[7px] md:text-[8px] font-bold text-teal-600 uppercase">Monthly</span>
                  </div>
                  <p className="text-[7px] md:text-[8px] font-black text-slate-400 tracking-widest uppercase">組織に体温を</p>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="hidden md:block px-2 py-1 bg-white border border-slate-200 rounded-full text-[7px] font-bold text-slate-500 shadow-sm">📊 KPI入力</span>
                  <span className="hidden md:block px-2 py-1 bg-slate-800 rounded-full text-[7px] font-bold text-white shadow-sm">🚀 マーケティングLP</span>
                  <div className="text-right">
                    <p className="text-[7px] text-slate-400 font-bold">株式会社サンプルSaaS</p>
                    <p className="text-[9px] md:text-xs font-black text-slate-800">2026.02</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 md:px-8 pt-3 md:pt-4 space-y-2.5 md:space-y-3">
              {/* AIインサイト + 天気アイコン */}
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="shrink-0 flex flex-col items-center gap-0.5">
                  <span className="text-3xl md:text-4xl">🌧️</span>
                  <span className="text-[8px] md:text-[10px] font-bold text-rose-500">↓</span>
                  <span className="text-[7px] md:text-[8px] font-bold text-slate-400">全体体温</span>
                </div>
                <div className="flex-1 bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-blue-100 rounded-full text-[7px] md:text-[9px] font-black text-blue-700">📁 経企・人事向け</span>
                    <span className="text-[6px] md:text-[8px] font-bold text-slate-400">トーン: 構造分析</span>
                  </div>
                  <p className="text-[8px] md:text-[11px] text-slate-700 font-semibold leading-relaxed">営業部と開発部の間で仕様変更プロセスの摩擦が発生しており、双方の体温を押し下げている構造が見られる。また、解約率4.2%はCS部の属人対応の限界を示唆。承認フローの短縮と業務標準化を並行で進めることを推奨。</p>
                </div>
              </div>
              {/* ロールタブ */}
              <div className="flex gap-0">
                {["🏢 経営層", "� 経企・人事", "🎯 マネージャー", "💪 現場"].map((t, i) => (
                  <span key={i} className={`px-3 md:px-4 py-1.5 text-[7px] md:text-[9px] font-bold border-b-2 ${i === 1 ? "border-slate-800 text-slate-800 bg-white" : "border-transparent text-slate-400"}`}>{t}</span>
                ))}
              </div>
              {/* セクションピルズ */}
              <div className="flex gap-1.5 overflow-hidden">
                {["📊 マトリックス", "📈 KPI詳細", "🏢 部署・プロダクト", "🗣️ 組織の体温", "📌 アクション", "🧭 経営方針"].map((p, i) => (
                  <span key={i} className={`shrink-0 px-2.5 md:px-3.5 py-1.5 rounded-full text-[7px] md:text-[9px] font-bold border ${i === 2 ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>{p}</span>
                ))}
              </div>
              {/* サブタブ: 部署別 / プロダクト別 */}
              <div className="flex bg-slate-100/80 p-0.5 rounded-full w-fit">
                <span className="px-4 md:px-6 py-1.5 rounded-full text-[8px] md:text-[10px] font-bold bg-white text-slate-800 shadow-sm">🏢 部署別</span>
                <span className="px-4 md:px-6 py-1.5 rounded-full text-[8px] md:text-[10px] font-bold text-slate-400">📦 プロダクト別</span>
              </div>
              {/* 部署詳細カード: 営業部 */}
              <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-2xl md:text-3xl">🌧️</span>
                    <span className="text-lg md:text-2xl font-black text-rose-500 tabular-nums leading-none mt-0.5">2.1</span>
                    <span className="text-[6px] md:text-[7px] font-bold text-slate-400">/5.0 体温</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm md:text-lg font-black text-slate-800">営業部</span>
                      <span className="text-[8px] md:text-[10px] font-bold text-slate-400">15名</span>
                      <span className="text-[8px] md:text-[10px] font-bold text-rose-500">↓</span>
                      <span className="ml-auto px-2 md:px-3 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-[7px] md:text-[9px] font-black text-white shadow-sm">🔥 オーバーヒート</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {[
                    { label: "売上", sub: "積上", value: "2,840万", rate: 108, color: "#3B82F6" },
                    { label: "契約件数", sub: "積上", value: "12件", rate: 92, color: "#F59E0B" },
                    { label: "成約率", sub: "率", value: "22%", rate: 110, color: "#3B82F6" },
                  ].map(({ label, sub, value, rate, color }, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-2 md:p-3 border border-slate-100">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[7px] md:text-[9px] font-bold text-slate-700">{label}</span>
                        <span className="text-[6px] md:text-[7px] font-bold text-slate-400">{sub}</span>
                      </div>
                      <p className="text-sm md:text-xl font-black text-slate-800 tabular-nums leading-none">{value}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[6px] md:text-[7px] font-bold text-slate-400">達成率</span>
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-[7px] md:text-[9px] font-black tabular-nums" style={{ color }}>{rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ 画面2: マトリックス（4象限バブルチャート） ═══ */}
          <div className="absolute inset-0 transition-opacity duration-1000 bg-slate-50" style={{ opacity: si === 1 ? 1 : 0 }}>
            <div className="bg-gradient-to-br from-white via-slate-50 to-white px-4 md:px-6 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm md:text-base font-extrabold text-slate-800 tracking-tighter">Signs AI</span>
                  <p className="text-[7px] font-black text-slate-400 tracking-widest uppercase">組織に体温を</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] text-slate-400 font-bold">株式会社サンプルSaaS</p>
                  <p className="text-[9px] md:text-xs font-black text-slate-800">2026.02</p>
                </div>
              </div>
            </div>
            <div className="px-4 md:px-6 pt-3 space-y-2">
              <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                <div className="flex flex-col gap-3 mb-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">部署 / プロダクト マトリックス</h3>
                      <div className="flex items-center gap-1.5 flex-wrap text-[7.5px] md:text-[8px] text-slate-400 font-bold uppercase tracking-tight">
                        <div className="flex items-center gap-1">
                          <span>縦軸: 一人当たり生産性</span>
                          <div className="relative group/calc">
                            <button className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-600 flex items-center justify-center text-[9px] font-black cursor-help transition-colors">?</button>
                            <div className="absolute top-full left-0 mt-2 w-56 md:w-64 bg-slate-800 text-white p-3.5 rounded-xl shadow-xl text-[10px] leading-relaxed break-normal whitespace-normal hidden group-hover/calc:block group-focus-within/calc:block z-[400] normal-case tracking-normal transition-all animate-in fade-in zoom-in-95">
                              <div className="font-bold text-white mb-2 flex items-center gap-1.5"><span className="text-sm">📉</span>生産性スコアの計算式</div>
                              <div className="bg-slate-900/80 p-2 rounded-lg font-mono text-[10px] text-emerald-400 mb-2.5 border border-slate-700">
                                主担当KPIの達成率 × 体温係数
                              </div>
                              <div className="text-slate-300">
                                ※ 各部署のKPIが異なるため、<span className="font-bold text-white">「目標の達成率」</span>で標準化。<br />
                                そこに<span className="font-bold text-white">組織体温（無理をしていないか）</span>を掛け合わせることで、バックオフィスを含む全社のチームを同列のY軸で比較評価します。
                              </div>
                            </div>
                          </div>
                        </div>
                        <span>｜ 横軸: リソース量 ｜ 円: KPI達成率</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-start gap-3">
                    <div className="flex bg-slate-100/80 p-0.5 rounded-full cursor-pointer">
                      <button onClick={() => setIsProduct(false)} className={`px-2 py-0.5 rounded-full text-[7px] font-bold transition-colors whitespace-nowrap ${!isProduct ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>部署別</button>
                      <button onClick={() => setIsProduct(true)} className={`px-2 py-0.5 rounded-full text-[7px] font-bold transition-colors whitespace-nowrap ${isProduct ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>プロダクト別</button>
                    </div>
                    <div className="flex items-center gap-2 md:border-l border-slate-200 md:pl-2">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest hidden md:inline ml-1">Time Lapse</span>
                      <div className="flex bg-slate-100/80 p-0.5 rounded-full cursor-pointer">
                        {["現在", "1ヶ月前", "3ヶ月前", "6ヶ月前"].map((t, i) => (
                          <button key={i} onClick={(e) => { e.stopPropagation(); setTlIdx(i); }} className={`px-2 py-0.5 rounded-full text-[6px] md:text-[7px] font-bold transition-colors ${(tlIdx ?? 0) === i ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full relative">
                  <div className="w-full cursor-pointer touch-pan-y" onClick={() => setIsModalOpen(true)}>
                    {(() => {
                      /* タイムラプスデータ: [現在, 1ヶ月前, 3ヶ月前, 6ヶ月前] */
                      const deptData: Record<string, { cx: number[]; cy: number[]; r: number; temp: number[]; label: string }> = {
                        marketing: { cx: [100, 105, 115, 125], cy: [40, 50, 75, 110], r: 13, temp: [4.2, 3.8, 3.2, 2.8], label: "マーケ部" },
                        hr: { cx: [72, 75, 80, 90], cy: [68, 70, 75, 82], r: 9, temp: [3.8, 3.5, 3.1, 2.6], label: "人事部" },
                        finance: { cx: [155, 150, 145, 135], cy: [65, 63, 58, 55], r: 9, temp: [3.5, 3.6, 3.8, 4.0], label: "財務経理" },
                        sales: { cx: [290, 285, 275, 260], cy: [140, 125, 110, 95], r: 18, temp: [2.1, 2.8, 3.5, 4.1], label: "営業部" },
                        dev: { cx: [300, 305, 310, 290], cy: [140, 135, 120, 105], r: 14, temp: [2.4, 2.9, 3.6, 4.0], label: "開発部" },
                        cs: { cx: [140, 138, 130, 120], cy: [125, 120, 110, 100], r: 10, temp: [3.1, 3.4, 3.9, 4.3], label: "CS部" },
                      };
                      const productData: Record<string, { cx: number[]; cy: number[]; r: number; temp: number[]; label: string }> = {
                        prodA: { cx: [280, 275, 265, 250], cy: [150, 140, 125, 115], r: 16, temp: [2.5, 2.9, 3.4, 4.0], label: "プロダクトA" },
                        prodB: { cx: [90, 95, 100, 110], cy: [50, 52, 58, 65], r: 12, temp: [4.1, 3.8, 3.4, 3.0], label: "プロダクトB" },
                        prodC: { cx: [160, 155, 145, 130], cy: [120, 115, 105, 95], r: 10, temp: [3.3, 3.6, 3.8, 4.2], label: "プロダクトC" },
                      };
                      const timeData = isProduct ? productData : deptData;
                      const ti = tlIdx ?? 0;
                      const getColor = (temp: number) => temp >= 4.0 ? "#10B981" : temp >= 3.0 ? "#F59E0B" : "#EF4444";
                      const getWeather = (temp: number) => temp >= 4.0 ? "☀️" : temp >= 3.0 ? "☁️" : "☔️";
                      return (
                        <svg viewBox="0 0 400 220" className="w-full h-auto">
                          <rect x="30" y="5" width="175" height="90" fill="#ECFDF5" rx="4" />
                          <rect x="205" y="5" width="175" height="90" fill="#EFF6FF" rx="4" />
                          <rect x="30" y="95" width="175" height="90" fill="#FFFBEB" rx="4" />
                          <rect x="205" y="95" width="175" height="90" fill="#FFF1F2" rx="4" />
                          <text x="38" y="18" className="text-[6px] fill-slate-400 font-bold">⭐ PIONEER</text>
                          <text x="213" y="18" className="text-[6px] fill-slate-400 font-bold">📈 SCALE</text>
                          <text x="38" y="108" className="text-[6px] fill-slate-400 font-bold">🌱 SEED</text>
                          <text x="213" y="108" className="text-[6px] fill-slate-400 font-bold">⚠️ OVERWEIGHT</text>
                          <line x1="205" y1="5" x2="205" y2="185" stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="3,3" />
                          <line x1="30" y1="95" x2="380" y2="95" stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="3,3" />
                          {Object.entries(timeData)
                            .sort(([keyA], [keyB]) => (keyA === hoveredKey ? 1 : keyB === hoveredKey ? -1 : 0))
                            .map(([key, d]) => {
                              const x = d.cx[ti]; const y = d.cy[ti]; const temp = d.temp[ti];
                              const color = getColor(temp);
                              const isAlert = temp < 3.0;
                              const isBig = d.r > 12;
                              const labelText = `${getWeather(temp)} ${temp.toFixed(1)}`;
                              return (
                                <g key={key}
                                  className="cursor-pointer group"
                                  style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform 1.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                                  onMouseEnter={() => setHoveredKey(key)}
                                  onMouseLeave={() => setHoveredKey(null)}
                                >
                                  {/* ホバー用の透明な大きめヒットエリア */}
                                  <circle cx={0} cy={0} r={d.r + 8} fill="transparent" />
                                  {/* バブル本体 */}
                                  <circle cx={0} cy={0} r={d.r} fill={color} opacity="0.18" stroke={color} strokeWidth="1.2"
                                    className="group-hover:opacity-40 transition-all duration-300 pointer-events-none"
                                    style={{ transition: "fill 0.8s, stroke 0.8s, opacity 0.3s" }} />
                                  <circle cx={0} cy={0} r="2.5" fill={color} style={{ transition: "fill 0.8s" }} className="pointer-events-none" />
                                  {isAlert && <circle cx={0} cy={0} r="4" fill={color} opacity="0.4" className="animate-ping pointer-events-none" />}

                                  {/* ラベル背景（白矩形） - デフォルトは透明、ホバー時表示 */}
                                  <rect x={isBig ? -22 : -18} y={-d.r - 12} width={isBig ? 44 : 36} height="10" rx="2" fill="white" className="opacity-0 group-hover:opacity-85 transition-opacity duration-300 pointer-events-none" />
                                  <text x={0} y={-d.r - 4} textAnchor="middle" fontSize={isBig ? 7 : 6} className="fill-slate-800 font-black pointer-events-none">{d.label}</text>

                                  {/* 体温ラベル背景 - デフォルトは透明、ホバー時表示 */}
                                  <rect x={-20} y={d.r + 1} width="40" height="10" rx="2" fill="white" className="opacity-0 group-hover:opacity-85 transition-opacity duration-300 pointer-events-none" />
                                  <text x={0} y={d.r + 9} textAnchor="middle" fontSize={6} className="fill-slate-500 font-bold pointer-events-none" style={{ transition: "fill 0.8s" }}>{labelText}</text>

                                  {/* ホバー時リング */}
                                  <circle cx={0} cy={0} r={d.r + 3} fill="none" stroke={color} strokeWidth="1.5"
                                    className="opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" strokeDasharray="3,2" />
                                </g>
                              );
                            })}
                          {/* 軸 */}
                          <text x="210" y="210" textAnchor="middle" className="text-[6px] fill-slate-300 font-bold uppercase">人数（リソース）→</text>
                          <text x="14" y="100" textAnchor="middle" className="text-[6px] fill-slate-300 font-bold" transform="rotate(-90,14,100)">生産性 →</text>
                          {/* 凡例 */}
                          <circle cx="120" cy="205" r="2" fill="#10B981" opacity="0.5" stroke="#10B981" strokeWidth="0.8" />
                          <text x="125" y="207" className="text-[5px] fill-slate-400 font-bold">☀️ 4.0以上</text>
                          <circle cx="170" cy="205" r="2" fill="#F59E0B" opacity="0.5" stroke="#F59E0B" strokeWidth="0.8" />
                          <text x="175" y="207" className="text-[5px] fill-slate-400 font-bold">☁️ 3.0〜3.9</text>
                          <circle cx="225" cy="205" r="2" fill="#EF4444" opacity="0.5" stroke="#EF4444" strokeWidth="0.8" />
                          <text x="230" y="207" className="text-[5px] fill-slate-400 font-bold">☔️ 2.9以下</text>
                        </svg>
                      );
                    })()}
                  </div>

                  {/* 拡大案内ボタン（スマホ等にも表示） */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 p-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-[10px] font-bold z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                    拡大表示
                  </button>
                </div>

                {/* --- ライトボックス案内 --- */}

                {/* ライトボックス（モーダル）表示 */}
                {isModalOpen && (
                  <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6 relative shadow-2xl touch-pan-y" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm md:text-base font-bold text-slate-800 px-1">部署 / プロダクト マトリックス 詳細</h3>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-bold mt-1 px-1 uppercase tracking-tight">
                              <div className="flex items-center gap-1">
                                <span>縦軸: 一人当たり生産性</span>
                                <div className="relative group/calc">
                                  <button className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-600 flex items-center justify-center text-[9px] font-black cursor-help transition-colors">?</button>
                                  <div className="absolute top-full left-0 mt-2 w-56 md:w-64 bg-slate-800 text-white p-3.5 rounded-xl shadow-xl text-[10px] leading-relaxed break-normal whitespace-normal hidden group-hover/calc:block group-focus-within/calc:block z-[400] normal-case tracking-normal transition-all animate-in fade-in zoom-in-95">
                                    <div className="font-bold text-white mb-2 flex items-center gap-1.5"><span className="text-sm">📉</span>生産性スコアの計算式</div>
                                    <div className="bg-slate-900/80 p-2 rounded-lg font-mono text-[10px] text-emerald-400 mb-2.5 border border-slate-700">
                                      主担当KPIの達成率 × 体温係数
                                    </div>
                                    <div className="text-slate-300">
                                      ※ 各部署のKPIが異なるため、<span className="font-bold text-white">「目標の達成率」</span>で標準化。<br />
                                      そこに<span className="font-bold text-white">組織体温（無理をしていないか）</span>を掛け合わせることで、バックオフィスを含む全社のチームを同列のY軸で比較評価します。
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <span>｜ 横軸: リソース量 ｜ 円サイズ: KPI達成率</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsModalOpen(false)}
                            className="bg-slate-100 text-slate-600 p-2 rounded-full hover:bg-slate-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                          </button>
                        </div>
                        {/* 操作パネル */}
                        <div className="flex flex-wrap items-center gap-4 px-1">
                          <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold cursor-pointer">
                            <button onClick={() => setIsProduct(false)} className={`px-4 py-1.5 rounded-full transition-colors ${!isProduct ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>部署別</button>
                            <button onClick={() => setIsProduct(true)} className={`px-4 py-1.5 rounded-full transition-colors ${isProduct ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>プロダクト別</button>
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:inline ml-2">Time Lapse</span>
                            <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold cursor-pointer">
                              {["現在", "1ヶ月前", "3ヶ月前", "6ヶ月前"].map((t, i) => (
                                <button key={i} onClick={() => setTlIdx(i)} className={`px-3 py-1.5 rounded-full transition-colors ${(tlIdx ?? 0) === i ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>{t}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full mx-auto" style={{ minWidth: 'min(100%, 640px)' }}>
                        {(() => {
                          const deptData: Record<string, { cx: number[]; cy: number[]; r: number; temp: number[]; label: string }> = {
                            marketing: { cx: [100, 110, 130, 150], cy: [40, 50, 75, 110], r: 13, temp: [4.2, 3.8, 3.2, 2.8], label: "マーケ部" },
                            hr: { cx: [72, 80, 95, 120], cy: [68, 75, 85, 100], r: 9, temp: [3.8, 3.5, 3.1, 2.6], label: "人事部" },
                            finance: { cx: [155, 148, 135, 80], cy: [65, 60, 50, 45], r: 9, temp: [3.5, 3.6, 3.8, 4.0], label: "財務経理" },
                            sales: { cx: [290, 280, 250, 120], cy: [140, 95, 55, 35], r: 18, temp: [2.1, 2.8, 3.5, 4.1], label: "営業部" },
                            dev: { cx: [300, 310, 320, 280], cy: [140, 120, 80, 50], r: 14, temp: [2.4, 2.9, 3.6, 4.0], label: "開発部" },
                            cs: { cx: [140, 135, 100, 70], cy: [125, 110, 70, 55], r: 10, temp: [3.1, 3.4, 3.9, 4.3], label: "CS部" },
                          };
                          const productData: Record<string, { cx: number[]; cy: number[]; r: number; temp: number[]; label: string }> = {
                            prodA: { cx: [280, 270, 250, 200], cy: [150, 110, 80, 60], r: 16, temp: [2.5, 2.9, 3.4, 4.0], label: "プロダクトA" },
                            prodB: { cx: [90, 100, 110, 140], cy: [50, 55, 65, 80], r: 12, temp: [4.1, 3.8, 3.4, 3.0], label: "プロダクトB" },
                            prodC: { cx: [160, 150, 130, 90], cy: [120, 100, 70, 40], r: 10, temp: [3.3, 3.6, 3.8, 4.2], label: "プロダクトC" },
                          };
                          const timeData = isProduct ? productData : deptData;
                          const ti = tlIdx ?? 0;
                          const getColor = (temp: number) => temp >= 4.0 ? "#10B981" : temp >= 3.0 ? "#F59E0B" : "#EF4444";
                          const getWeather = (temp: number) => temp >= 4.0 ? "☀️" : temp >= 3.0 ? "☁️" : "☔️";
                          return (
                            <svg viewBox="0 0 400 220" className="w-full h-auto">
                              <rect x="30" y="5" width="175" height="90" fill="#ECFDF5" rx="4" />
                              <rect x="205" y="5" width="175" height="90" fill="#EFF6FF" rx="4" />
                              <rect x="30" y="95" width="175" height="90" fill="#FFFBEB" rx="4" />
                              <rect x="205" y="95" width="175" height="90" fill="#FFF1F2" rx="4" />
                              <text x="38" y="18" className="text-[6px] fill-slate-400 font-bold">⭐ PIONEER</text>
                              <text x="213" y="18" className="text-[6px] fill-slate-400 font-bold">📈 SCALE</text>
                              <text x="38" y="108" className="text-[6px] fill-slate-400 font-bold">🌱 SEED</text>
                              <text x="213" y="108" className="text-[6px] fill-slate-400 font-bold">⚠️ OVERWEIGHT</text>
                              <line x1="205" y1="5" x2="205" y2="185" stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="3,3" />
                              <line x1="30" y1="95" x2="380" y2="95" stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="3,3" />
                              {Object.entries(timeData).map(([key, d]) => {
                                const x = d.cx[ti]; const y = d.cy[ti]; const temp = d.temp[ti];
                                const color = getColor(temp);
                                const isAlert = temp < 3.0;
                                const isBig = d.r > 12;
                                const labelText = `${getWeather(temp)} ${temp.toFixed(1)}`;
                                return (
                                  <g key={key} style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform 1.6s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                                    <circle cx={0} cy={0} r={d.r} fill={color} opacity="0.18" stroke={color} strokeWidth="1.2" />
                                    <circle cx={0} cy={0} r="2.5" fill={color} />
                                    {isAlert && <circle cx={0} cy={0} r="4" fill={color} opacity="0.4" className="animate-ping pointer-events-none" />}
                                    <rect x={isBig ? -22 : -18} y={-d.r - 12} width={isBig ? 44 : 36} height="10" rx="2" fill="white" className="opacity-85 pointer-events-none" />
                                    <text x={0} y={-d.r - 4} textAnchor="middle" fontSize={isBig ? 7 : 6} className="fill-slate-800 font-black pointer-events-none">{d.label}</text>
                                    <rect x={-20} y={d.r + 1} width="40" height="10" rx="2" fill="white" className="opacity-85 pointer-events-none" />
                                    <text x={0} y={d.r + 9} textAnchor="middle" fontSize={6} className="fill-slate-500 font-bold pointer-events-none">{labelText}</text>
                                  </g>
                                );
                              })}
                              <text x="195" y="210" textAnchor="middle" className="text-[6px] fill-slate-300 font-bold uppercase">人数（リソース）→</text>
                              <text x="8" y="100" textAnchor="middle" className="text-[6px] fill-slate-300 font-bold" transform="rotate(-90,8,100)">一人当たり生産性 →</text>
                              <circle cx="100" cy="205" r="2" fill="#10B981" opacity="0.5" stroke="#10B981" strokeWidth="0.8" />
                              <text x="105" y="207" className="text-[5px] fill-slate-400 font-bold">☀️ 4.0以上</text>
                              <circle cx="150" cy="205" r="2" fill="#F59E0B" opacity="0.5" stroke="#F59E0B" strokeWidth="0.8" />
                              <text x="155" y="207" className="text-[5px] fill-slate-400 font-bold">☁️ 3.0〜3.9</text>
                              <circle cx="205" cy="205" r="2" fill="#EF4444" opacity="0.5" stroke="#EF4444" strokeWidth="0.8" />
                              <text x="210" y="207" className="text-[5px] fill-slate-400 font-bold">☔️ 2.9以下</text>
                            </svg>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-2 text-right pointer-events-none">
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-400">
                    💡 クリックで拡大表示・詳細分析へ
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3 border-l-4 border-teal-500 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">🧠</span>
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-800">AIのマトリックス分析（{["現在", "1ヶ月前", "3ヶ月前", "6ヶ月前"][tlIdx ?? 0]}）</span>
                </div>
                <div className="relative h-[24px]">
                  {[
                    "営業部は急激な組織拡大の反動で現場がバーンアウト（体温2.1）。それに伴い一人当たり生産性も急落し「OVERWEIGHT」領域で深刻な状態です。",
                    "営業部の体温が急落（2.8）。メンバーへの過度な負荷が生産性低下として如実に表れ始めています。即時のケアが必要です。",
                    "営業部は人数拡大を進めていますが、体温の低下（3.5）とともに生産性にも陰りが見え始めました。マネジメント層の強化が急務です。",
                    "営業部が極めて高い生産性と体温（4.1）で全社を牽引しています。一方、マーケ部は初期フェーズで生産性が上がらず苦戦中です。"
                  ].map((msg, idx) => (
                    <p key={idx}
                      className="absolute inset-0 text-[7px] md:text-[8px] text-slate-600 font-medium leading-relaxed"
                      style={{
                        opacity: (tlIdx ?? 0) === idx ? 1 : 0,
                        transform: (tlIdx ?? 0) === idx ? "translateY(0)" : "translateY(4px)",
                        transition: "opacity 0.5s ease, transform 0.5s ease",
                        pointerEvents: (tlIdx ?? 0) === idx ? "auto" : "none"
                      }}
                    >
                      {msg}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ 画面3: アクション提案 ═══ */}
          <div className="absolute inset-0 transition-opacity duration-1000 bg-slate-50" style={{ opacity: si === 2 ? 1 : 0 }}>
            <div className="bg-gradient-to-br from-white via-slate-50 to-white px-5 md:px-8 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm md:text-base font-extrabold text-slate-800 tracking-tighter">Signs AI</span>
                    <span className="px-1.5 py-0.5 bg-teal-500/10 rounded text-[7px] md:text-[8px] font-bold text-teal-600 uppercase">Monthly</span>
                  </div>
                  <p className="text-[7px] md:text-[8px] font-black text-slate-400 tracking-widest uppercase">組織に体温を</p>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="text-right">
                    <p className="text-[7px] text-slate-400 font-bold">株式会社サンプルSaaS</p>
                    <p className="text-[9px] md:text-xs font-black text-slate-800">2026.02</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 md:px-8 pt-3 md:pt-4 space-y-2.5 md:space-y-3">
              {/* ロールタブ + セクションピルズ */}
              <div className="flex gap-0">
                {["🏢 経営層", "📁 経企・人事", "🎯 マネージャー", "💪 現場"].map((t, i) => (
                  <span key={i} className={`px-3 md:px-4 py-1.5 text-[7px] md:text-[9px] font-bold border-b-2 ${i === 0 ? "border-slate-800 text-slate-800 bg-white" : "border-transparent text-slate-400"}`}>{t}</span>
                ))}
              </div>
              <div className="flex gap-1.5 overflow-hidden">
                {["📊 マトリックス", "📈 KPI詳細", "🏢 部署・プロダクト", "🗣️ 組織の体温", "📌 アクション", "🧭 経営方針"].map((p, i) => (
                  <span key={i} className={`shrink-0 px-2.5 md:px-3.5 py-1.5 rounded-full text-[7px] md:text-[9px] font-bold border ${i === 4 ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>{p}</span>
                ))}
              </div>

              {/* アクション一覧カード */}
              <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-[9px] md:text-xs font-bold text-slate-800">📌 今月のアクション提案</h3>
                  <div className="flex gap-1">
                    <span className="px-2 py-0.5 bg-rose-100 rounded-full text-[6px] md:text-[7px] font-black text-rose-600">緊急 2</span>
                    <span className="px-2 py-0.5 bg-amber-100 rounded-full text-[6px] md:text-[7px] font-black text-amber-600">注意 2</span>
                    <span className="px-2 py-0.5 bg-emerald-100 rounded-full text-[6px] md:text-[7px] font-black text-emerald-600">改善 1</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[
                    { pri: "🔴", title: "営業部のトップ営業依存を解消する", dept: "営業部", owner: "営業部長", impact: "高", progress: 15 },
                    { pri: "🔴", title: "承認フローの2段階への短縮を検討", dept: "全社", owner: "CEO", impact: "高", progress: 40 },
                    { pri: "🟡", title: "開発↔営業の仕様変更プロセス整備", dept: "開発×営業", owner: "PdM", impact: "中", progress: 60 },
                    { pri: "�", title: "CS部のヘルススコア運用を自動化", dept: "CS部", owner: "CS責任者", impact: "中", progress: 25 },
                    { pri: "🟢", title: "マーケ部リードスコアリング基準を改善", dept: "マーケ部", owner: "マーケMGR", impact: "低", progress: 80 },
                  ].map(({ pri, title, dept, owner, impact, progress }, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] md:text-xs shrink-0">{pri}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-800 truncate">{title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[6px] md:text-[7px] font-bold text-slate-400">{dept}</span>
                          <span className="text-[6px] md:text-[7px] font-bold text-teal-500">担当: {owner}</span>
                          <span className={`text-[5px] md:text-[6px] font-bold px-1 rounded ${impact === "高" ? "bg-rose-100 text-rose-600" : impact === "中" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>影響度:{impact}</span>
                          <div className="ml-auto flex items-center gap-1">
                            <div className="w-10 md:w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-teal-500" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[5px] md:text-[6px] font-black text-slate-400 tabular-nums">{progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 下段: フィードバック + KPIサマリー */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
                {/* フィードバック (3/5) */}
                <div className="md:col-span-3 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] md:text-xs">🔗</span>
                    <span className="text-[8px] md:text-[10px] font-bold text-slate-800">部署間フィードバック</span>
                    <span className="ml-auto text-[6px] md:text-[7px] font-bold text-slate-400 uppercase tracking-wider">AI サマリー</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { f: "営業→マーケ", ic: "✅", tx: "リード質が改善傾向。ターゲティング精度向上が商談の質に好影響。", cl: "border-l-2 border-l-emerald-400 bg-emerald-50/60" },
                      { f: "CS→開発", ic: "🚨", tx: "バグ対応の優先順位が不透明で顧客説明に窮する場面が増加。", cl: "border-l-2 border-l-rose-400 bg-rose-50/60" },
                      { f: "開発→全社", ic: "ℹ️", tx: "承認フロー3段階が開発速度のボトルネック。短縮を推奨。", cl: "border-l-2 border-l-blue-400 bg-blue-50/60" },
                      { f: "人事→経営", ic: "⚡", tx: "若手の成長実感低下。メンター制度の導入を推奨。", cl: "border-l-2 border-l-amber-400 bg-amber-50/60" },
                    ].map(({ f, ic, tx, cl }, i) => (
                      <div key={i} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${cl}`}>
                        <span className="text-[9px] md:text-[10px] shrink-0">{ic}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[6px] md:text-[8px] font-black text-slate-500">{f}</span>
                          <p className="text-[6px] md:text-[8px] text-slate-600 font-medium truncate">{tx}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* KPIサマリー (2/5) */}
                <div className="md:col-span-2 space-y-2">
                  <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                    <p className="text-[6px] md:text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">今月の改善進捗</p>
                    <div className="flex items-end gap-1.5">
                      {[35, 48, 52, 41, 67, 72, 58, 63, 70, 55, 78, 82].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="w-full rounded-sm" style={{ height: `${h * 0.4}px`, backgroundColor: i >= 10 ? "#14B8A6" : i >= 8 ? "#5EEAD4" : "#CBD5E1" }} />
                          {i % 3 === 0 && <span className="text-[4px] md:text-[5px] text-slate-300 font-bold">{["4月", "7月", "10月", "1月"][i / 3]}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "組織体温", value: "3.2", icon: "🌧️", color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "KPI達成率", value: "82%", icon: "📈", color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "改善実行率", value: "67%", icon: "⚡", color: "text-teal-600", bg: "bg-teal-50" },
                      { label: "離職リスク", value: "2名", icon: "⚠️", color: "text-rose-600", bg: "bg-rose-50" },
                    ].map(({ label, value, icon, color, bg }, i) => (
                      <div key={i} className={`${bg} rounded-xl p-2 border border-white shadow-sm`}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[8px] md:text-[10px]">{icon}</span>
                          <span className="text-[5px] md:text-[7px] font-bold text-slate-400 uppercase">{label}</span>
                        </div>
                        <p className={`text-sm md:text-lg font-black ${color} leading-none`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ フローティングサイン用 白オーバーレイ（常時表示） ═══ */}
          <div className="absolute inset-0 bg-white/55 backdrop-blur-[1px] z-10 pointer-events-none rounded-[32px]" />

          {/* ═══ フローティングサイン ═══ */}
          {FLOATING_SIGNS.map((s, i) => {
            const v = vis(i);
            return (
              <div key={i}
                className={`absolute ${s.position} bg-gradient-to-r from-teal-500 via-blue-600 to-violet-600 border border-white/20 rounded-2xl backdrop-blur-md flex items-center gap-2.5 md:gap-3 z-20 pointer-events-none px-4 py-2.5 md:px-6 md:py-3.5 max-w-[50%] md:max-w-md`}
                style={{ opacity: v ? 1 : 0, transform: v ? "scale(1) translateY(0)" : "scale(0.92) translateY(6px)", transition: v ? "opacity 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" : "opacity 1.2s ease-out, transform 1.2s ease-out", boxShadow: "0 8px 32px rgba(99,102,241,0.25), 0 0 40px rgba(255,255,255,0.5)" }}
              >
                <Lightbulb className="w-4 h-4 md:w-6 md:h-6 text-teal-200 shrink-0" />
                <p className="font-black text-[8px] md:text-sm text-white text-left leading-relaxed whitespace-pre-line">{s.value}</p>
              </div>
            );
          })}
        </div>
      </div>
      {/* インジケーター */}
      <div className="flex items-center justify-center gap-3 mt-5">
        {["ダッシュボード", "マトリックス", "AI提案"].map((l, i) => (
          <button key={i} onClick={() => setSi(i)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide transition-all duration-300 ${i === si ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"}`}
          >{l}</button>
        ))}
      </div>
    </div>
  );
}
/* ─── メインコンポーネント ─── */
export default function MarketingPage() {
  /* ナビスクロール */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">

      {/* ── 固定背景グラデーション ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-25%] left-[-15%] w-[80%] h-[80%] bg-gradient-to-br from-teal-200/25 to-teal-300/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[65%] h-[65%] bg-gradient-to-tl from-indigo-200/20 to-violet-300/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: "2.5s" }} />
        <div className="absolute top-[35%] right-[5%] w-[35%] h-[35%] bg-rose-100/12 rounded-full blur-[110px]" />
      </div>

      {/* ── Header ── */}
      <nav className={`fixed top-0 left-0 w-full z-50 px-6 py-5 md:px-12 transition-all duration-500 ${scrolled ? "backdrop-blur-xl bg-white/80 border-b border-slate-100 shadow-sm" : "bg-transparent"
        }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200 group-hover:rotate-6 transition-transform duration-300">
              <span className="text-white font-black text-xl italic">S</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">Signs AI</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[12px] font-black uppercase tracking-widest text-slate-500">
            <a href="#how" className="hover:text-teal-600 transition-colors">仕組み</a>
            <a href="#usecase" className="hover:text-teal-600 transition-colors">活用事例</a>
            <a href="#pricing" className="hover:text-teal-600 transition-colors">料金</a>
            <Link href="/dashboard" className="px-6 py-3 bg-slate-900 text-white rounded-full hover:bg-teal-600 transition-all shadow-xl shadow-slate-200/60 hover:scale-105">
              デモを試す
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">

        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="pt-44 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-white border border-slate-200 rounded-full mb-10 shadow-sm" style={{ animation: "fadeUp 0.8s ease both" }}>
            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-ping" />
            <span className="text-[11px] font-black tracking-[0.15em] text-teal-600">組織の力を引き出す、AIインテリジェンス</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1.05] mb-8" style={{ animation: "fadeUp 0.9s 0.1s ease both" }}>
            <span className="block text-slate-900">現場の声を</span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-indigo-500 to-violet-600 pb-3">
              AIで収益に変える
            </span>
          </h1>

          <p className="max-w-3xl text-lg md:text-xl text-slate-600 font-bold leading-relaxed mb-5" style={{ animation: "fadeUp 1s 0.2s ease both" }}>
            Signs AIは、組織の「今」と事業KPIをつなぐAI経営参謀。<br className="hidden md:block" />
            現場の声をデータ化し、経営の意思を反映したKPI分析と組み合わせ、<br className="hidden md:block" />
            「次に何をすべきか」を高精度に提案します。
          </p>
          <p className="max-w-2xl text-sm text-slate-400 font-bold mb-14" style={{ animation: "fadeUp 1s 0.25s ease both" }}>
            業種・規模・フェーズを問わず、あなたの会社のKPIに合わせた組織診断を。
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto" style={{ animation: "fadeUp 1s 0.3s ease both" }}>
            <Link href="/dashboard" className="px-10 py-6 bg-teal-500 text-white rounded-[20px] font-black text-xl shadow-2xl shadow-teal-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              デモを体験する <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-10 py-6 bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-slate-900 rounded-[20px] font-black text-xl transition-all shadow-lg">
              資料をダウンロード
            </button>
          </div>

          {/* ヒーロービジュアル — ダッシュボード画面切替 + フローティングサイン */}
          <HeroVisual />

          <div className="mt-14 flex flex-col items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest" style={{ animation: "fadeUp 1s 0.9s ease both" }}>
            <span>Scroll to explore</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </section>

        {/* ═══════════════════ ボイスチェック — 本音が聞ける仕組み ═══════════════════ */}
        <section className="py-24 px-6 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-16">
              <p className="text-[11px] font-black tracking-widest text-teal-500 mb-5">Voice Check — 現場の本音を聴く仕組み</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6">
                言えなかった声が、<br />組織を動かすデータになる。
              </h2>
              <p className="max-w-2xl mx-auto text-slate-500 font-bold">
                Signs AI独自の「ボイスチェック」は、現場の本音を引き出す設計のパルスサーベイ。<br />
                率直な声がそのまま集まり、AIが精度の高い改善提案へ変換します。
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: BarChart3,
                  title: "KPI × ボイスで兆候を発見",
                  desc: "数字上は問題なくても、現場の体温が下がり始めている——。ボイスチェックとKPIを組み合わせることで、数字だけでは見えない変化の兆候をいち早くキャッチします。",
                },
                {
                  icon: Layers,
                  title: "マトリックスで部署の体温を一望",
                  desc: "マトリックス形式のダッシュボードで、部署ごとの組織体温を一目で把握。どの部署が今どんな状態にあるのか、視覚的に理解できます。",
                },
                {
                  icon: Compass,
                  title: "組織方針に基づく部署別AI提案",
                  desc: "部署ごとの状態に合わせて、組織の方針に即した改善提案をAIが生成。一律のアドバイスではなく、各部署に最適化されたネクストアクションを提示します。",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 0.1} className="p-8 rounded-[28px] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight">{title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ 収益につながる仕組み ═══════════════════ */}
        <section id="how" className="py-28 px-6 bg-[#F7F9FC]">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-20">
              <p className="text-[11px] font-black tracking-widest text-teal-500 mb-5">仕組み — どうやって収益が上がるのか</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
                組織が強くなれば、<br />数字は自然と<span className="text-teal-500">ついてくる</span>。
              </h2>
              <p className="max-w-2xl mx-auto text-slate-500 font-bold text-lg">
                「人の状態」と「事業の数字」の相関をデータで可視化し、<br />
                改善ナレッジとセットで次の打ち手を提案します。
              </p>
            </Reveal>

            {/* 3ステップ */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  step: "01",
                  title: "経営の意思を反映したKPI設計",
                  desc: "最大10個の任意KPIを自由に設計。経営方針や事業フェーズの文脈もAIに共有できるため、御社だけに最適化された分析が可能です。",
                  color: "from-teal-50 to-teal-100",
                },
                {
                  step: "02",
                  title: "ボイスチェックとKPIをつなげる",
                  desc: "ボイスチェックで集まった率直な声とKPI実績をAIが自動で照合。「エンゲージメントが高い部署はなぜ受注率も高いのか」——その関係性を事実ベースで明らかにします。",
                  color: "from-indigo-50 to-indigo-100",
                },
                {
                  step: "03",
                  title: "改善ナレッジ付きの提案を生成",
                  desc: "「どこに課題があるか」だけでなく、「どう改善すればよいか」のメソッドや成功パターンを含めた提案をAIが生成。次のアクションまで一気通貫でサポートします。",
                  color: "from-violet-50 to-violet-100",
                },
              ].map(({ step, title, desc, color }, i) => (
                <Reveal key={step} delay={i * 0.12}>
                  <div className={`p-8 rounded-[32px] bg-gradient-to-br ${color} border border-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full`}>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-4">Step {step}</p>
                    <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight">{title}</h3>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* インパクトバナー */}
            <Reveal className="rounded-[40px] bg-teal-600 p-10 md:p-16 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/20 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
              <div className="relative grid md:grid-cols-2 gap-14 items-center">
                <div>
                  <p className="text-[11px] font-black tracking-widest text-teal-300 mb-6">Impact</p>
                  <h3 className="text-3xl md:text-4xl font-black leading-tight mb-6">
                    見えなかったコストに<br />気づき、伸ばすべき力を<br />特定する。
                  </h3>
                  <p className="text-teal-100 font-bold text-base leading-relaxed">
                    組織の不調はサイレントに生産性を蝕みます。Signs AIはボイスチェックで集まった本音から兆候を早期検出し、KPIとの関連に基づく改善提案を行います。「何から着手すべきか」が明確になります。
                  </p>
                </div>
                <div className="space-y-5">
                  {[
                    { stat: "最大10個", label: "業種を問わず自由設計可能なKPI項目数" },
                    { stat: "KPI達成率 +23pt", label: "AI提案を実行した組織での実績目安" },
                    { stat: "報告工数 −70%", label: "AI自動レポートによる分析・報告の効率化" },
                  ].map(({ stat, label }) => (
                    <div key={label} className="flex items-center gap-5 p-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                      <p className="text-xl md:text-2xl font-black text-white whitespace-nowrap">{stat}</p>
                      <p className="text-teal-100 font-bold text-sm">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════ 差別化 ═══════════════════ */}
        <section className="py-28 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-20">
              <p className="text-[11px] font-black tracking-widest text-teal-500 mb-5">Signs AIが選ばれる理由</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                「可視化」で終わらない。<br />「どう動くか」まで提案する。
              </h2>
              <p className="max-w-xl mx-auto text-slate-500 font-bold">
                一般的なサーベイが「現状の可視化」で完結するのに対し、Signs AIは事実に基づく改善の道筋まで提案します。
              </p>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-8">
              {/* 従来 */}
              <Reveal direction="left" className="p-10 rounded-[36px] bg-slate-50 border-2 border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400">従来</span>
                  </div>
                  <h3 className="font-black text-xl text-slate-400 tracking-tight">一般的なサーベイツール</h3>
                </div>
                <ul className="space-y-6">
                  {[
                    ["組織の現状を「可視化」する", "スコアやグラフは出るが、何をすべきかは使う人次第。"],
                    ["汎用的な改善提案が中心", "「コミュニケーションを活性化しましょう」のような一般論が多い。"],
                    ["事業KPIとは切り離された分析", "組織スコアが上がっても、売上や生産性がどう動くか接続されていない。"],
                    ["全社一律の固定設問", "業種やフェーズに関わらず同じ設問のため、実態との乖離が出やすい。"],
                  ].map(([title, desc]) => (
                    <li key={title} className="flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-slate-500 text-sm">{title}</p>
                        <p className="text-slate-400 text-sm font-medium mt-1">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>

              {/* Signs AI */}
              <Reveal direction="right" delay={0.1} className="p-10 rounded-[36px] bg-teal-600 border-2 border-teal-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-full bg-teal-400/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-teal-200" />
                  </div>
                  <h3 className="font-black text-xl text-white tracking-tight">Signs AI</h3>
                </div>
                <ul className="space-y-6">
                  {[
                    ["KPIとボイスチェックをつなげて分析", "組織の状態とKPI実績の関係性をAIが検出。感覚ではなくデータで裏付けます。"],
                    ["改善ナレッジ付きの高精度な提案", "課題の指摘だけでなく、「どの施策が効果的か」成功パターンやメソッドを含めて提案します。"],
                    ["最大10個のKPIを自由設計", "MRR・NPS・採用充足率……業種を問わず、あなたの事業に合わせた分析を構築できます。"],
                    ["経営の意思が反映された分析", "事業方針やフェーズをAIに共有。自社の文脈に沿った、ブレない提案を受け取れます。"],
                  ].map(([title, desc]) => (
                    <li key={title} className="flex items-start gap-4">
                      <Check className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-white text-sm">{title}</p>
                        <p className="text-teal-100 text-sm font-medium mt-1">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            {/* AI提案サンプル — 自動スライダー */}
            <AiProposalSlider />
          </div>
        </section>

        {/* ═══════════════════ 業種別ユースケース ═══════════════════ */}
        <section id="usecase" className="py-28 px-6 bg-[#F7F9FC]">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-20">
              <p className="text-[11px] font-black tracking-widest text-teal-500 mb-5">活用シーン</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                10個の自由設計KPIで、<br />どの業種にもフィットする。
              </h2>
              <p className="max-w-2xl mx-auto text-slate-500 font-bold">
                KPI定義を完全カスタマイズ可能。あなたの業種・事業フェーズに合わせた分析を即日開始できます。
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Code2,
                  industry: "SaaS / テクノロジー",
                  kpis: "MRR, チャーン率, NPS, リリース速度, CAC",
                  insight: "「開発チームのリリース速度低下とエンゲージメント低下に強い相関が見られます。技術的負債の解消を優先することで、チームの推進力を回復できる可能性があります。」",
                },
                {
                  icon: Landmark,
                  industry: "VC / 投資ファンド",
                  kpis: "支援先売上成長率, 組織体温, 経営課題数, PMF進捗, チーム充足率",
                  insight: "「支援先A社の組織体温が先月から低下傾向。ボイスチェックでは採用と開発リソースに関する声が急増しています。次回の1on1で優先的に取り上げることを推奨します。」",
                },
                {
                  icon: Building2,
                  industry: "コンサルティング",
                  kpis: "稼働率, 案件単価, リピート率, 提案数, 育成進捗",
                  insight: "「シニアの稼働率が高止まりし、ジュニアの育成に割ける時間が減少しています。現在のペースが続くと、中長期の受注力に影響が出る可能性があります。」",
                },
                {
                  icon: Headphones,
                  industry: "BPO / カスタマーサポート",
                  kpis: "CSAT, 一次解決率, AHT, 応答率, 定着率",
                  insight: "「AHT短縮施策が心理的安全性スコアを圧迫しています。品質と効率のバランスを再設計することで、顧客満足度と定着率の同時改善が見込めます。」",
                },
                {
                  icon: ShieldCheck,
                  industry: "不動産 / デベロッパー",
                  kpis: "成約率, 反響数, 顧客単価, リピート率, 営業稼働率",
                  insight: "「営業チームの反響対応速度と成約率に強い関連が見られます。初動の仕組み改善が最も効果的な施策です。対応フロー整備の成功事例をご提案します。」",
                },
                {
                  icon: GraduationCap,
                  industry: "教育 / スクール",
                  kpis: "継続率, NPS, 受講完了率, 紹介数, 講師満足度",
                  insight: "「講師満足度と受講完了率に強い関連性が見られます。講師の裁量権を広げた組織での改善パターンに基づく施策を提案します。」",
                },
              ].map(({ icon: Icon, industry, kpis, insight }, i) => (
                <Reveal key={industry} delay={(i % 3) * 0.1}>
                  <div className="p-7 rounded-[28px] bg-white border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full flex flex-col shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-teal-600" />
                      </div>
                      <h3 className="font-black text-base text-slate-800 tracking-tight">{industry}</h3>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest mb-3">設定KPI例</p>
                    <p className="text-sm text-slate-600 font-bold mb-5">{kpis}</p>
                    <div className="mt-auto p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-teal-500 tracking-widest mb-2">AI提案例</p>
                      <p className="text-xs text-slate-700 font-bold italic leading-relaxed">{insight}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ コア機能 ═══════════════════ */}
        <section className="py-28 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-20">
              <p className="text-[11px] font-black tracking-widest text-teal-500 mb-5">コア機能</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">組織の力を最大化する3つの柱</h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: "KPI × ボイスチェック分析",
                  desc: "任意に設計したKPI実績と、ボイスチェックから得られるチームのコンディション指標を自動で照合。「どの要素が、どの数字に効いているか」をデータで示します。",
                },
                {
                  icon: Compass,
                  title: "改善ナレッジ付きAI提案",
                  desc: "課題の指摘で終わらず、「どうすれば改善できるか」のメソッドや成功パターンをセットで提案。経営層、管理部門、マネージャー、現場——4階層それぞれに最適化してお届けします。",
                },
                {
                  icon: Layers,
                  title: "経営の意思が反映される分析",
                  desc: "事業方針・フェーズ・KPIの解釈をAIに共有可能。汎用的な一般論ではなく、御社の経営意思に沿った文脈で分析・提案が行われます。",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 0.1} className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 shadow-lg hover:shadow-2xl hover:shadow-teal-100/50 hover:-translate-y-2 hover:bg-white transition-all duration-500 group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-7 h-7 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-black mb-4 text-slate-800 tracking-tight">{title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium text-sm">{desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ PRICING ═══════════════════ */}
        <section id="pricing" className="py-28 px-6 bg-[#F7F9FC]">
          <div className="max-w-6xl mx-auto">
            <Reveal className="text-center mb-20">
              <p className="text-[11px] font-black tracking-widest text-teal-500 mb-5">料金プラン</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">シンプルな料金プラン</h2>
              <p className="text-slate-500 font-bold">全プランに1ヶ月間の無料トライアル付き。カード登録不要。</p>
            </Reveal>

            {/* メイン3プラン横並び */}
            <div className="grid md:grid-cols-3 gap-6 items-stretch mb-10">
              <Reveal direction="left">
                <PricingCard
                  plan="Team"
                  sub="スモールスタートに最適"
                  price="30,000"
                  features={[
                    "KPI 5個まで",
                    "4軸バブルチャート（部署軸）",
                    "ボイスチェック",
                    "AI提案（現場向け）",
                    "メールサポート",
                  ]}
                  cta="無料で始める"
                  note="まず1部署で試して、効果を実感できます"
                />
              </Reveal>
              <Reveal delay={0.05}>
                <PricingCard
                  plan="Standard"
                  sub="100名までの組織に最適"
                  price="50,000"
                  recommended
                  features={[
                    "100名まで",
                    "KPI 10個まで",
                    "部署 無制限",
                    "タイムラプス機能",
                    "第2軸解放（プロダクト軸等）",
                    "Slack連携",
                    "4階層AI提案",
                    "経営方針の反映",
                    "チャットサポート",
                  ]}
                  cta="1ヶ月間トライアル"
                />
              </Reveal>
              <Reveal direction="right" delay={0.1}>
                <PricingCard
                  plan="Pro"
                  sub="100名以上の大規模組織向け"
                  price="150,000〜"
                  features={[
                    "Standard全機能",
                    "100名以上対応",
                    "部署間360度クロス分析",
                    "提案レポートエクスポート（PDF）",
                    "組織開示レポート出力",
                    "優先サポート＋専任担当",
                  ]}
                  cta="お問い合わせ"
                />
              </Reveal>
            </div>

            {/* Partnerプラン 下段 */}
            <Reveal delay={0.15}>
              <div className="max-w-5xl mx-auto p-8 md:p-10 rounded-[36px] bg-gradient-to-r from-white to-indigo-50/40 border border-slate-200 shadow-lg">
                {/* ヘッダー行 */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Partner</h3>
                  <span className="text-sm text-slate-400 font-bold">コンサル・VC向け</span>
                </div>
                {/* コンテンツ行: 上揃え */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                  {/* 機能リスト 2カラム */}
                  <div className="grid grid-cols-2 gap-x-10 gap-y-2.5 flex-1">
                    {[
                      "Standard全機能を包含",
                      "オンボーディング外販権",
                      "複数テナント一括管理",
                      "ホワイトラベル対応",
                      "クライアント横断ベンチマーク",
                      "専任パートナーサクセス",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2.5 text-slate-700 font-bold text-sm">
                        <Check className="w-4 h-4 text-indigo-500 shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                  {/* CTA */}
                  <div className="shrink-0 text-center space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">料金</p>
                    <p className="text-xl font-black text-slate-800">お問い合わせください</p>
                    <button className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 hover:scale-[1.02]">
                      パートナー相談する
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════ FINAL CTA ═══════════════════ */}
        <section className="py-36 px-6 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-teal-600/10 rounded-full blur-[180px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[180px] translate-y-1/2 -translate-x-1/3" />
          </div>
          <Reveal className="max-w-4xl mx-auto text-center relative z-10">
            <p className="text-[11px] font-black tracking-widest text-teal-500 mb-8">はじめませんか</p>
            <h2 className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight">
              あなたの組織に、<br />体温を。
            </h2>
            <p className="text-lg md:text-xl text-slate-400 font-bold mb-14 max-w-2xl mx-auto">
              KPIだけでは見えない「現場の力」を引き出し、<br />
              組織の強さを事業成長の原動力に変えましょう。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/dashboard" className="px-12 py-6 bg-white text-slate-900 rounded-[20px] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3">
                今すぐ無料で試す <ArrowUpRight className="w-5 h-5" />
              </Link>
              <Link href="#" className="px-12 py-6 border-2 border-slate-700 text-white rounded-[20px] font-black text-xl hover:bg-slate-800/50 transition-all flex items-center justify-center gap-3">
                <Heart className="w-5 h-5 text-teal-400" /> まず話を聞いてみる
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-200">
                <span className="text-white font-black text-lg italic">S</span>
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">Signs AI</span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Give Organization Warmth — Taion Inc.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {["Privacy", "Terms", "Security", "Career", "Contact"].map((l) => (
              <Link key={l} href="#" className="hover:text-teal-600 transition-colors">{l}</Link>
            ))}
          </div>
        </div>
        <div className="mt-12 text-center text-slate-300 text-[9px] font-black uppercase tracking-[0.5em]">
          &copy; 2026 Signs AI / Taion Inc. All Rights Reserved.
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        body { font-family: var(--font-noto-sans-jp), var(--font-inter), sans-serif; }
      `}</style>
    </div>
  );
}

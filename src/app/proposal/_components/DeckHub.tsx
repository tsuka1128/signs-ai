"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { decks, getDeck, type Deck, type Slide } from "../_data/proposals";
import { SlideBlocks } from "./SlideBlocks";

const DEFAULT_DECK = decks[0];

/** URLハッシュ #/d/<deckId>/<slideNo> を解釈 */
function parseHash(): { deckId: string; slide: number } {
  if (typeof window === "undefined") return { deckId: DEFAULT_DECK.id, slide: 0 };
  const m = window.location.hash.match(/#\/d\/([^/]+)\/(\d+)/);
  if (m) {
    const deckId = decodeURIComponent(m[1]);
    const slide = Math.max(0, parseInt(m[2], 10) - 1);
    return { deckId, slide };
  }
  return { deckId: DEFAULT_DECK.id, slide: 0 };
}

export default function DeckHub() {
  const [deckId, setDeckId] = useState<string>(DEFAULT_DECK.id);
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const thumbStripRef = useRef<HTMLDivElement>(null);

  const deck: Deck = useMemo(() => getDeck(deckId) ?? DEFAULT_DECK, [deckId]);
  const total = deck.slides.length;
  const current = deck.slides[Math.min(slide, total - 1)];

  /* ── ハッシュ初期化 ── */
  useEffect(() => {
    const { deckId: d, slide: s } = parseHash();
    if (getDeck(d)) { setDeckId(d); setSlide(s); }
    const onHash = () => {
      const p = parseHash();
      if (getDeck(p.deckId)) { setDeckId(p.deckId); setSlide(p.slide); }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  /* ── ハッシュ同期 ── */
  useEffect(() => {
    const next = `#/d/${deckId}/${slide + 1}`;
    if (window.location.hash !== next) window.history.replaceState(null, "", next);
  }, [deckId, slide]);

  /* ── サムネイルを中央スクロール ── */
  useEffect(() => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    const el = strip.children[slide] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [slide]);

  const go = useCallback((next: number) => {
    setDir(next > slide ? 1 : -1);
    setSlide(Math.max(0, Math.min(total - 1, next)));
  }, [slide, total]);

  const selectDeck = useCallback((id: string) => {
    setDir(1); setDeckId(id); setSlide(0);
  }, []);

  /* ── キーボード ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault(); go(slide + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault(); go(slide - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, slide]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d0f14] select-none">

      {/* ═══ TOP BAR ═══ */}
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#0d0f14] px-5 py-2.5">
        {/* ロゴ */}
        <div className="flex items-center gap-1.5 pr-4 border-r border-white/[0.12] flex-shrink-0">
          <span className="text-sm font-black tracking-tight text-white">
            Signs<span style={{ color: "#4ECDC4" }}> AI</span>
          </span>
          <span className="text-[10px] text-gray-600 font-medium hidden sm:inline">提案資料</span>
        </div>

        {/* デッキタブ */}
        <nav className="flex gap-1">
          {decks.map((d) => (
            <button
              key={d.id}
              onClick={() => selectDeck(d.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                d.id === deckId
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.07]"
              }`}
            >
              <span className="text-sm leading-none">{d.icon}</span>
              <span className="hidden sm:inline">{d.persona}</span>
            </button>
          ))}
        </nav>

        {/* スライドカウンター */}
        <div className="ml-auto flex items-baseline gap-0.5 font-mono flex-shrink-0">
          <span
            className="text-lg font-extrabold tabular-nums leading-none"
            style={{ color: deck.accent }}
          >
            {String(slide + 1).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-gray-600">
            &nbsp;/&nbsp;{String(total).padStart(2, "0")}
          </span>
        </div>
      </header>

      {/* ═══ SLIDE AREA ═══ */}
      <main className="flex flex-1 min-h-0 items-center justify-center px-12 py-3">
        {/*
          maxWidth = min(1160px, height-based):
          スライドが縦にはみ出さないよう、利用可能な縦幅から16:9比率で最大幅を算出
          (100vh - header≈44px - thumbnails≈76px - py-3*2≈24px) = 約144px を差し引く
        */}
        <div
          className="relative w-full"
          style={{ maxWidth: "min(1160px, calc((100vh - 144px) * 16 / 9))" }}
        >
          {/* ← 前へ ボタン */}
          <button
            onClick={() => go(slide - 1)}
            disabled={slide === 0}
            className="absolute -left-10 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-20"
            aria-label="前のスライド"
          >
            <ChevronLeft size={18} />
          </button>

          {/* 16:9 スライド本体 */}
          <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={`${deck.id}-${slide}`}
                custom={dir}
                initial={{ opacity: 0, x: dir * 56 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -56 }}
                transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex h-full"
              >
                {/* 左パネル: 画像 or プレースホルダー */}
                <LeftPanel deck={deck} slide={current} slideIndex={slide} total={total} />

                {/* 右パネル: テキストコンテンツ */}
                <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-9 py-7">
                  {/* アクセントライン（上部） */}
                  <div
                    className="absolute left-0 right-0 top-0 h-[3px]"
                    style={{ background: deck.accent }}
                  />

                  {/* キッカー */}
                  <p
                    className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: deck.accent }}
                  >
                    {current.kicker}
                  </p>

                  {/* タイトル */}
                  <h2 className="mb-4 text-[17px] font-extrabold leading-snug text-gray-900 xl:text-lg 2xl:text-xl">
                    {current.title}
                  </h2>

                  {/* コンテンツブロック */}
                  <div className="min-h-0 flex-1">
                    <SlideBlocks blocks={current.blocks} accent={deck.accent} />
                  </div>

                  {/* バッジ（右下） */}
                  <div className="absolute bottom-2.5 right-4 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full" style={{ background: deck.accent }} />
                    <span className="text-[9px] font-medium text-gray-300">Signs AI</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* → 次へ ボタン */}
          <button
            onClick={() => go(slide + 1)}
            disabled={slide === total - 1}
            className="absolute -right-10 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-20"
            aria-label="次のスライド"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </main>

      {/* ═══ THUMBNAIL STRIP ═══ */}
      <div className="flex-shrink-0 border-t border-white/[0.07] bg-[#0a0c10] px-4 py-2.5">
        <div
          ref={thumbStripRef}
          className="flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {deck.slides.map((s, i) => {
            const active = i === slide;
            return (
              <ThumbnailButton
                key={i}
                slide={s}
                index={i}
                active={active}
                accent={deck.accent}
                icon={deck.icon}
                onClick={() => go(i)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Left Panel ─────────────────────── */
function LeftPanel({
  deck,
  slide,
  slideIndex,
  total,
}: {
  deck: Deck;
  slide: Slide;
  slideIndex: number;
  total: number;
}) {
  /* 実画像がある場合はそちらを表示 */
  if (slide.image) {
    return (
      <div className="relative flex-shrink-0 overflow-hidden" style={{ width: "42%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.image}
          alt={slide.title}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  /* プレースホルダー */
  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        width: "42%",
        background: `linear-gradient(145deg, ${deck.accent}f2 0%, ${deck.accent}99 55%, ${deck.accent}55 100%)`,
      }}
    >
      {/* ドットグリッド */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* デコレーション円 */}
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/[0.08]" />
      <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/[0.05]" />

      {/* 中央コンテンツ */}
      <div className="relative flex h-full flex-col items-center justify-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg"
          style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
        >
          {deck.icon}
        </div>
        <div className="px-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/90">
            {deck.persona}
          </p>
          <p className="mt-0.5 text-[9px] text-white/50">{deck.role}</p>
        </div>
      </div>

      {/* スライド番号（右下） */}
      <div className="absolute bottom-3 right-4 font-mono text-[11px] text-white/25">
        {String(slideIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>

      {/* 下部ライン */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />
    </div>
  );
}

/* ─────────────────────── Thumbnail Button ─────────────────────── */
function ThumbnailButton({
  slide,
  index,
  active,
  accent,
  icon,
  onClick,
}: {
  slide: Slide;
  index: number;
  active: boolean;
  accent: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={slide.title}
      className={`group relative flex-shrink-0 overflow-hidden rounded-md transition-all duration-200 focus:outline-none ${
        active ? "opacity-100" : "opacity-35 hover:opacity-65"
      }`}
      style={
        active
          ? { outline: `2px solid ${accent}`, outlineOffset: "1px" }
          : undefined
      }
    >
      {/* ミニ16:9スライド (108×61) */}
      <div style={{ width: 108, height: 61 }} className="flex">
        {/* 左グラデーション */}
        <div
          className="flex flex-shrink-0 items-center justify-center text-sm"
          style={{
            width: "42%",
            background: `linear-gradient(145deg, ${accent}ee, ${accent}66)`,
          }}
        >
          {icon}
        </div>
        {/* 右ホワイト */}
        <div className="flex flex-1 flex-col justify-center bg-white px-1.5 py-1.5">
          <p className="text-[5.5px] font-bold leading-tight text-gray-900 line-clamp-2">
            {slide.title}
          </p>
          <div className="mt-1.5 space-y-[3px]">
            <div className="h-[1.5px] w-full rounded-full bg-gray-200" />
            <div className="h-[1.5px] w-4/5 rounded-full bg-gray-200" />
            <div className="h-[1.5px] w-3/5 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      {/* スライド番号オーバーレイ */}
      <span
        className="absolute bottom-0.5 left-1 text-[7px] font-bold text-white"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </button>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { decks, getDeck, type Deck, type Slide } from "../_data/proposals";
import { SlideBlocks } from "./SlideBlocks";

const DEFAULT_DECK = decks[0];

function parseHash(): { deckId: string; slide: number } {
  if (typeof window === "undefined") return { deckId: DEFAULT_DECK.id, slide: 0 };
  const m = window.location.hash.match(/#\/d\/([^/]+)\/(\d+)/);
  if (m) {
    return { deckId: decodeURIComponent(m[1]), slide: Math.max(0, parseInt(m[2], 10) - 1) };
  }
  return { deckId: DEFAULT_DECK.id, slide: 0 };
}

export default function DeckHub() {
  const [deckId, setDeckId] = useState<string>(DEFAULT_DECK.id);
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLDivElement>(null);

  const deck: Deck = useMemo(() => getDeck(deckId) ?? DEFAULT_DECK, [deckId]);
  const total = deck.slides.length;
  const current = deck.slides[Math.min(slide, total - 1)];

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

  useEffect(() => {
    const next = `#/d/${deckId}/${slide + 1}`;
    if (window.location.hash !== next) window.history.replaceState(null, "", next);
  }, [deckId, slide]);

  useEffect(() => {
    const strip = thumbStripRef.current;
    if (strip) {
      const el = strip.children[slide] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    const toc = tocRef.current;
    if (toc) {
      const el = toc.children[slide] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [slide]);

  const go = useCallback((next: number) => {
    setDir(next > slide ? 1 : -1);
    setSlide(Math.max(0, Math.min(total - 1, next)));
  }, [slide, total]);

  const selectDeck = useCallback((id: string) => {
    setDir(1); setDeckId(id); setSlide(0);
  }, []);

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
    <div
      className="flex h-screen overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg, #F0F9F8 0%, #DCEEFB 45%, #E8F7F1 100%)" }}
    >
      {/* ════════════════════════════
           SIDEBAR — desktop only
          ════════════════════════════ */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-slate-200/70 px-5 py-4">
          <span className="text-base font-black tracking-tight text-slate-900">
            Signs<span style={{ color: "#38B2AC" }}> AI</span>
          </span>
          <span className="text-[10px] font-medium text-slate-400">提案資料</span>
        </div>

        <div className="px-3 pt-4">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            提案資料を選ぶ
          </p>
          <div className="space-y-1">
            {decks.map((d) => {
              const isActive = d.id === deckId;
              return (
                <button
                  key={d.id}
                  onClick={() => selectDeck(d.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${
                    isActive ? "shadow-sm" : "hover:bg-slate-100/80"
                  }`}
                  style={isActive ? { background: `${d.accent}14`, outline: `1.5px solid ${d.accent}55` } : undefined}
                >
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-base"
                    style={{ background: isActive ? d.accent : "#F1F5F9" }}
                  >
                    {d.icon}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-xs font-bold leading-tight ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                      {d.category}
                    </span>
                    <span className="block truncate text-[10px] text-slate-400">{d.personaEn}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-slate-200/70 pt-3">
          <p className="px-5 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            目次 ｜ {String(total).padStart(2, "0")} slides
          </p>
          <div ref={tocRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: "thin" }}>
            {deck.slides.map((s, i) => {
              const isActive = i === slide;
              return (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    isActive ? "bg-white shadow-sm" : "hover:bg-white/60"
                  }`}
                >
                  <span className="mt-px font-mono text-[10px] font-bold tabular-nums" style={{ color: isActive ? deck.accent : "#cbd5e1" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`text-[11px] leading-snug ${isActive ? "font-bold text-slate-900" : "font-medium text-slate-500"}`}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════
           MAIN
          ════════════════════════════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ── Mobile top bar ── */}
        <header className="flex md:hidden flex-shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl px-4 py-2.5">
          <span className="flex-shrink-0 text-sm font-black tracking-tight text-slate-900">
            Signs<span style={{ color: "#38B2AC" }}> AI</span>
          </span>
          <nav className="flex flex-1 min-w-0 gap-1.5 mx-1">
            {decks.map((d) => {
              const isActive = d.id === deckId;
              return (
                <button
                  key={d.id}
                  onClick={() => selectDeck(d.id)}
                  className={`flex min-w-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold truncate transition-all ${
                    isActive ? "text-white" : "bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/60"
                  }`}
                  style={isActive ? { background: d.accent } : undefined}
                >
                  <span className="flex-shrink-0">{d.icon}</span>
                  <span className="truncate">{d.category}</span>
                </button>
              );
            })}
          </nav>
          <div className="flex-shrink-0 font-mono text-xs">
            <span className="font-extrabold" style={{ color: deck.accent }}>
              {String(slide + 1).padStart(2, "0")}
            </span>
            <span className="text-slate-400"> / {String(total).padStart(2, "0")}</span>
          </div>
        </header>

        {/* ── Desktop header ── */}
        <header className="hidden md:flex flex-shrink-0 items-center gap-3 px-8 pt-5 pb-1">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: deck.accent }}>
              {deck.personaEn}
            </p>
            <h1 className="truncate text-base font-extrabold text-slate-900">{deck.title}</h1>
          </div>
          <div className="ml-auto flex items-baseline gap-0.5 font-mono">
            <span className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: deck.accent }}>
              {String(slide + 1).padStart(2, "0")}
            </span>
            <span className="text-xs text-slate-400">&nbsp;/&nbsp;{String(total).padStart(2, "0")}</span>
          </div>
        </header>

        {/* ════════════════════════════
             MOBILE SLIDE (card view)
            ════════════════════════════ */}
        <div className="flex md:hidden flex-1 min-h-0 flex-col">
          <div className="relative flex-1 min-h-0 mx-3 my-2">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={`mob-${deck.id}-${slide}`}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute inset-0 overflow-y-auto rounded-2xl bg-white px-5 py-6 shadow-[0_8px_40px_rgba(15,23,42,0.1)] ring-1 ring-slate-200/60"
              >
                <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl" style={{ background: deck.accent }} />
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: deck.accent }}>
                  {current.kicker}
                </p>
                <h2 className="mb-4 text-[18px] font-extrabold leading-snug text-slate-900">
                  {current.title}
                </h2>
                <SlideBlocks blocks={current.blocks} accent={deck.accent} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile nav row */}
          <div className="flex flex-shrink-0 items-center justify-between px-4 pb-3 pt-1">
            <button
              onClick={() => go(slide - 1)}
              disabled={slide === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="前のスライド"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Mini TOC dots */}
            <div className="flex items-center gap-1 overflow-hidden max-w-[180px]">
              {deck.slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className="flex-shrink-0 rounded-full transition-all"
                  style={{
                    width: i === slide ? 20 : 6,
                    height: 6,
                    background: i === slide ? deck.accent : "#CBD5E1",
                  }}
                  aria-label={`スライド ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => go(slide + 1)}
              disabled={slide === total - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="次のスライド"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* ════════════════════════════
             DESKTOP SLIDE (16:9)
            ════════════════════════════ */}
        <main className="hidden md:flex flex-1 min-h-0 items-center justify-center px-12 py-2">
          <div
            className="relative w-full"
            style={{ maxWidth: "min(1100px, calc((100vh - 188px) * 16 / 9))" }}
          >
            <button
              onClick={() => go(slide - 1)}
              disabled={slide === 0}
              className="absolute -left-11 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 transition hover:text-slate-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="前のスライド"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/60">
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
                  <LeftPanel deck={deck} slide={current} slideIndex={slide} total={total} />
                  <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-9 py-7">
                    <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ background: deck.accent }} />
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: deck.accent }}>
                      {current.kicker}
                    </p>
                    <h2 className="mb-4 text-[17px] font-extrabold leading-snug text-slate-900 xl:text-lg 2xl:text-xl">
                      {current.title}
                    </h2>
                    <div className="min-h-0 flex-1">
                      <SlideBlocks blocks={current.blocks} accent={deck.accent} />
                    </div>
                    <div className="absolute bottom-2.5 right-4 flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full" style={{ background: deck.accent }} />
                      <span className="text-[9px] font-medium text-slate-300">Signs AI</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={() => go(slide + 1)}
              disabled={slide === total - 1}
              className="absolute -right-11 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 transition hover:text-slate-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="次のスライド"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </main>

        {/* ── Desktop thumbnail strip ── */}
        <div className="hidden md:block flex-shrink-0 px-6 py-3">
          <div
            ref={thumbStripRef}
            className="flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            {deck.slides.map((s, i) => (
              <ThumbnailButton
                key={i}
                slide={s}
                index={i}
                active={i === slide}
                accent={deck.accent}
                icon={deck.icon}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Left Panel ─────────────────────── */
function LeftPanel({ deck, slide, slideIndex, total }: { deck: Deck; slide: Slide; slideIndex: number; total: number }) {
  if (slide.image) {
    return (
      <div className="relative flex-shrink-0 overflow-hidden" style={{ width: "42%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        width: "42%",
        background: `linear-gradient(145deg, ${deck.accent}f2 0%, ${deck.accent}99 55%, ${deck.accent}55 100%)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/[0.08]" />
      <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/[0.05]" />
      <div className="relative flex h-full flex-col items-center justify-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg"
          style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
        >
          {deck.icon}
        </div>
        <div className="px-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/90">{deck.persona}</p>
          <p className="mt-0.5 text-[9px] text-white/50">{deck.role}</p>
        </div>
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[11px] text-white/25">
        {String(slideIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />
    </div>
  );
}

/* ─────────────────────── Thumbnail Button ─────────────────────── */
function ThumbnailButton({ slide, index, active, accent, icon, onClick }: {
  slide: Slide; index: number; active: boolean; accent: string; icon: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={slide.title}
      className={`group relative flex-shrink-0 overflow-hidden rounded-md bg-white transition-all duration-200 focus:outline-none ${
        active ? "opacity-100 shadow-md" : "opacity-50 hover:opacity-80"
      }`}
      style={active ? { outline: `2px solid ${accent}`, outlineOffset: "1px" } : undefined}
    >
      <div style={{ width: 108, height: 61 }} className="flex">
        <div
          className="flex flex-shrink-0 items-center justify-center text-sm"
          style={{ width: "42%", background: `linear-gradient(145deg, ${accent}ee, ${accent}66)` }}
        >
          {icon}
        </div>
        <div className="flex flex-1 flex-col justify-center bg-white px-1.5 py-1.5">
          <p className="text-[5.5px] font-bold leading-tight text-slate-900 line-clamp-2">{slide.title}</p>
          <div className="mt-1.5 space-y-[3px]">
            <div className="h-[1.5px] w-full rounded-full bg-slate-200" />
            <div className="h-[1.5px] w-4/5 rounded-full bg-slate-200" />
            <div className="h-[1.5px] w-3/5 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
      <span className="absolute bottom-0.5 left-1 text-[7px] font-bold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
        {String(index + 1).padStart(2, "0")}
      </span>
    </button>
  );
}

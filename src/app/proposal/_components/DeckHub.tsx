"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Check,
  BarChart3,
  Users,
  FileText,
  Blocks,
  type LucideIcon,
} from "lucide-react";
import { decks, getDeck, type Deck, type Slide } from "../_data/proposals";
import { SlideBlocks } from "./SlideBlocks";
import { SlideVisual } from "./SlideVisuals";

/** Deck.icon（lucide名）→ コンポーネント解決 */
const DECK_ICONS: Record<string, LucideIcon> = { BarChart3, Users, FileText, Blocks };

function DeckIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = DECK_ICONS[name] ?? BarChart3;
  return <Icon size={size} strokeWidth={2.5} />;
}

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
  const [clean, setClean] = useState(false);
  const [copied, setCopied] = useState(false);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const deck: Deck = useMemo(() => getDeck(deckId) ?? DEFAULT_DECK, [deckId]);
  const total = deck.slides.length;
  const current = deck.slides[Math.min(slide, total - 1)];
  const progress = Math.round(((slide + 1) / total) * 100);

  useEffect(() => {
    const { deckId: d, slide: s } = parseHash();
    if (getDeck(d)) { setDeckId(d); setSlide(s); }
    const params = new URLSearchParams(window.location.search);
    setClean(params.get("share") === "1" || params.has("present"));
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

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}?share=1${window.location.hash || `#/d/${deckId}/${slide + 1}`}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // クリップボードAPIが使えない場合のフォールバック
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [deckId, slide]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 48) go(delta < 0 ? slide + 1 : slide - 1);
    touchStartX.current = null;
  }, [go, slide]);

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
    <>
    <div
      className="flex h-screen overflow-hidden select-none no-print"
      style={{ background: "linear-gradient(135deg, #F0F9F8 0%, #DCEEFB 45%, #E8F7F1 100%)" }}
    >

      {/* ════════════════════════════════
           SIDEBAR — desktop only
           共有ビューではデッキ切替を隠し、目次は残す
          ════════════════════════════════ */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200/60 bg-white/75 backdrop-blur-2xl md:flex">

        {/* ロゴエリア */}
        <div className="relative overflow-hidden border-b border-slate-200/60 px-5 py-4">
          {/* accent strip */}
          <div
            className="absolute left-0 right-0 top-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, ${deck.accent}, ${deck.accent}00)` }}
          />
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-black"
              style={{
                background: `linear-gradient(135deg, ${deck.accent}30, ${deck.accent}10)`,
                color: deck.accent,
                boxShadow: `inset 0 0 0 1px ${deck.accent}30`,
              }}
            >
              S
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900">
              Signs<span style={{ color: "#38B2AC" }}> AI</span>
            </span>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              提案
            </span>
          </div>
        </div>

        {/* デッキ切替（共有ビューでは非表示） */}
        {!clean && (
        <div className="px-3 pt-4">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            提案資料を選ぶ
          </p>
          <div className="space-y-1.5">
            {decks.map((d) => {
              const isActive = d.id === deckId;
              return (
                <button
                  key={d.id}
                  onClick={() => selectDeck(d.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                    isActive ? "" : "hover:bg-slate-100/80"
                  }`}
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(135deg, ${d.accent}18, ${d.accent}08)`,
                          boxShadow: `0 0 0 1.5px ${d.accent}44, 0 2px 8px ${d.accent}18`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all"
                    style={
                      isActive
                        ? { background: d.accent, boxShadow: `0 4px 12px ${d.accent}55`, color: "#fff" }
                        : { background: "#F1F5F9", color: "#64748b" }
                    }
                  >
                    <DeckIcon name={d.icon} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-xs font-bold leading-tight ${
                        isActive ? "text-slate-900" : "text-slate-600"
                      }`}
                    >
                      {d.category}
                    </span>
                    <span className="block truncate text-[10px] text-slate-400">{d.personaEn}</span>
                  </span>
                  {isActive && (
                    <span
                      className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: d.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* 目次 */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-slate-200/60 pt-3">
          <p className="px-5 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            目次 · {String(slide + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <div
            ref={tocRef}
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-2"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
          >
            {deck.slides.map((s, i) => {
              const isActive = i === slide;
              return (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all duration-150 ${
                    isActive ? "bg-white shadow-sm" : "hover:bg-white/70"
                  }`}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-all"
                    style={
                      isActive
                        ? { background: deck.accent, color: "#fff" }
                        : { background: "#F1F5F9", color: "#94a3b8" }
                    }
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-[11px] leading-snug ${
                      isActive ? "font-bold text-slate-900" : "font-medium text-slate-500"
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 進捗バー */}
        <div className="flex-shrink-0 border-t border-slate-200/60 px-5 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400">進捗</span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: deck.accent }}>
              {progress}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full"
              style={{ background: deck.accent }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════
           MAIN
          ════════════════════════════════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ── Mobile top bar ── */}
        <header className="flex md:hidden flex-shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl px-4 py-2.5">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[12px] font-black"
            style={{ background: `${deck.accent}20`, color: deck.accent }}
          >
            S
          </div>
          {clean ? (
            <span className="flex-1 min-w-0 mx-1 truncate text-[13px] font-extrabold text-slate-900">
              {deck.title}
            </span>
          ) : (
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
                    <span className="flex-shrink-0"><DeckIcon name={d.icon} size={12} /></span>
                    <span className="truncate">{d.category}</span>
                  </button>
                );
              })}
            </nav>
          )}
          {!clean && (
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                onClick={handleShare}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/60 transition active:scale-95"
                aria-label="共有リンクをコピー"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              </button>
              <button
                onClick={handlePrint}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/60 transition active:scale-95"
                aria-label="PDFで保存"
              >
                <Download size={14} />
              </button>
            </div>
          )}
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
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: deck.accent }}
            >
              {deck.personaEn}
            </p>
            <h1 className="truncate text-[15px] font-extrabold text-slate-900">{deck.title}</h1>
          </div>
          {!clean && (
            <div className="ml-auto flex flex-shrink-0 items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/70 transition hover:text-slate-900 hover:shadow active:scale-95"
                aria-label="共有リンクをコピー"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-500" />
                    <span className="text-emerald-600">コピー済み</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>共有</span>
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition hover:shadow active:scale-95"
                style={{ background: deck.accent }}
                aria-label="PDFで保存"
              >
                <Download size={14} />
                <span>PDF</span>
              </button>
            </div>
          )}
          <div className={`${clean ? "ml-auto" : ""} flex items-baseline gap-0.5 font-mono flex-shrink-0`}>
            <span
              className="text-[26px] font-extrabold tabular-nums leading-none"
              style={{ color: deck.accent }}
            >
              {String(slide + 1).padStart(2, "0")}
            </span>
            <span className="text-xs text-slate-400">&nbsp;/&nbsp;{String(total).padStart(2, "0")}</span>
          </div>
        </header>

        {/* ════════════════════════════════
             MOBILE SLIDE (card view)
            ════════════════════════════════ */}
        <div className="flex md:hidden flex-1 min-h-0 flex-col">
          <div
            className="relative flex-1 min-h-0 mx-3 my-2"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div
              key={`mob-${deck.id}-${slide}`}
              initial={{ opacity: 0, x: dir * 36, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-0 overflow-y-auto rounded-2xl bg-white px-5 py-6 shadow-[0_8px_40px_rgba(15,23,42,0.1)] ring-1 ring-slate-200/60"
            >
              <div
                className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${deck.accent}, ${deck.accent}66)` }}
              />
              <p
                className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: deck.accent }}
              >
                {current.kicker}
              </p>
              <h2 className="mb-4 text-[18px] font-extrabold leading-snug text-slate-900">
                {current.title}
              </h2>
              {current.visual && (
                <div
                  className="mb-4 flex items-center justify-center rounded-xl px-4 py-5"
                  style={{
                    background: `linear-gradient(155deg, ${deck.accent} 0%, ${deck.accent}dd 60%, ${deck.accent}99 100%)`,
                  }}
                >
                  <SlideVisual visual={current.visual} accent={deck.accent} />
                </div>
              )}
              <SlideBlocks blocks={current.blocks} accent={deck.accent} />
            </motion.div>
          </div>

          <div className="flex flex-shrink-0 items-center justify-between px-4 pb-3 pt-1">
            <button
              onClick={() => go(slide - 1)}
              disabled={slide === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="前のスライド"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1 overflow-hidden max-w-[180px]">
              {deck.slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className="flex-shrink-0 rounded-full transition-all duration-200"
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

        {/* ════════════════════════════════
             DESKTOP SLIDE (16:9)
            ════════════════════════════════ */}
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

            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.15)] ring-1 ring-slate-200/60">
              <motion.div
                key={`${deck.id}-${slide}`}
                initial={{ opacity: 0, x: dir * 48, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex h-full"
              >
                <LeftPanel deck={deck} slide={current} slideIndex={slide} total={total} />

                <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-9 py-7">
                  <div
                    className="absolute left-0 right-0 top-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg, ${deck.accent}, ${deck.accent}55)` }}
                  />
                  <p
                    className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: deck.accent }}
                  >
                    {current.kicker}
                  </p>
                  <h2 className="mb-4 text-[17px] font-extrabold leading-snug text-slate-900 xl:text-[18px] 2xl:text-xl">
                    {current.title}
                  </h2>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <SlideBlocks blocks={current.blocks} accent={deck.accent} />
                  </div>
                  <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5">
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ background: deck.accent }}
                    />
                    <span className="text-[9px] font-semibold tracking-wider text-slate-300 uppercase">
                      Signs AI
                    </span>
                  </div>
                </div>
              </motion.div>
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
        <div className="hidden md:block flex-shrink-0 px-6 py-2.5">
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

    {/* ════════════════════════════════
         PRINT-ONLY — 全スライドをPDF用に展開
         （画面では display:none、印刷/PDF時のみ表示）
        ════════════════════════════════ */}
    <PrintDeck deck={deck} />
    </>
  );
}

/* ─────────────────────────────────────────
   PrintDeck — 印刷/PDF専用ビュー
   ・現在のデッキの全スライドを 16:9 ページとして展開
   ・1スライド = 1ページ（globals.css の @page / .print-slide 参照）
  ───────────────────────────────────────── */
function PrintDeck({ deck }: { deck: Deck }) {
  const total = deck.slides.length;
  return (
    <div className="print-only">
      {deck.slides.map((s, i) => (
        <div key={i} className="print-slide flex">
          <LeftPanel deck={deck} slide={s} slideIndex={i} total={total} />
          <div className="relative flex flex-1 flex-col justify-center bg-white px-10 py-8">
            <div
              className="absolute left-0 right-0 top-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, ${deck.accent}, ${deck.accent}55)` }}
            />
            <p
              className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: deck.accent }}
            >
              {s.kicker}
            </p>
            <h2 className="mb-5 text-[20px] font-extrabold leading-snug text-slate-900">
              {s.title}
            </h2>
            <div className="flex-1">
              <SlideBlocks blocks={s.blocks} accent={deck.accent} />
            </div>
            <div className="absolute bottom-3 right-5 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full" style={{ background: deck.accent }} />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-300">
                Signs AI
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Left Panel — 刷新版
   ・大きなゴースト番号（背景）
   ・スライドタイトルを白文字で表示
   ・下部にデッキ情報＋進捗バー
  ───────────────────────────────────────── */
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
  if (slide.image) {
    return (
      <div className="relative flex-shrink-0 overflow-hidden" style={{ width: "42%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
      </div>
    );
  }

  const pct = ((slideIndex + 1) / total) * 100;

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        width: "42%",
        background: `linear-gradient(155deg, ${deck.accent} 0%, ${deck.accent}dd 50%, ${deck.accent}88 100%)`,
      }}
    >
      {/* 斜めストライプテクスチャ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 14px)",
        }}
      />

      {/* コーナーアクセント */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/[0.07]" />
      <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/[0.04]" />

      {/* ゴースト番号（背景・ビジュアル未指定時のみ） */}
      {!slide.visual && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <span
            className="font-black text-white leading-none tabular-nums select-none"
            style={{ fontSize: 148, opacity: 0.07, letterSpacing: "-0.04em" }}
          >
            {String(slideIndex + 1).padStart(2, "0")}
          </span>
        </div>
      )}

      {/* コンテンツ */}
      <div className="relative flex h-full flex-col justify-between px-7 py-6">

        {/* 上部: スライド番号バー */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-white/50">
            {String(slideIndex + 1).padStart(2, "0")}
          </span>
          <div className="h-px flex-1 bg-white/15" />
          <span className="font-mono text-[11px] text-white/25">
            {String(total).padStart(2, "0")}
          </span>
        </div>

        {/* 中央: ビジュアル（指定時）またはスライドタイトル */}
        <div className="flex min-h-0 flex-1 items-center py-4">
          {slide.visual ? (
            <SlideVisual visual={slide.visual} accent={deck.accent} />
          ) : (
            <h3
              className="font-extrabold text-white leading-snug line-clamp-4"
              style={{ fontSize: "clamp(13px, 1.55vw, 19px)" }}
            >
              {slide.title}
            </h3>
          )}
        </div>

        {/* 下部: デッキ情報 + 進捗 */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <DeckIcon name={deck.icon} size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/75 truncate">
                {deck.persona}
              </p>
              <p className="text-[9px] text-white/40 truncate">{deck.role}</p>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-white/60"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
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
      className={`group relative flex-shrink-0 overflow-hidden rounded-md bg-white transition-all duration-200 focus:outline-none ${
        active ? "opacity-100 shadow-md" : "opacity-40 hover:opacity-75"
      }`}
      style={
        active
          ? { outline: `2px solid ${accent}`, outlineOffset: "1px", boxShadow: `0 4px 12px ${accent}30` }
          : undefined
      }
    >
      <div style={{ width: 108, height: 61 }} className="flex">
        <div
          className="flex flex-shrink-0 items-center justify-center text-white"
          style={{
            width: "42%",
            background: `linear-gradient(145deg, ${accent}ee, ${accent}66)`,
          }}
        >
          <DeckIcon name={icon} size={13} />
        </div>
        <div className="flex flex-1 flex-col justify-center bg-white px-1.5 py-1.5">
          <p className="text-[5.5px] font-bold leading-tight text-slate-900 line-clamp-2">
            {slide.title}
          </p>
          <div className="mt-1.5 space-y-[3px]">
            <div className="h-[1.5px] w-full rounded-full bg-slate-200" />
            <div className="h-[1.5px] w-4/5 rounded-full bg-slate-200" />
            <div className="h-[1.5px] w-3/5 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
      <span
        className="absolute bottom-0.5 left-1 text-[7px] font-bold text-white"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </button>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Menu,
  X,
} from "lucide-react";
import { decks, decksByCategory, getDeck, type Deck } from "../_data/proposals";
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
  const [navOpen, setNavOpen] = useState(false);

  const deck: Deck = useMemo(() => getDeck(deckId) ?? DEFAULT_DECK, [deckId]);
  const total = deck.slides.length;
  const current = deck.slides[Math.min(slide, total - 1)];

  /* 初期化：ハッシュから復元 */
  useEffect(() => {
    const { deckId: d, slide: s } = parseHash();
    if (getDeck(d)) {
      setDeckId(d);
      setSlide(s);
    }
    const onHash = () => {
      const parsed = parseHash();
      if (getDeck(parsed.deckId)) {
        setDeckId(parsed.deckId);
        setSlide(parsed.slide);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  /* 状態 → ハッシュ同期 */
  useEffect(() => {
    const next = `#/d/${deckId}/${slide + 1}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [deckId, slide]);

  const go = useCallback(
    (next: number) => {
      setDir(next > slide ? 1 : -1);
      setSlide(Math.max(0, Math.min(total - 1, next)));
    },
    [slide, total],
  );

  const selectDeck = useCallback((id: string) => {
    setDir(1);
    setDeckId(id);
    setSlide(0);
    setNavOpen(false);
  }, []);

  /* キーボード操作 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        go(slide + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        go(slide - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, slide]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* ───── サイドバー ───── */}
      <Sidebar
        deck={deck}
        slide={slide}
        navOpen={navOpen}
        onSelectDeck={selectDeck}
        onSelectSlide={(i) => {
          go(i);
          setNavOpen(false);
        }}
        onClose={() => setNavOpen(false)}
      />

      {/* オーバーレイ（モバイル） */}
      {navOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* ───── メイン ───── */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* トップバー */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-8">
          <button
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="メニュー"
          >
            <Menu size={20} />
          </button>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
            style={{ background: `${deck.accent}1A` }}
          >
            {deck.icon}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold leading-tight">{deck.title}</div>
            <div className="truncate text-xs text-slate-400">
              {deck.persona}（{deck.personaEn}）／ {deck.role}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-400">
            <span className="tabular-nums" style={{ color: deck.accent }}>
              {String(slide + 1).padStart(2, "0")}
            </span>
            <span>/ {String(total).padStart(2, "0")}</span>
          </div>
        </header>

        {/* スライド本体 */}
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={`${deck.id}-${slide}`}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-0 overflow-y-auto"
            >
              <div className="mx-auto max-w-3xl px-5 py-8 md:px-10 md:py-12">
                <div
                  className="mb-2 text-xs font-bold uppercase tracking-wider"
                  style={{ color: deck.accent }}
                >
                  {current.kicker}
                </div>
                <h1 className="mb-7 text-2xl font-extrabold leading-snug text-slate-900 md:text-[28px]">
                  {current.title}
                </h1>
                <SlideBlocks blocks={current.blocks} accent={deck.accent} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* フッターナビ */}
        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 md:px-8">
          <button
            onClick={() => go(slide - 1)}
            disabled={slide === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} /> 前へ
          </button>

          {/* ドット */}
          <div className="flex items-center gap-1.5">
            {deck.slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`スライド ${i + 1}`}
                className="h-2 rounded-full transition-all"
                style={{
                  width: i === slide ? 22 : 8,
                  background: i === slide ? deck.accent : "#CBD5E1",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => go(slide + 1)}
            disabled={slide === total - 1}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: deck.accent }}
          >
            次へ <ChevronRight size={16} />
          </button>
        </footer>
      </main>
    </div>
  );
}

/* ───────────────────────── Sidebar ───────────────────────── */
function Sidebar({
  deck,
  slide,
  navOpen,
  onSelectDeck,
  onSelectSlide,
  onClose,
}: {
  deck: Deck;
  slide: number;
  navOpen: boolean;
  onSelectDeck: (id: string) => void;
  onSelectSlide: (i: number) => void;
  onClose: () => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
        navOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* ブランド */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white">
          <LayoutGrid size={16} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-extrabold">Signs AI</div>
          <div className="text-[11px] text-slate-400">提案資料デッキ</div>
        </div>
        <button
          className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          onClick={onClose}
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>

      {/* デッキ一覧 + スライド目次 */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {decksByCategory.map((group) => (
          <div key={group.category} className="mb-5">
            <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {group.category}
            </div>
            {group.decks.map((d) => {
              const active = d.id === deck.id;
              return (
                <div key={d.id}>
                  <button
                    onClick={() => onSelectDeck(d.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      active ? "bg-slate-100 font-bold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">{d.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{d.persona}</span>
                    <span className="text-[10px] text-slate-400">{d.slides.length}</span>
                  </button>

                  {/* アクティブデッキのスライド目次 */}
                  {active && (
                    <ul className="mb-2 ml-3 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
                      {d.slides.map((s, i) => (
                        <li key={i}>
                          <button
                            onClick={() => onSelectSlide(i)}
                            className={`block w-full truncate rounded px-2 py-1 text-left text-xs transition ${
                              i === slide
                                ? "font-semibold"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                            style={i === slide ? { color: d.accent } : undefined}
                          >
                            {s.kicker.split("／")[0].trim()}　{s.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-5 py-3 text-[11px] leading-relaxed text-slate-400">
        株式会社Taion ／ Signs AI
        <br />
        <span className="text-slate-300">← → キーでスライド送り</span>
      </div>
    </aside>
  );
}

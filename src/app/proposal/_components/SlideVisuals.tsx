"use client";

import React from "react";
import { ChevronDown, RefreshCw, AlertTriangle } from "lucide-react";
import type { Visual } from "../_data/proposals";

/**
 * SlideVisual — 左パネル（アクセント色グラデーション上）に描画するビジュアル。
 * すべて白系の配色で統一し、静的CSS/SVGのみで構成（印刷/PDFでも崩れない）。
 */
export function SlideVisual({ visual, accent }: { visual: Visual; accent: string }) {
  switch (visual.kind) {

    /* ── 4象限マトリックス ── */
    case "quadrant":
      return (
        <div className="w-full">
          <div className="flex gap-2">
            {/* Y軸ラベル（縦書き・下→上） */}
            <div className="flex items-center">
              <span
                className="text-[9px] font-bold tracking-[0.15em] text-white/60"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {visual.yLabel}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-2 gap-1.5">
                {visual.cells.map((c, i) => (
                  <div
                    key={i}
                    className={`relative rounded-xl px-3 py-3.5 ${
                      c.emph
                        ? "bg-white/25 shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.75)]"
                        : "bg-white/10"
                    }`}
                  >
                    <p className="mb-1 text-[8px] font-semibold tracking-wide text-white/55">
                      {c.sub}
                    </p>
                    <p className="text-[12px] font-extrabold leading-tight text-white">
                      {c.title}
                    </p>
                    {c.emph && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[7.5px] font-black" style={{ color: accent }}>
                        <AlertTriangle size={8} strokeWidth={3} />
                        見落とし注意
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[9px] font-bold tracking-[0.15em] text-white/60">
                {visual.xLabel}
              </p>
            </div>
          </div>
        </div>
      );

    /* ── ヒーロー数字 ── */
    case "bigstat": {
      const size = visual.value.length > 4 ? 56 : visual.value.length > 2 ? 76 : 96;
      return (
        <div className="w-full text-center">
          <p
            className="font-black leading-none tracking-tight text-white"
            style={{ fontSize: size, textShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
          >
            {visual.value}
          </p>
          <p className="mt-4 text-[13px] font-extrabold text-white/95">{visual.label}</p>
          {visual.sub && (
            <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/60">
              {visual.sub}
            </p>
          )}
        </div>
      );
    }

    /* ── 統計グリッド（2×2） ── */
    case "statgrid":
      return (
        <div className="grid w-full grid-cols-2 gap-1.5">
          {visual.items.map((m, i) => (
            <div key={i} className="rounded-xl bg-white/12 px-3 py-3.5 text-center">
              <p className="text-[22px] font-extrabold leading-none tracking-tight text-white">
                {m.value}
              </p>
              <p className="mt-1.5 text-[8.5px] font-semibold leading-tight text-white/65">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      );

    /* ── 横棒グラフ ── */
    case "bars": {
      const max = visual.max ?? 100;
      return (
        <div className="w-full space-y-2.5">
          {visual.items.map((b, i) => (
            <div key={i}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className={`text-[10px] font-bold ${b.highlight ? "text-white" : "text-white/70"}`}>
                  {b.label}
                </span>
                <span className={`font-mono text-[11px] font-extrabold tabular-nums ${b.highlight ? "text-white" : "text-white/70"}`}>
                  {b.value}
                  {visual.suffix ?? "%"}
                </span>
              </div>
              <div className="h-[7px] w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (b.value / max) * 100)}%`,
                    background: b.highlight ? "#fff" : "rgba(255,255,255,0.55)",
                  }}
                />
              </div>
            </div>
          ))}
          {visual.note && (
            <p className="pt-1 text-[8.5px] font-medium leading-relaxed text-white/50">
              {visual.note}
            </p>
          )}
        </div>
      );
    }

    /* ── データフロー（入力 → AI → 出力） ── */
    case "flow":
      return (
        <div className="flex w-full flex-col items-center gap-1.5">
          <div className="grid w-full grid-cols-3 gap-1.5">
            {visual.inputs.map((inp, i) => (
              <div key={i} className="rounded-lg bg-white/12 px-1.5 py-2.5 text-center">
                <p className="text-[10px] font-black tracking-wide text-white">{inp.tag}</p>
                <p className="mt-0.5 text-[8px] font-medium leading-tight text-white/60">
                  {inp.label}
                </p>
              </div>
            ))}
          </div>
          <ChevronDown size={15} className="text-white/50" strokeWidth={3} />
          <div className="w-full rounded-xl bg-white/20 px-4 py-3 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]">
            <p className="text-[13px] font-extrabold text-white">{visual.core}</p>
          </div>
          <ChevronDown size={15} className="text-white/50" strokeWidth={3} />
          <div className="rounded-full bg-white px-5 py-2 shadow-lg">
            <p className="text-[11px] font-extrabold" style={{ color: accent }}>
              {visual.output}
            </p>
          </div>
        </div>
      );

    /* ── 月次サイクル（縦タイムライン） ── */
    case "cycle":
      return (
        <div className="w-full">
          {visual.items.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-black text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]">
                  {i + 1}
                </div>
                {i < visual.items.length - 1 && (
                  <div className="my-1 w-px flex-1 bg-white/25" style={{ minHeight: 16 }} />
                )}
              </div>
              <div className={i < visual.items.length - 1 ? "pb-4" : ""}>
                <p className="text-[8.5px] font-bold uppercase tracking-[0.15em] text-white/55">
                  {s.tag}
                </p>
                <p className="text-[13px] font-extrabold leading-snug text-white">{s.label}</p>
                {s.desc && (
                  <p className="mt-0.5 text-[9px] font-medium text-white/60">{s.desc}</p>
                )}
              </div>
            </div>
          ))}
          {visual.note && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <RefreshCw size={10} className="text-white/80" strokeWidth={3} />
              <span className="text-[9px] font-bold text-white/80">{visual.note}</span>
            </div>
          )}
        </div>
      );

    /* ── ブランドステートメント ── */
    case "brand":
      return (
        <div className="w-full px-1 text-center">
          <div className="mx-auto mb-5 h-[3px] w-10 rounded-full bg-white/60" />
          <p
            className="font-black leading-snug tracking-tight text-white"
            style={{ fontSize: "clamp(19px, 2.2vw, 27px)", textShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
          >
            {visual.title}
          </p>
          {visual.sub && (
            <p className="mt-4 text-[10.5px] font-semibold tracking-wide text-white/65">
              {visual.sub}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

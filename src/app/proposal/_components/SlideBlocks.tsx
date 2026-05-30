"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import type { Block } from "../_data/proposals";

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

export function SlideBlocks({ blocks, accent }: { blocks: Block[]; accent: string }) {
  return (
    <motion.div
      className="space-y-3"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.14 } },
      }}
    >
      {blocks.map((block, i) => (
        <motion.div key={i} variants={item}>
          <BlockView block={block} accent={accent} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function BlockView({ block, accent }: { block: Block; accent: string }) {
  switch (block.type) {

    /* ── リード文 ── */
    case "lead":
      return (
        <p
          className="border-l-[4px] pl-4 text-[15px] font-bold leading-snug text-slate-800"
          style={{ borderColor: accent }}
        >
          {block.text}
        </p>
      );

    /* ── 段落 ── */
    case "paragraph":
      return (
        <p className="text-sm leading-relaxed text-slate-500">{block.text}</p>
      );

    /* ── 箇条書き ── */
    case "bullets":
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
              <span
                className="mt-[6px] h-[6px] w-[6px] flex-shrink-0 rounded-full"
                style={{ background: accent }}
              />
              <span>
                {item.label && (
                  <span className="font-semibold text-slate-900">{item.label}：</span>
                )}
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      );

    /* ── テーブル ── */
    case "table":
      return (
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50">
                {block.headers.map((h, i) => {
                  const isLast = i === block.headers.length - 1;
                  return (
                    <th
                      key={i}
                      className="px-3 py-2 font-bold text-slate-700"
                      style={
                        block.highlightLastCol && isLast
                          ? { background: accent, color: "#fff" }
                          : undefined
                      }
                    >
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-t border-slate-100">
                  {row.map((cell, ci) => {
                    const isLast = ci === row.length - 1;
                    return (
                      <td
                        key={ci}
                        className={`px-3 py-2 ${
                          ci === 0 ? "font-semibold text-slate-800" : "text-slate-600"
                        }`}
                        style={
                          block.highlightLastCol && isLast
                            ? { background: `${accent}18`, fontWeight: 700, color: "#0f172a" }
                            : undefined
                        }
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    /* ── メトリクスカード ── */
    case "metrics":
      return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {block.items.map((m, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/60 px-3 py-3.5 text-center shadow-sm"
            >
              <p
                className="text-[30px] font-extrabold leading-none tracking-tight"
                style={{ color: accent }}
              >
                {m.value}
              </p>
              <p className="mt-1.5 text-[10px] leading-tight text-slate-500">{m.label}</p>
            </div>
          ))}
        </div>
      );

    /* ── ステップ ── */
    case "steps":
      return (
        <div className="space-y-2">
          {block.items.map((s, i) => (
            <div
              key={i}
              className="flex gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
            >
              <div
                className="flex-shrink-0 self-start rounded-md px-2 py-0.5 text-[10px] font-bold text-white leading-5"
                style={{ background: accent }}
              >
                {s.tag}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{s.title}</p>
                <p className="text-[11px] leading-relaxed text-slate-500">{s.desc}</p>
                {s.kpi && (
                  <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                    {s.kpi}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      );

    /* ── 引用 ── */
    case "quote":
      return (
        <blockquote className="rounded-xl bg-slate-900 px-5 py-4">
          <p className="text-sm font-medium italic leading-relaxed text-white">
            &ldquo;{block.text}&rdquo;
          </p>
          {block.author && (
            <footer className="mt-2 text-xs font-semibold" style={{ color: accent }}>
              — {block.author}
            </footer>
          )}
        </blockquote>
      );

    /* ── コールアウト ── */
    case "callout":
      return (
        <div
          className="rounded-lg border-l-[3px] px-4 py-3"
          style={{
            borderColor: block.tone === "warn" ? "#F59E0B" : accent,
            background: block.tone === "warn" ? "#FFFBEB" : `${accent}0d`,
          }}
        >
          {block.title && (
            <p className="mb-1 text-xs font-bold text-slate-900">{block.title}</p>
          )}
          <p className="text-sm leading-relaxed text-slate-700">{block.text}</p>
        </div>
      );

    /* ── コードブロック ── */
    case "code":
      return (
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
          <code className="whitespace-pre font-mono">{block.text}</code>
        </pre>
      );

    default:
      return null;
  }
}

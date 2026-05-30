"use client";

import React from "react";
import type { Block } from "../_data/proposals";

/** 1スライド分のブロック配列をレンダリング */
export function SlideBlocks({ blocks, accent }: { blocks: Block[]; accent: string }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} accent={accent} />
      ))}
    </div>
  );
}

function BlockView({ block, accent }: { block: Block; accent: string }) {
  switch (block.type) {
    case "lead":
      return (
        <p
          className="text-xl md:text-2xl font-bold leading-relaxed text-slate-800 border-l-4 pl-5"
          style={{ borderColor: accent }}
        >
          {block.text}
        </p>
      );

    case "paragraph":
      return <p className="text-[15px] md:text-base leading-relaxed text-slate-600">{block.text}</p>;

    case "bullets":
      return (
        <ul className="space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-700">
              <span
                className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
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

    case "table":
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-[13px] md:text-sm">
            <thead>
              <tr className="bg-slate-50">
                {block.headers.map((h, i) => {
                  const isLast = i === block.headers.length - 1;
                  return (
                    <th
                      key={i}
                      className="px-4 py-3 font-bold text-slate-700"
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
                    const isHead = ci === 0;
                    return (
                      <td
                        key={ci}
                        className={`px-4 py-3 ${isHead ? "font-semibold text-slate-800" : "text-slate-600"}`}
                        style={
                          block.highlightLastCol && isLast
                            ? { background: `${accent}14`, fontWeight: 700, color: "#0f172a" }
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

    case "metrics":
      return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {block.items.map((m, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
            >
              <div className="text-2xl md:text-3xl font-extrabold" style={{ color: accent }}>
                {m.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">{m.label}</div>
            </div>
          ))}
        </div>
      );

    case "steps":
      return (
        <div className="space-y-3">
          {block.items.map((s, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div
                className="flex h-fit flex-shrink-0 items-center rounded-lg px-3 py-1 text-xs font-bold text-white"
                style={{ background: accent }}
              >
                {s.tag}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900">{s.title}</div>
                <div className="mt-0.5 text-sm leading-relaxed text-slate-600">{s.desc}</div>
                {s.kpi && (
                  <div className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    成功指標：{s.kpi}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );

    case "quote":
      return (
        <blockquote className="rounded-xl bg-slate-900 p-5 md:p-6">
          <p className="text-base md:text-lg font-medium italic leading-relaxed text-white">
            “{block.text}”
          </p>
          {block.author && (
            <footer className="mt-2 text-sm" style={{ color: accent }}>
              — {block.author}
            </footer>
          )}
        </blockquote>
      );

    case "callout":
      return (
        <div
          className="rounded-xl border-l-4 p-4 md:p-5"
          style={{
            borderColor: block.tone === "warn" ? "#F59E0B" : accent,
            background: block.tone === "warn" ? "#FFFBEB" : `${accent}10`,
          }}
        >
          {block.title && (
            <div className="mb-1 text-sm font-bold text-slate-900">{block.title}</div>
          )}
          <p className="text-[15px] leading-relaxed text-slate-700">{block.text}</p>
        </div>
      );

    case "code":
      return (
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 md:p-5 text-[12px] md:text-[13px] leading-relaxed text-slate-100">
          <code className="font-mono whitespace-pre">{block.text}</code>
        </pre>
      );

    default:
      return null;
  }
}

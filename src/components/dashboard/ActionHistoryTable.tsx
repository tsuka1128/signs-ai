"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils/index";
import { RefreshCcw } from "lucide-react";

interface ActionHistoryTableProps {
  companyId: string;
  depts?: { id: string; name: string }[];
  /** 不採用アクションを「今月の提案」に復活させるコールバック */
  onRevive?: (item: ActionHistoryItem) => Promise<void>;
}

interface ActionHistoryItem {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  priority: string;
  status: string;
  created_at: string;
  archived_at: string | null;
  updated_at: string;
}

const priorityLabel: Record<string, string> = {
  urgent: "最優先",
  high: "重要",
  normal: "推奨",
};

const priorityBadgeClass: Record<string, string> = {
  urgent: "bg-rose-100 text-rose-700 border border-rose-200",
  high: "bg-amber-100 text-amber-700 border border-amber-200",
  normal: "bg-teal-100 text-teal-700 border border-teal-200",
};

const statusLabel: Record<string, string> = {
  accepted: "実行中",
  completed: "完了",
  rejected: "不採用",
  kept: "キープ",
  pending: "未判断",
};

const statusBadgeClass: Record<string, string> = {
  accepted: "bg-teal-100 text-teal-700 border border-teal-200",
  completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border border-rose-200",
  kept: "bg-amber-100 text-amber-700 border border-amber-200",
  pending: "bg-slate-100 text-slate-500 border border-slate-200",
};

function formatYearMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function formatMonthDay(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ActionHistoryTable({ companyId, depts = [], onRevive }: ActionHistoryTableProps) {
  const [items, setItems] = useState<ActionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revivingId, setRevivingId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    const supabase = createClient();

    async function fetchHistory() {
      setLoading(true);
      const { data, error } = await supabase
        .from("action_items")
        .select("id, title, description, department_id, priority, status, created_at, archived_at, updated_at")
        .eq("company_id", companyId)
        .or("is_archived.eq.true,status.in.(accepted,completed,rejected,kept)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) {
        setItems(data as ActionHistoryItem[]);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [companyId]);

  // キープ項目はタイトルが同じなら最新の1件だけ残す（毎月同じものが並ぶのを防ぐ）
  const deduplicatedItems = useMemo(() => {
    const keptLatest = new Map<string, ActionHistoryItem>();
    const others: ActionHistoryItem[] = [];
    for (const item of items) {
      if (item.status === "kept") {
        const existing = keptLatest.get(item.title);
        if (!existing || new Date(item.created_at) > new Date(existing.created_at)) {
          keptLatest.set(item.title, item);
        }
      } else {
        others.push(item);
      }
    }
    return [...others, ...keptLatest.values()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [items]);

  // 月別グループ化
  const grouped = useMemo(() => {
    const map = new Map<string, ActionHistoryItem[]>();
    for (const item of deduplicatedItems) {
      const key = formatYearMonth(item.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [deduplicatedItems]);

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-2">月</th>
              <th className="px-4 py-2">アクション</th>
              <th className="px-4 py-2">部署</th>
              <th className="px-4 py-2">優先度</th>
              <th className="px-4 py-2">判断</th>
              <th className="px-4 py-2">判断日</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-center py-10 text-slate-400 text-sm italic">
        まだ判断済みのアクションはありません
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] text-slate-400 uppercase tracking-wider">
            <th className="px-4 py-2 font-bold whitespace-nowrap">月</th>
            <th className="px-4 py-2 font-bold">アクション</th>
            <th className="px-4 py-2 font-bold whitespace-nowrap">部署</th>
            <th className="px-4 py-2 font-bold whitespace-nowrap">優先度</th>
            <th className="px-4 py-2 font-bold whitespace-nowrap">判断</th>
            <th className="px-4 py-2 font-bold whitespace-nowrap">判断日</th>
            <th className="px-4 py-2 font-bold whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from(grouped.entries()).map(([month, monthItems]) => (
            <React.Fragment key={month}>
              <tr>
                <td colSpan={7} className="px-4 pt-5 pb-1">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {month} ({monthItems.length}件)
                  </span>
                </td>
              </tr>
              {monthItems.map((item) => {
                const deptName = item.department_id
                  ? (depts.find((d) => d.id === item.department_id)?.name || "不明")
                  : "全社";
                const actionText = `${item.title}${item.description ? ` ${item.description}` : ""}`;
                const truncated = actionText.length > 50 ? actionText.slice(0, 50) + "…" : actionText;
                const decisionDate = item.archived_at ?? item.updated_at;

                const isRejected = item.status === "rejected";
                const isReviving = revivingId === item.id;

                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {formatYearMonth(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium max-w-xs">
                      <span title={`${item.title}${item.description ? ` — ${item.description}` : ""}`}>
                        {truncated}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{deptName}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-[11px] font-bold",
                        priorityBadgeClass[item.priority] || priorityBadgeClass.normal
                      )}>
                        {priorityLabel[item.priority] || item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-[11px] font-bold",
                        statusBadgeClass[item.status] || statusBadgeClass.pending
                      )}>
                        {statusLabel[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {formatMonthDay(decisionDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isRejected && onRevive && (
                        <button
                          disabled={isReviving}
                          onClick={async () => {
                            setRevivingId(item.id);
                            await onRevive(item);
                            // 楽観的削除：履歴から消す（今月の提案に戻るため）
                            setItems(prev => prev.filter(i => i.id !== item.id));
                            setRevivingId(null);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all",
                            "text-slate-400 border-slate-200 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50",
                            "disabled:opacity-40 disabled:cursor-not-allowed"
                          )}
                          title="不採用を取り消して今月の提案に戻す"
                        >
                          <RefreshCcw size={11} className={isReviving ? "animate-spin" : ""} />
                          復活
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { 
    Search, 
    BookOpen, 
    MessageSquare, 
    BarChart3, 
    Users, 
    Target, 
    CheckSquare,
    FileText,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const DOCS_PAGES = [
    { title: "Signs AIとは？", href: "/docs/introduction", icon: BookOpen, category: "はじめに" },
    { title: "KPIの設定と入力", href: "/docs/kpi-setup", icon: BarChart3, category: "設定と連携" },
    { title: "組織方針の登録", href: "/docs/policy-guide", icon: Target, category: "設定と連携" },
    { title: "Slackアプリを準備する", href: "/docs/slack-integration", icon: MessageSquare, category: "設定と連携" },
    { title: "メンバーの招待・管理", href: "/docs/member-management", icon: Users, category: "設定と連携" },
    { title: "組織改善のPDCAサイクル", href: "/docs/pdca-guide", icon: Target, category: "機能の使い方" },
    { title: "アクション管理の使い方", href: "/docs/action-guide", icon: CheckSquare, category: "機能の使い方" },
    { title: "マトリックスの見方", href: "/docs/bubble-chart-guide", icon: BarChart3, category: "機能の使い方" },
    { title: "マトリックスが示す成長の軌跡", href: "/docs/growth-steps", icon: BookOpen, category: "機能の使い方" },
];

export function DocsSearch() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const onSelect = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:border-slate-200 transition-all group"
            >
                <Search className="w-3.5 h-3.5 group-hover:text-teal transition-colors" />
                <span className="text-xs font-medium">Search documentation...</span>
                <span className="text-[10px] bg-white border border-slate-200 px-1 rounded ml-2 font-mono">⌘K</span>
            </button>

            <Command.Dialog
                open={open}
                onOpenChange={setOpen}
                label="Documentation Search"
                className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            >
                <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex items-center border-b border-slate-100 px-4">
                        <Search className="w-4 h-4 text-slate-400" />
                        <Command.Input
                            autoFocus
                            placeholder="何をお探しですか？"
                            className="flex-1 h-14 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 px-3 font-medium"
                        />
                        <button 
                            onClick={() => setOpen(false)}
                            className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            ESC
                        </button>
                    </div>

                    <Command.List className="max-h-[350px] overflow-y-auto p-2 scroll-py-2 pb-4">
                        <Command.Empty className="py-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">見つかりませんでした</p>
                            <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest font-black">No results found</p>
                        </Command.Empty>

                        {["はじめに", "設定と連携", "機能の使い方"].map((category) => (
                            <Command.Group 
                                key={category}
                                heading={
                                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 rounded-lg mb-1">
                                        {category}
                                    </div>
                                }
                                className="mb-2"
                            >
                                {DOCS_PAGES.filter(p => p.category === category).map((page) => (
                                    <Command.Item
                                        key={page.href}
                                        onSelect={() => onSelect(page.href)}
                                        className="flex items-center justify-between px-3 py-3 rounded-2xl cursor-pointer aria-selected:bg-teal aria-selected:text-white group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-aria-selected:bg-white/20 transition-colors">
                                                <page.icon className="w-4 h-4 text-slate-400 group-aria-selected:text-white" />
                                            </div>
                                            <span className="text-sm font-bold tracking-tight">{page.title}</span>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-aria-selected:opacity-100 transition-opacity -translate-x-2 group-aria-selected:translate-x-0" />
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        ))}
                    </Command.List>

                    <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="p-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-400 font-bold shadow-sm">Enter</span>
                                <span className="text-[10px] text-slate-400 font-bold">選択</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="p-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-400 font-bold shadow-sm">↑↓</span>
                                <span className="text-[10px] text-slate-400 font-bold">移動</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-teal shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Docs Navigator</span>
                        </div>
                    </div>
                </div>
            </Command.Dialog>
        </>
    );
}

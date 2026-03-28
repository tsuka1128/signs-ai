"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import Fuse from "fuse.js";
import { 
    Search, 
    BookOpen, 
    MessageSquare, 
    BarChart3, 
    Users, 
    Target, 
    CheckSquare,
    FileText,
    ArrowRight,
    Type
} from "lucide-react";
import searchIndex from "@/lib/docs-search-index.json";

const ICON_MAP: Record<string, any> = {
    BookOpen,
    MessageSquare,
    BarChart3,
    Users,
    Target,
    CheckSquare
};

interface SearchResult {
    title: string;
    href: string;
    icon: string;
    category: string;
    content: string;
}

export function DocsSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const router = useRouter();

    // Fuse.js の初期化
    const fuse = useMemo(() => {
        return new Fuse(searchIndex as SearchResult[], {
            keys: [
                { name: 'title', weight: 0.7 },
                { name: 'content', weight: 0.3 }
            ],
            threshold: 0.4,
            includeMatches: true,
            minMatchCharLength: 1,
            ignoreLocation: true, // 文字列内の場所による減点を無効化（長文対応）
            useExtendedSearch: true // より高度な検索を有効化
        });
    }, []);

    // 検索結果の計算
    const results = useMemo(() => {
        if (!query) return [];
        const fuseResults = fuse.search(query);
        
        if (fuseResults.length > 0) {
            return fuseResults.slice(0, 8);
        }

        // フォールバック: Fuseで見つからない場合の単純な部分一致検索 (日本語対応)
        const lowQuery = query.toLowerCase();
        const fallback = (searchIndex as SearchResult[])
            .filter(item => 
                item.title.toLowerCase().includes(lowQuery) || 
                item.content.toLowerCase().includes(lowQuery)
            )
            .map(item => ({ item })); // result.item の形式に合わせる
            
        return fallback.slice(0, 8);
    }, [query, fuse]);

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
        setQuery("");
        router.push(href);
    };

    // スニペット（抜粋）の作成
    const getSnippet = (content: string, query: string) => {
        if (!query) return "";
        const index = content.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return content.slice(0, 70) + "...";
        
        const start = Math.max(0, index - 30);
        const end = Math.min(content.length, index + 40);
        let snippet = content.slice(start, end);
        if (start > 0) snippet = "..." + snippet;
        if (end < content.length) snippet = snippet + "...";
        return snippet;
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
                shouldFilter={false}
                label="Full-text Documentation Search"
                className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            >
                <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex items-center border-b border-slate-100 px-4">
                        <Search className="w-4 h-4 text-slate-400" />
                        <Command.Input
                            autoFocus
                            value={query}
                            onValueChange={setQuery}
                            placeholder="知りたいキーワードを入力（例：KPI、Slack...）"
                            className="flex-1 h-14 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 px-3 font-medium"
                        />
                        <button 
                            onClick={() => setOpen(false)}
                            className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            ESC
                        </button>
                    </div>

                    <Command.List className="max-h-[400px] overflow-y-auto p-2 scroll-py-2 pb-4">
                        <Command.Empty className="py-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">「{query}」に一致する情報は構成にありません</p>
                            <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest font-black">Full-text search: No results</p>
                        </Command.Empty>

                        {query ? (
                            <Command.Group heading={
                                <div className="px-3 py-2 text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] bg-teal/5 rounded-lg mb-1 flex items-center gap-2">
                                    <Type className="w-3 h-3" />
                                    Search Results
                                </div>
                            }>
                                {results.map((result) => {
                                    const item = result.item;
                                    const Icon = ICON_MAP[item.icon] || FileText;
                                    return (
                                        <Command.Item
                                            key={item.href}
                                            onSelect={() => onSelect(item.href)}
                                            className="flex flex-col items-start gap-1 px-3 py-4 rounded-2xl cursor-pointer aria-selected:bg-teal aria-selected:text-white group transition-all mb-1 border border-transparent aria-selected:border-teal/20"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-aria-selected:bg-white/20 transition-colors">
                                                        <Icon className="w-4 h-4 text-slate-400 group-aria-selected:text-white" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold tracking-tight">{item.title}</span>
                                                        <span className="text-[10px] text-slate-400 group-aria-selected:text-teal-100 uppercase font-black tracking-widest">{item.category}</span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-aria-selected:opacity-100 transition-opacity -translate-x-2 group-aria-selected:translate-x-0" />
                                            </div>
                                            {item.content && (
                                                <p className="pl-11 text-[11px] font-medium text-slate-500 group-aria-selected:text-white/80 line-clamp-2 leading-relaxed italic">
                                                    {getSnippet(item.content, query)}
                                                </p>
                                            )}
                                        </Command.Item>
                                    );
                                })}
                            </Command.Group>
                        ) : (
                            // 初期表示（おすすめや最近のページなど）
                            <>
                                <Command.Group heading={
                                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 rounded-lg mb-1">
                                        よく見られているページ
                                    </div>
                                }>
                                    {searchIndex.slice(0, 5).map((item) => {
                                        const Icon = ICON_MAP[item.icon] || FileText;
                                        return (
                                            <Command.Item
                                                key={item.href}
                                                onSelect={() => onSelect(item.href)}
                                                className="flex items-center justify-between px-3 py-3 rounded-2xl cursor-pointer aria-selected:bg-teal aria-selected:text-white group transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-aria-selected:bg-white/20 transition-colors">
                                                        <Icon className="w-4 h-4 text-slate-400 group-aria-selected:text-white" />
                                                    </div>
                                                    <span className="text-sm font-bold tracking-tight">{item.title}</span>
                                                </div>
                                                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-aria-selected:opacity-100 transition-opacity -translate-x-2 group-aria-selected:translate-x-0" />
                                            </Command.Item>
                                        );
                                    })}
                                </Command.Group>
                            </>
                        )}
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
                            <div className="w-2 h-2 rounded-full bg-teal animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Full-Text AI Search Ready</span>
                        </div>
                    </div>
                </div>
            </Command.Dialog>
        </>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { AppLayout } from "@/components/layout/AppLayout";
import { DOCS_MENU } from "@/lib/docs-menu";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullWidth = pathname === "/docs/flow";

    const flatItems = DOCS_MENU.flatMap(group => group.items);
    const currentIndex = flatItems.findIndex(item => item.href === pathname);
    const prev = currentIndex > 0 ? flatItems[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null;
    const showPagination = pathname !== "/docs";

    const paginationAndFooter = (
        <>
            {showPagination && (
                <div className="mt-4 pt-8 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                        {prev ? (
                            <Link
                                href={prev.href}
                                className="group p-4 rounded-3xl border border-slate-100 bg-white hover:border-teal/30 hover:shadow-lg transition-all"
                            >
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1 group-hover:text-teal transition-colors">
                                    <ArrowLeft className="w-3 h-3" />
                                    Previous
                                </div>
                                <div className="text-sm font-bold text-slate-800 break-words">{prev.title}</div>
                            </Link>
                        ) : <div />}

                        {next ? (
                            <Link
                                href={next.href}
                                className="group p-4 rounded-3xl border border-slate-100 bg-white hover:border-teal/30 hover:shadow-lg transition-all text-right"
                            >
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1 justify-end group-hover:text-teal transition-colors">
                                    Next
                                    <ChevronRight className="w-3 h-3" />
                                </div>
                                <div className="text-sm font-bold text-slate-800 break-words">{next.title}</div>
                            </Link>
                        ) : <div />}
                    </div>
                </div>
            )}

            <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
                <p className="text-xs font-medium">© 2026 Signs AI Inc. All rights reserved.</p>
                <div className="flex items-center gap-6">
                    <Link href="/privacy" className="text-xs hover:text-slate-600 transition-colors font-medium">Privacy Policy</Link>
                    <Link href="/terms" className="text-xs hover:text-slate-600 transition-colors font-medium">Terms of Service</Link>
                </div>
            </footer>
        </>
    );

    if (isFullWidth) {
        return (
            <AppLayout bare>
                {children}
                <div className="px-6 md:px-12 pb-12 mx-auto max-w-4xl w-full">
                    {paginationAndFooter}
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="mx-auto max-w-4xl">
                {children}
                {paginationAndFooter}
            </div>
        </AppLayout>
    );
}

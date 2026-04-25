"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
    children: React.ReactNode;
    currentSection?: string;
    onSectionChange?: (id: string) => void;
    hasLaborData?: boolean;
    hideSidebar?: boolean;
    fullWidth?: boolean;
}

export function AppLayout({ 
    children, 
    currentSection, 
    onSectionChange, 
    hasLaborData,
    hideSidebar = false,
    fullWidth = false
}: AppLayoutProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50/50 flex">
            {/* Desktop Sidebar / Mobile Drawer */}
            {!hideSidebar && (
                <Sidebar 
                    currentSection={currentSection}
                    onSectionChange={onSectionChange}
                    hasLaborData={hasLaborData}
                    isMobileOpen={isMobileOpen}
                    setIsMobileOpen={setIsMobileOpen}
                />
            )}

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300",
                !hideSidebar && "lg:pl-64"
            )}>
                {/* Simplified Header */}
                <Header 
                    isMobile={true} 
                    onMobileMenuClick={() => setIsMobileOpen(true)} 
                />

                <main className="flex-1 lg:pl-0">
                    <div className={cn(
                        "mx-auto px-5 py-8 animate-fadeIn",
                        fullWidth ? "max-w-full" : "max-w-5xl"
                    )}>
                        {children}
                    </div>
                </main>

                <footer className={cn(
                    "mx-auto w-full px-5 py-12 text-center space-y-4 opacity-50",
                    fullWidth ? "max-w-full" : "max-w-5xl"
                )}>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                    <div className="flex items-center justify-center gap-3">
                         <div className="w-7 h-7 bg-teal-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-teal font-black text-sm italic">S</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-300 tracking-tighter">Signs AI</h2>
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">組織に体温を — by Taion Inc.</p>
                </footer>
            </div>
        </div>
    );
}

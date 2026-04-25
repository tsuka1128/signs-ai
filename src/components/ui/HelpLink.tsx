"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils/index";

interface HelpLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export function HelpLink({ href, label, className }: HelpLinkProps) {
  return (
    <Link 
      href={href}
      target="_blank"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 hover:bg-teal/5 hover:text-teal border border-slate-100 hover:border-teal/20 transition-all font-bold text-[10px] uppercase tracking-wider group",
        className
      )}
    >
      <HelpCircle className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
      {label || "ヘルプを確認"}
    </Link>
  );
}

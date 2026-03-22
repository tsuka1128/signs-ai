import { 
    Users, 
    ArrowRight, 
    UserPlus, 
    Slack, 
    ShieldCheck, 
    Search,
    Building2,
    Mail,
    ChevronDown,
    Building
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MemberManagementPage() {
    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <section className="space-y-4">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-slate-900">Member Management</span>
                </nav>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-tight mb-2">
                    <Users className="w-3.5 h-3.5" />
                    Setup & Settings
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                    新規登録とメンバー管理
                </h1>
                <p className="text-base text-slate-600 font-medium leading-relaxed max-w-2xl mt-4">

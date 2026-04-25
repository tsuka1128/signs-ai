"use client";

import { useState, useEffect } from "react";
import { X, Users, Tag, Plus, Trash2, Save, GripVertical, AlertTriangle, Building2, BarChart3, MessageSquare, ShieldCheck, Zap, Download, HelpCircle, Layers, ShieldAlert, Info } from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { AVAILABLE_ADDONS } from "@/lib/addons";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { CSVImportModal } from "./CSVImportModal";

interface ModalProps {
    companyId: string;
    companyName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function AdminDepartmentsModal({ companyId, companyName, onClose, onSuccess }: ModalProps) {
    const { fetchDepartments, updateDepartments, generateResourceCsvTemplate, loading } = useAdminSettings(companyId);
    const [depts, setDepts] = useState<any[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [mounted, setMounted] = useState(false);
 
    useEffect(() => {
        setMounted(true);
        fetchDepartments().then(setDepts).catch(console.error);
    }, [fetchDepartments]);

    const handleAdd = () => {
        setDepts([...depts, { id: `new_${Date.now()}`, name: "", headcount: 0, is_new: true }]);
    };

    const handleSave = async () => {
        try {
            await updateDepartments(depts);
            onSuccess();
            onClose();
            alert("部署構成を更新しました");
        } catch (err: any) {
            alert(`エラーが発生しました: ${err.message}`);
        } finally {
            setShowConfirm(false);
        }
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                onClick={onClose} 
            />
            
            <motion.div 
                layoutId="modal"
                className="bg-white rounded-[32px] w-full max-w-5xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
                <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3 text-teal mb-1">
                            <Users className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quick Edit</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{companyName} の部署構成</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </header>

                <div className="p-8 overflow-y-auto flex-1 space-y-4">
                    <Reorder.Group axis="y" values={depts} onReorder={setDepts} className="space-y-3">
                        {depts.map((d, index) => (
                            <Reorder.Item 
                                key={d.id} value={d}
                                className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group shadow-sm"
                            >
                                <div className="cursor-grab active:cursor-grabbing text-slate-300">
                                    <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">部署名</label>
                                        <input 
                                            type="text" value={d.name} 
                                            onChange={e => setDepts(depts.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))}
                                            placeholder="部署名を入力..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">人数</label>
                                        <input 
                                            type="number" value={d.headcount} 
                                            onChange={e => setDepts(depts.map(x => x.id === d.id ? { ...x, headcount: parseInt(e.target.value) || 0 } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setDepts(depts.filter(x => x.id !== d.id))}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all pt-4"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    {depts.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm font-bold italic">部署が登録されていません</p>
                        </div>
                    )}

                    <button 
                        onClick={handleAdd}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> 部署を追加
                    </button>
                </div>

                <footer className="p-8 border-t border-slate-50 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            保存するとクライアント側の表示に即座に反映されます
                        </p>
                        <button 
                            onClick={async (e) => {
                                e.preventDefault();
                                try {
                                    const csv = await generateResourceCsvTemplate();
                                    if (!csv) return;
                                    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `resource_import_${companyName}_${new Date().toISOString().split('T')[0]}.csv`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                } catch (err) {
                                    console.error("Export error:", err);
                                }
                            }}
                            className="text-[10px] font-black text-teal hover:underline flex items-center gap-1 mt-1 uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-3 h-3" /> 記入用フォーマット(CSV)をダウンロード
                        </button>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={() => setShowImport(true)}
                            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all whitespace-nowrap"
                        >
                            CSVインポート
                        </button>
                        <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 whitespace-nowrap">キャンセル</button>
                        <button 
                            onClick={() => setShowConfirm(true)}
                            disabled={loading}
                            className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                        >
                            <Save className="w-4 h-4" /> 構成を保存
                        </button>
                    </div>
                </footer>

                {/* Confirmation Popup */}
                <AnimatePresence>
                    {showConfirm && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-8"
                        >
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 text-center shadow-2xl border border-slate-100">
                                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2">構成変更の確認</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                                    {companyName} の部署構成を更新します。デモ設定や分析結果に影響が出る場合がありますが、よろしいですか？
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setShowConfirm(false)} className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">
                                        戻る
                                    </button>
                                    <button onClick={handleSave} className="py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700">
                                        はい、保存します
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showImport && (
                        <CSVImportModal 
                            companyId={companyId} 
                            type="resource" 
                            onClose={() => setShowImport(false)} 
                            onSuccess={() => {
                                setShowImport(false);
                                onSuccess();
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    );
}

export function AdminKpisModal({ companyId, companyName, onClose, onSuccess }: ModalProps) {
    const { fetchKpis, updateKpis, generateKpiCsvTemplate, loading } = useAdminSettings(companyId);
    const [kpis, setKpis] = useState<any[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchKpis().then(setKpis).catch(console.error);
    }, [fetchKpis]);

    const handleAdd = () => {
        setKpis([...kpis, { id: `new_${Date.now()}`, name: "", unit: "pt", is_main: false, sort_order: kpis.length, is_new: true }]);
    };

    const handleSave = async () => {
        try {
            await updateKpis(kpis.map((k, i) => ({ ...k, sort_order: i })));
            onSuccess();
            onClose();
            alert("KPI定義を更新しました");
        } catch (err: any) {
            alert(`エラーが発生しました: ${err.message}`);
        } finally {
            setShowConfirm(false);
        }
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                onClick={onClose} 
            />
            
            <motion.div 
                layoutId="modal-kpi"
                className="bg-white rounded-[32px] w-full max-w-5xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
                <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3 text-teal mb-1">
                            <Tag className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quick Edit</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{companyName} のKPI定義</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </header>

                <div className="p-8 overflow-y-auto flex-1 space-y-4">
                    <Reorder.Group axis="y" values={kpis} onReorder={setKpis} className="space-y-3">
                        {kpis.map((k, index) => (
                            <Reorder.Item 
                                key={k.id} value={k}
                                className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group shadow-sm"
                            >
                                <div className="cursor-grab active:cursor-grabbing text-slate-300">
                                    <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 grid grid-cols-4 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">指標名</label>
                                        <input 
                                            type="text" value={k.name} 
                                            onChange={e => setKpis(kpis.map(x => x.id === k.id ? { ...x, name: e.target.value } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">単位</label>
                                        <input 
                                            type="text" value={k.unit} 
                                            onChange={e => setKpis(kpis.map(x => x.id === k.id ? { ...x, unit: e.target.value } : x))}
                                            placeholder="pt, %, 円..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-0.5 mb-1 ml-1 cursor-help" title="その部署の代表的な指標として、ダッシュボードのバブルチャート等に優先的に表示されます。">
                                            主要
                                            <HelpCircle className="w-2.5 h-2.5 opacity-60" />
                                        </label>
                                        <input 
                                            type="checkbox" checked={k.is_main} 
                                            onChange={e => setKpis(kpis.map(x => x.id === k.id ? { ...x, is_main: e.target.checked } : x))}
                                            className="w-4 h-4 rounded border-slate-200 text-teal focus:ring-teal"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setKpis(kpis.filter(x => x.id !== k.id))}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all pt-4"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    <button 
                        onClick={handleAdd}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> 新しい指標を追加
                    </button>
                </div>

                <footer className="p-8 border-t border-slate-50 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 leading-tight max-w-[240px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            KPIの名前や順番を変更すると、過去の入力内容の表示も即座に切り替わります
                        </p>
                        <button 
                            onClick={async (e) => {
                                e.preventDefault();
                                try {
                                    const csv = await generateKpiCsvTemplate();
                                    if (!csv) return;
                                    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `kpi_import_${companyName}_${new Date().toISOString().split('T')[0]}.csv`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                } catch (err) {
                                    console.error("Export error:", err);
                                }
                            }}
                            className="text-[10px] font-black text-teal hover:underline flex items-center gap-1 mt-1 uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-3 h-3" /> 記入用フォーマット(CSV)をダウンロード
                        </button>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={() => setShowImport(true)}
                            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all whitespace-nowrap"
                        >
                            CSVインポート
                        </button>
                        <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 whitespace-nowrap">キャンセル</button>
                        <button 
                            onClick={() => setShowConfirm(true)}
                            disabled={loading}
                            className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                        >
                            <Save className="w-4 h-4" /> 定義を保存
                        </button>
                    </div>
                </footer>

                <AnimatePresence>
                    {showConfirm && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-8"
                        >
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 text-center shadow-2xl border border-slate-100">
                                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2">構成変更の確認</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                                    {companyName} のKPI定義を更新します。デモ設定やチャート表示に影響が出る場合がありますが、よろしいですか？
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setShowConfirm(false)} className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">
                                        戻る
                                    </button>
                                    <button onClick={handleSave} className="py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700">
                                        はい、保存します
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showImport && (
                        <CSVImportModal 
                            companyId={companyId} 
                            type="kpi" 
                            onClose={() => setShowImport(false)} 
                            onSuccess={() => {
                                setShowImport(false);
                                onSuccess();
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    );
}


export function AdminAxesModal({ companyId, companyName, onClose, onSuccess }: ModalProps) {
    const { fetchCompany, fetchAxes, updateAxes, generateResourceCsvTemplate, loading } = useAdminSettings(companyId);
    const [axes, setAxes] = useState<any[]>([]);
    const [secondaryAxisName, setSecondaryAxisName] = useState("第2軸");
    const [showConfirm, setShowConfirm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchCompany().then(c => setSecondaryAxisName(c.secondary_axis_name || "第2軸"));
        fetchAxes().then(setAxes).catch(console.error);
    }, [fetchCompany, fetchAxes]);

    const handleAdd = () => {
        setAxes([...axes, { id: `new_${Date.now()}`, name: "", headcount: 0, is_new: true }]);
    };

    const handleSave = async () => {
        try {
            await updateAxes(axes);
            onSuccess();
            onClose();
            alert(`${secondaryAxisName}を更新しました`);
        } catch (err: any) {
            alert(`エラーが発生しました: ${err.message}`);
        } finally {
            setShowConfirm(false);
        }
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                onClick={onClose} 
            />
            
            <motion.div 
                layoutId="modal-axis"
                className="bg-white rounded-[32px] w-full max-w-5xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
                <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3 text-teal mb-1">
                            <Layers className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quick Edit</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{companyName} の{secondaryAxisName}設定</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </header>

                <div className="p-8 overflow-y-auto flex-1 space-y-4">
                    <Reorder.Group axis="y" values={axes} onReorder={setAxes} className="space-y-3">
                        {axes.map((a, index) => (
                            <Reorder.Item 
                                key={a.id} value={a}
                                className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group shadow-sm"
                            >
                                <div className="cursor-grab active:cursor-grabbing text-slate-300">
                                    <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">名称</label>
                                        <input 
                                            type="text" value={a.name} 
                                            onChange={e => setAxes(axes.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
                                            placeholder={`${secondaryAxisName}名を入力...`}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">人数</label>
                                        <input 
                                            type="number" value={a.headcount} 
                                            onChange={e => setAxes(axes.map(x => x.id === a.id ? { ...x, headcount: parseInt(e.target.value) || 0 } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setAxes(axes.filter(x => x.id !== a.id))}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all pt-4"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    {axes.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm font-bold italic">{secondaryAxisName}が登録されていません</p>
                        </div>
                    )}

                    <button 
                        onClick={handleAdd}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> {secondaryAxisName}を追加
                    </button>
                </div>

                <footer className="p-8 border-t border-slate-50 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            保存するとクライアント側の表示に即座に反映されます
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={() => setShowImport(true)}
                            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all whitespace-nowrap"
                        >
                            CSVインポート
                        </button>
                        <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 whitespace-nowrap">キャンセル</button>
                        <button 
                            onClick={() => setShowConfirm(true)}
                            disabled={loading}
                            className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                        >
                            <Save className="w-4 h-4" /> 構成を保存
                        </button>
                    </div>
                </footer>

                {/* Confirmation Popup */}
                <AnimatePresence>
                    {showConfirm && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-8"
                        >
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 text-center shadow-2xl border border-slate-100">
                                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2">構成変更の確認</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                                    {companyName} の{secondaryAxisName}設定を更新します。デモ設定や分析結果に影響が出る場合がありますが、よろしいですか？
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setShowConfirm(false)} className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">
                                        戻る
                                    </button>
                                    <button onClick={handleSave} className="py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700">
                                        はい、保存します
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showImport && (
                        <CSVImportModal 
                            companyId={companyId} 
                            type="resource" 
                            onClose={() => setShowImport(false)} 
                            onSuccess={() => {
                                setShowImport(false);
                                onSuccess();
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    );
}


export function AdminPlanOverridesModal({ companyId, companyName, onClose, onSuccess }: ModalProps) {
    const { fetchCompany, updatePlanOverrides, loading } = useAdminSettings(companyId);
    const [overrides, setOverrides] = useState<Record<string, any>>({});
    const [plan, setPlan] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchCompany().then(c => {
            setOverrides(c.plan_overrides || {});
            setPlan(c.plans);
        });
    }, [fetchCompany]);

    const handleSave = async () => {
        try {
            await updatePlanOverrides(overrides);
            onSuccess();
            onClose();
            alert("個別上書き設定を保存しました");
        } catch (err: any) {
            alert(`エラーが発生しました: ${err.message}`);
        }
    };

    const toggleOverride = (key: string, value: any) => {
        const newOverrides = { ...overrides };
        if (value === undefined || value === null || value === "") {
            delete newOverrides[key];
        } else {
            newOverrides[key] = value;
        }
        setOverrides(newOverrides);
    };

    const fields = [
        { key: 'max_departments', label: '最大部署・拠点数', type: 'number', placeholder: plan?.max_departments },
        { key: 'max_kpis', label: '最大KPI定義数', type: 'number', placeholder: plan?.max_kpis },
        { key: 'max_headcount', label: '最大メンバー登録数', type: 'number', placeholder: plan?.max_headcount },
        { key: 'manual_ai_runs_per_month', label: '月間AI分析実行枠', type: 'number', placeholder: plan?.manual_ai_runs_per_month },
    ];

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div layoutId="modal-overrides" className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col">
                <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3 text-amber-500 mb-1">
                            <ShieldAlert className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Custom Overrides</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{companyName} の個別制限上書き</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </header>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                        <Info className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700 font-bold leading-relaxed">
                            個別上書き設定が有効な場合、マスタープランの設定よりも優先されます。空欄にするとマスタープランの設定に戻ります。
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {fields.map(f => (
                            <div key={f.key}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">{f.label}</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={overrides[f.key] ?? ""} 
                                        onChange={e => toggleOverride(f.key, e.target.value === "" ? null : parseInt(e.target.value))}
                                        placeholder={`マスター: ${f.placeholder}`}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-400 focus:bg-white transition-all pr-12"
                                    />
                                    {overrides[f.key] !== undefined && overrides[f.key] !== null && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-100 text-amber-600 rounded text-[9px] font-black uppercase">Active</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
                            <div>
                                <h4 className="text-sm font-black text-slate-800">人件費ROIダッシュボード</h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">
                                    プランに関わらず、この機能へのアクセスを
                                    {overrides.enable_labor_analytics !== undefined ? (overrides.enable_labor_analytics ? "強制有効" : "強制無効") : "標準設定"}
                                     にします
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => toggleOverride('enable_labor_analytics', overrides.enable_labor_analytics !== undefined ? (overrides.enable_labor_analytics ? false : null) : true)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all relative",
                                        overrides.enable_labor_analytics === true ? "bg-emerald-500" : 
                                        overrides.enable_labor_analytics === false ? "bg-rose-500" : "bg-slate-300"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                        overrides.enable_labor_analytics === true ? "right-1" : 
                                        overrides.enable_labor_analytics === false ? "left-1" : "left-4"
                                    )} />
                                </button>
                                <button 
                                    onClick={() => toggleOverride('enable_labor_analytics', null)}
                                    className="text-[9px] font-black text-slate-400 hover:text-slate-600 px-2 underline"
                                >
                                    リセット
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="p-8 border-t border-slate-50 flex items-center justify-end gap-3 bg-slate-50/30">
                    <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-sm hover:text-slate-600">キャンセル</button>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> 設定を適用
                    </button>
                </footer>
            </motion.div>
        </div>,
        document.body
    );
}


export function AdminCompanySettingsModal({ companyId, companyName, onClose, onSuccess }: ModalProps) {
    const { fetchCompany, updateCompany, loading } = useAdminSettings(companyId);
    const [form, setForm] = useState({
        name: "",
        website_url: "",
        secondary_axis_name: "",
        survey_deadline_day: 25,
        status: "active",
        plan_id: "",
        addon_labor_analytics: false,
        addon_ai_weekly: false,
        addon_security_sso: false,
        trial_expires_at: "",
        manual_ai_runs_used_this_month: 0,
        manual_ai_runs_active_month: ""
    });
    const [plans, setPlans] = useState<any[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
        const load = async () => {
            try {
                const [companyData, plansData] = await Promise.all([
                    fetchCompany(),
                    supabase.from('plans').select('id, name').order('id')
                ]);
                
                if (companyData) {
                    setForm({
                        name: companyData.name || "",
                        website_url: companyData.website_url || "",
                        secondary_axis_name: companyData.secondary_axis_name || "担当領域",
                        survey_deadline_day: companyData.survey_deadline_day || 25,
                        status: companyData.status || "active",
                        plan_id: companyData.plan_id || "free",
                        addon_labor_analytics: companyData.addon_labor_analytics || false,
                        addon_ai_weekly: companyData.addon_ai_weekly || false,
                        addon_security_sso: companyData.addon_security_sso || false,
                        trial_expires_at: companyData.trial_expires_at ? new Date(companyData.trial_expires_at).toISOString().split('T')[0] : "",
                        manual_ai_runs_used_this_month: companyData.manual_ai_runs_used_this_month || 0,
                        manual_ai_runs_active_month: companyData.manual_ai_runs_active_month || ""
                    });
                }
                if (plansData.data) {
                    setPlans(plansData.data);
                }
            } catch (err) {
                console.error("Error loading settings data:", err);
            }
        };
        load();
    }, [fetchCompany, supabase]);

    const handleSave = async () => {
        try {
            await updateCompany(form);
            onSuccess();
            onClose();
            alert("企業設定を更新しました");
        } catch (err: any) {
            alert(`エラーが発生しました: ${err.message}`);
        } finally {
            setShowConfirm(false);
        }
    };

    if (!mounted) return null;

    const statusOptions = [
        { value: "trial", label: "トライアル", color: "bg-amber-50 text-amber-600 border-amber-200" },
        { value: "active", label: "アクティブ", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
        { value: "suspended", label: "停止中", color: "bg-rose-50 text-rose-600 border-rose-200" },
        { value: "cancelled", label: "解約済", color: "bg-slate-100 text-slate-500 border-slate-200" },
    ];

    return createPortal(
        <div 
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 9999999, position: 'fixed' }}
        >
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                onClick={onClose} 
            />
            
            <motion.div 
                layoutId="modal-company"
                className="bg-white rounded-[32px] w-full max-w-5xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
                <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3 text-teal mb-1">
                            <Building2 className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quick Edit</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            {companyName} の企業設定
                            <span className="ml-2 px-2 py-0.5 bg-rose-500 text-white text-[8px] rounded-full animate-pulse">v.Portal-Fix</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </header>

                <div className="p-8 overflow-y-auto flex-1 space-y-6">
                    {/* 企業名 */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">企業名</label>
                        <input 
                            type="text" value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                        />
                    </div>

                    {/* Webサイト */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Webサイト URL</label>
                        <input 
                            type="url" value={form.website_url}
                            onChange={e => setForm({ ...form, website_url: e.target.value })}
                            placeholder="https://example.com"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* 第2軸の名称 */}
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">第2軸（担当領域）の名称</label>
                            <input 
                                type="text" value={form.secondary_axis_name}
                                onChange={e => setForm({ ...form, secondary_axis_name: e.target.value })}
                                placeholder="担当領域"
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                            />
                        </div>

                        {/* サーベイ締切日 */}
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">サーベイ締切日（毎月）</label>
                            <div className="relative">
                                <input 
                                    type="number" min={1} max={31}
                                    value={form.survey_deadline_day}
                                    onChange={e => setForm({ ...form, survey_deadline_day: parseInt(e.target.value) || 25 })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">日</span>
                            </div>
                        </div>
                    </div>

                    {/* ステータス & プラン */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">ステータス</label>
                            <div className="flex flex-wrap gap-2">
                                {statusOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setForm({ ...form, status: opt.value })}
                                        className={cn(
                                            "px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all",
                                            form.status === opt.value 
                                                ? `${opt.color} shadow-sm` 
                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">契約プラン</label>
                            <select 
                                value={form.plan_id}
                                onChange={e => setForm({ ...form, plan_id: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                            >
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* クォータ・期限管理 (Trial & AI Usage) */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-6">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Zap className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Usage & trial management</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* トライアル終了日 */}
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">トライアル終了日</label>
                                <input 
                                    type="date" 
                                    value={form.trial_expires_at}
                                    onChange={e => setForm({ ...form, trial_expires_at: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                                />
                                <p className="text-[9px] text-slate-400 mt-1 ml-1 opacity-70">空欄で期限なし（通常契約）</p>
                            </div>

                            {/* AI実行数 */}
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">今月のAI実行済数</label>
                                <div className="relative">
                                    <input 
                                        type="number" min={0}
                                        value={form.manual_ai_runs_used_this_month}
                                        onChange={e => setForm({ ...form, manual_ai_runs_used_this_month: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                                    />
                                    <button 
                                        onClick={() => setForm({ ...form, manual_ai_runs_used_this_month: 0 })}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal hover:underline px-2 py-1"
                                    >
                                        RESET
                                    </button>
                                </div>
                            </div>

                            {/* AI実行月 */}
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">AI実行カウント月</label>
                                <input 
                                    type="text" 
                                    value={form.manual_ai_runs_active_month}
                                    onChange={e => setForm({ ...form, manual_ai_runs_active_month: e.target.value })}
                                    placeholder="YYYY-MM"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-teal transition-all"
                                />
                                <p className="text-[9px] text-slate-400 mt-1 ml-1 opacity-70">例: 2026-04</p>
                            </div>
                        </div>
                    </div>

                    {/* オプション設定（アドオン） */}
                    <div>
                        <div className="flex items-center justify-between mb-4 ml-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">付随オプション設定（アドオン）</label>
                            <span className="text-[10px] font-bold text-slate-300 italic">追加された機能は即座にダッシュボードに反映されます</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {AVAILABLE_ADDONS.map(addon => {
                                const isIncluded = addon.includedInPlans.includes(form.plan_id);
                                const isEnabled = isIncluded || (form as any)[addon.id];

                                return (
                                    <button
                                        key={addon.id}
                                        disabled={isIncluded}
                                        onClick={() => setForm({ ...form, [addon.id]: !(form as any)[addon.id] })}
                                        className={cn(
                                            "flex flex-col p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                                            isIncluded 
                                                ? "bg-slate-50 border-slate-100 opacity-80 cursor-default" 
                                                : isEnabled
                                                    ? "bg-white border-teal shadow-md ring-4 ring-teal/5"
                                                    : "bg-white border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                                                isEnabled ? "bg-teal/10 text-teal" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <addon.icon className="w-5 h-5" />
                                            </div>
                                            {isIncluded ? (
                                                <span className="text-[9px] font-black text-teal bg-teal/5 px-2 py-1 rounded-lg uppercase">Included</span>
                                            ) : (
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                    isEnabled ? "bg-teal border-teal" : "bg-white border-slate-200"
                                                )}>
                                                    {isEnabled && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1 relative z-10">
                                            <p className={cn("text-xs font-black", isEnabled ? "text-slate-800" : "text-slate-500")}>{addon.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed pr-2 line-clamp-2">
                                                {addon.description}
                                            </p>
                                        </div>
                                        {/* Hover Effect */}
                                        {!isIncluded && (
                                            <div className="absolute inset-0 bg-teal/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <footer className="p-8 border-t border-slate-50 flex items-center justify-between gap-4">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        保存するとクライアント側の表示に即座に反映されます
                    </p>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-sm hover:text-slate-600">キャンセル</button>
                        <button 
                            onClick={() => setShowConfirm(true)}
                            disabled={loading || !form.name.trim()}
                            className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> 設定を保存
                        </button>
                    </div>
                </footer>

                <AnimatePresence>
                    {showConfirm && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-8"
                        >
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 text-center shadow-2xl border border-slate-100">
                                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2">設定変更の確認</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                                    {companyName} の企業設定を更新します。クライアント側の表示に即座に反映されますが、よろしいですか？
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setShowConfirm(false)} className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">
                                        戻る
                                    </button>
                                    <button onClick={handleSave} className="py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700">
                                        はい、保存します
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    );
}

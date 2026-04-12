"use client";

import { useState, useCallback } from "react";
import { X, Upload, FileText, AlertTriangle, CheckCircle2, ChevronRight, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

interface CSVImportModalProps {
    companyId: string;
    type: 'kpi' | 'resource';
    onClose: () => void;
    onSuccess: () => void;
}

export function CSVImportModal({ companyId, type, onClose, onSuccess }: CSVImportModalProps) {
    const supabase = createClient();
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) parseFile(selected);
    };

    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
            if (rows.length < 2) {
                setError("有効なデータが含まれていません。");
                return;
            }

            const headerRow = rows[0].split(',').map(h => h.trim());
            const dataRows = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim());
                return headerRow.reduce((obj, h, i) => {
                    obj[h] = values[i];
                    return obj;
                }, {} as any);
            });

            setHeaders(headerRow);
            setData(dataRows);
            setFile(file);
            setStep('preview');
        };
        reader.readAsText(file, 'utf-8');
    };

    const runImport = async () => {
        setStep('importing');
        setProgress(0);
        setError(null);

        try {
            if (type === 'kpi') {
                await importKpiData();
            } else {
                await importResourceData();
            }
            setStep('complete');
            setTimeout(onSuccess, 1500);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "インポート中にエラーが発生しました。");
            setStep('preview');
        }
    };

    const importKpiData = async () => {
        // 1. Get current masters
        const { data: existingKpis } = await supabase.from('kpi_definitions').select('id, name').eq('company_id', companyId);

        const kpiMap = new Map(existingKpis?.map(k => [k.name, k.id]));

        // 2. CSVヘッダーからKPI名を抽出（「KPI名(部署名)」形式の場合、括弧部分を除去）
        const kpiNamesInCsv = headers.slice(1).map(h => h.replace(/\([^)]*\)$/, '').trim());

        // 新規KPIがあれば自動作成
        const newKpiNames = kpiNamesInCsv.filter(name => name && !kpiMap.has(name));
        if (newKpiNames.length > 0) {
            const { data: created, error: kErr } = await supabase.from('kpi_definitions').insert(
                newKpiNames.map(name => ({
                    company_id: companyId,
                    name,
                    unit: name.includes('％') || name.includes('%') ? '%' : (name.includes('円') ? '円' : 'pt'),
                }))
            ).select();
            if (kErr) throw kErr;
            created?.forEach(k => kpiMap.set(k.name, k.id));
        }

        // 3. Prepare bulk upsert
        const recordsToUpsert: any[] = [];
        data.forEach(row => {
            const month = row['対象月'];
            if (!month) return;

            // 正規化: YYYY-MM → YYYY-MM-01
            const normalizedMonth = /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : month;

            kpiNamesInCsv.forEach((kpiName, idx) => {
                const kpiId = kpiMap.get(kpiName);
                const originalHeader = headers[idx + 1]; // 元のヘッダー名でCSVから値を取得
                const val = row[originalHeader];
                if (kpiId && val !== "" && val !== undefined) {
                    recordsToUpsert.push({
                        company_id: companyId,
                        kpi_definition_id: kpiId,
                        recorded_month: normalizedMonth,
                        value: parseFloat(val) || 0
                    });
                }
            });
        });

        // 4. Chunked UPSERT
        const batchSize = 100;
        for (let i = 0; i < recordsToUpsert.length; i += batchSize) {
            const { error } = await supabase.from('kpi_records').upsert(recordsToUpsert.slice(i, i + batchSize), {
                onConflict: 'kpi_definition_id, recorded_month, department_id'
            });
            if (error) throw error;
            setProgress(Math.round(((i + batchSize) / recordsToUpsert.length) * 100));
        }
    };

    const importResourceData = async () => {
        // 1. Get current depts
        const { data: existingDepts } = await supabase.from('departments').select('id, name').eq('company_id', companyId);
        const deptMap = new Map(existingDepts?.map(d => [d.name, d.id]));

        // Identify new Depts
        const newDeptNames = Array.from(new Set(data.map(row => row['部署名']))).filter(name => name && !deptMap.has(name));
        
        if (newDeptNames.length > 0) {
            const { data: created, error: dErr } = await supabase.from('departments').insert(
                newDeptNames.map(name => ({
                    company_id: companyId,
                    name,
                    headcount: 0
                }))
            ).select();
            if (dErr) throw dErr;
            created?.forEach(d => deptMap.set(d.name, d.id));
        }

        // 2. Prepare records
        const recordsToUpsert: any[] = [];
        // Tracks latest headcount for each dept to update master
        const latestHeadcounts = new Map<string, number>();

        data.forEach(row => {
            const month = row['対象月'];
            const deptId = deptMap.get(row['部署名']);
            const headCount = parseInt(row['人数']) || 0;
            const laborCost = parseInt(row['人件費']) || 0;

            if (month && deptId) {
                recordsToUpsert.push({
                    company_id: companyId,
                    department_id: deptId,
                    recorded_month: month,
                    head_count: headCount,
                    labor_cost: laborCost
                });
                
                // Track latest month value
                if (!latestHeadcounts.has(deptId) || month > latestHeadcounts.get(deptId + "_month")!) {
                    latestHeadcounts.set(deptId, headCount);
                    latestHeadcounts.set(deptId + "_month", month as any);
                }
            }
        });

        // 3. Upsert
        const { error } = await supabase.from('resource_records').upsert(recordsToUpsert, {
            onConflict: 'department_id, recorded_month'
        });
        if (error) throw error;

        // 4. Update master headcount (Option A)
        for (const [deptId, headcount] of Array.from(latestHeadcounts.entries())) {
            if (typeof deptId === 'string' && !deptId.endsWith('_month')) {
                await supabase.from('departments').update({ headcount }).eq('id', deptId);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                onClick={onClose} 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[32px] w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh]"
            >
                <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3 text-teal mb-1">
                            <Upload className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bulk Import</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            {type === 'kpi' ? 'KPI実績のインポート' : '部署・人件費実績のインポート'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </header>

                <div className="p-8 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                            <p className="text-sm font-bold text-rose-600 leading-relaxed">{error}</p>
                        </div>
                    )}

                    {step === 'upload' && (
                        <div className="text-center">
                            <label className="block w-full border-4 border-dashed border-slate-100 hover:border-teal/30 hover:bg-teal/[0.02] rounded-[2.5rem] p-16 transition-all cursor-pointer group">
                                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <FileText className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2">CSVファイルを選択またはドラッグ</h3>
                                <p className="text-sm text-slate-400 font-medium">
                                    記入用フォーマットを編集したファイルをアップロードしてください
                                </p>
                            </label>
                            
                            <div className="mt-8 p-6 bg-slate-50 rounded-2xl text-left border border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> インポートのルール
                                </h4>
                                <ul className="space-y-3">
                                    {[
                                        "既存の数値がある場合は、アップロードした内容で上書きされます。",
                                        "存在しない部署名、KPI名は自動的に新規登録されます。",
                                        "対象月は YYYY-MM-DD 形式である必要があります。",
                                        "文字コードは UTF-8 で保存された CSV ファイルを使用してください。"
                                    ].map((txt, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[13px] text-slate-600 font-bold">
                                            <div className="w-1.5 h-1.5 bg-teal/40 rounded-full mt-1.5 shrink-0" />
                                            {txt}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <FileText className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-emerald-800 leading-none mb-1">{file?.name}</p>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{data.length} records found</p>
                                    </div>
                                </div>
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {headers.slice(0, 5).map(h => (
                                                <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                            {headers.length > 5 && <th className="px-4 py-3 text-[10px] font-black text-slate-400">...</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="border-b border-slate-50 last:border-0">
                                                {headers.slice(0, 5).map(h => (
                                                    <td key={h} className="px-4 py-3 font-bold text-slate-600 truncate max-w-[120px]">{row[h]}</td>
                                                ))}
                                                {headers.length > 5 && <td className="px-4 py-3 text-slate-400">...</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-black text-amber-800 mb-1">上書きの確認</h4>
                                    <p className="text-xs text-amber-700 font-bold leading-relaxed">
                                        対象月と項目が一致する既存データは、すべて今回のファイルの内容で更新されます。
                                        {type === 'resource' && <br />}
                                        {type === 'resource' && "また、部署のマスター人数設定も最新月の値に更新されます。"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="py-20 text-center space-y-8">
                            <div className="relative inline-block">
                                <Loader2 className="w-16 h-16 text-teal animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-teal">{progress}%</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-800">データを保存しています</h3>
                                <p className="text-sm text-slate-400 font-medium tracking-wide">
                                    ブラウザを閉じずにそのままお待ちください...
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="py-20 text-center space-y-6">
                            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">インポートが完了しました</h3>
                            <p className="text-base text-slate-500 font-medium">
                                最新のデータがダッシュボードに反映されました
                            </p>
                        </div>
                    )}
                </div>

                <footer className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <button 
                        onClick={onClose}
                        disabled={step === 'importing'}
                        className="px-8 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors disabled:opacity-30"
                    >
                        キャンセル
                    </button>
                    
                    <div className="flex gap-3">
                        {step === 'preview' && (
                            <>
                                <button 
                                    onClick={() => setStep('upload')}
                                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50"
                                >
                                    ファイルを選択し直す
                                </button>
                                <button 
                                    onClick={runImport}
                                    className="px-10 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2"
                                >
                                    インポートを実行 <ChevronRight className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        {step === 'complete' && (
                            <button 
                                onClick={onClose}
                                className="px-10 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-700"
                            >
                                閉じる
                            </button>
                        )}
                    </div>
                </footer>
            </motion.div>
        </div>
    );
}

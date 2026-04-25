"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Upload, FileText, AlertTriangle, CheckCircle2, ChevronRight, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/index";
import { createClient } from "@/lib/supabase";
import { createPortal } from "react-dom";

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
    const [isDragging, setIsDragging] = useState(false);
    const [mounted, setMounted] = useState(false);
 
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) parseFile(selected);
    };

    /** ドラッグ＆ドロップハンドラー */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && droppedFile.name.endsWith('.csv')) {
            parseFile(droppedFile);
        } else {
            setError('CSVファイルのみ対応しています。');
        }
    }, []);

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
        // 1. マスターデータの取得
        const [
            { data: companyData },
            { data: existingAxes },
            { data: existingKpis }
        ] = await Promise.all([
            supabase.from('companies').select('kpi_secondary_axis_name').eq('id', companyId).single(),
            supabase.from('kpi_axes').select('*').eq('company_id', companyId),
            supabase.from('kpi_definitions').select('id, name').eq('company_id', companyId)
        ]);

        const kpiMap = new Map(existingKpis?.map(k => [k.name, k.id]));
        const axisMap = new Map(existingAxes?.map(a => [a.name, a.id]));
        const secondaryAxisName = companyData?.kpi_secondary_axis_name || "第2軸";

        // 2. CSVヘッダーの解析
        // ['対象月', '区分', '項目', 'KPI_1', 'KPI_1_目標', ...]
        const actualHeaders: { idx: number; kpiName: string; originalHeader: string }[] = [];
        const targetHeaders: { idx: number; kpiName: string; originalHeader: string }[] = [];

        headers.slice(3).forEach((h, i) => {
            const cleaned = h.replace(/\([^)]*\)$/, '').trim();
            if (cleaned.endsWith('_目標')) {
                targetHeaders.push({ idx: i + 3, kpiName: cleaned.replace(/_目標$/, ''), originalHeader: h });
            } else {
                actualHeaders.push({ idx: i + 3, kpiName: cleaned, originalHeader: h });
            }
        });

        // 3. レコードの構築とバリデーション
        const recordMergeMap = new Map<string, any>();

        data.forEach((row, rowIndex) => {
            const month = row['対象月'];
            const category = row['区分'];
            const itemName = row['項目'];
            if (!month) return;

            // axis_id の特定
            let axisId: string | null = null;
            if (category === 'メイン' || itemName === '全社') {
                axisId = null;
            } else if (category === secondaryAxisName) {
                axisId = axisMap.get(itemName) || null;
                if (!axisId) {
                    throw new Error(`第${rowIndex + 2}行目: "${secondaryAxisName}"項目名「${itemName}」は設定されていません。システムの設定画面から追加してください。`);
                }
            } else {
                throw new Error(`第${rowIndex + 2}行目: 不明な区分「${category}」です。「メイン」または「${secondaryAxisName}」を指定してください。`);
            }

            const normalizedMonth = /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : month;

            // 実績値の突合
            actualHeaders.forEach(({ kpiName, originalHeader }) => {
                const kpiId = kpiMap.get(kpiName);
                if (!kpiId) return; 
                const val = row[originalHeader];
                const key = `${kpiId}__${normalizedMonth}__${axisId || 'main'}`;

                if (!recordMergeMap.has(key)) {
                    recordMergeMap.set(key, { kpi_definition_id: kpiId, recorded_month: normalizedMonth, axis_id: axisId, value: 0, target_value: null });
                }
                if (val !== "" && val !== undefined) {
                    recordMergeMap.get(key).value = parseFloat(val) || 0;
                }
            });

            // 目標値の突合
            targetHeaders.forEach(({ kpiName, originalHeader }) => {
                const kpiId = kpiMap.get(kpiName);
                if (!kpiId) return;
                const val = row[originalHeader];
                const key = `${kpiId}__${normalizedMonth}__${axisId || 'main'}`;

                if (!recordMergeMap.has(key)) {
                    recordMergeMap.set(key, { kpi_definition_id: kpiId, recorded_month: normalizedMonth, axis_id: axisId, value: 0, target_value: null });
                }
                if (val !== "" && val !== undefined) {
                    recordMergeMap.get(key).target_value = parseFloat(val) || 0;
                }
            });
        });

        const recordsToInsert = Array.from(recordMergeMap.values());

        // 4. 保存（削除して挿入）
        const monthsToUpdate = Array.from(new Set(recordsToInsert.map(r => r.recorded_month)));
        const kpiIdsToUpdate = Array.from(new Set(recordsToInsert.map(r => r.kpi_definition_id)));

        if (monthsToUpdate.length > 0 && kpiIdsToUpdate.length > 0) {
            const axisIdsToUpdate = Array.from(new Set(recordsToInsert.map(r => r.axis_id)));

            for (const m of monthsToUpdate) {
                const query = supabase.from('kpi_records').delete().eq('recorded_month', m).in('kpi_definition_id', kpiIdsToUpdate);
                
                const hasNullAxis = axisIdsToUpdate.includes(null);
                const nonNullAxisIds = axisIdsToUpdate.filter(id => id !== null);

                if (hasNullAxis && nonNullAxisIds.length > 0) {
                    const { error } = await query.or(`axis_id.is.null,axis_id.in.(${nonNullAxisIds.join(',')})`);
                    if (error) console.error("Delete error:", error);
                } else if (hasNullAxis) {
                    const { error } = await query.is('axis_id', null);
                    if (error) console.error("Delete error:", error);
                } else if (nonNullAxisIds.length > 0) {
                    const { error } = await query.in('axis_id', nonNullAxisIds);
                    if (error) console.error("Delete error:", error);
                }
            }
        }

        // 一括挿入
        const batchSize = 100;
        for (let i = 0; i < recordsToInsert.length; i += batchSize) {
            const { error } = await supabase.from('kpi_records').insert(recordsToInsert.slice(i, i + batchSize));
            if (error) throw error;
            setProgress(Math.round(((i + batchSize) / recordsToInsert.length) * 100));
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


    if (!mounted) return null;

    return createPortal(
        <div className="fixed top-0 right-0 bottom-0 left-64 flex items-center justify-center p-4 z-[100]">
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
                            <label
                                className={cn(
                                    "block w-full border-4 border-dashed rounded-[2.5rem] p-16 transition-all cursor-pointer group",
                                    isDragging
                                        ? "border-teal bg-teal/5 scale-[1.02]"
                                        : "border-slate-100 hover:border-teal/30 hover:bg-teal/[0.02]"
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                                <div className={cn(
                                    "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all",
                                    isDragging ? "bg-teal/10 scale-110" : "bg-slate-50 group-hover:scale-110"
                                )}>
                                    <Upload className={cn(
                                        "w-10 h-10 transition-colors",
                                        isDragging ? "text-teal" : "text-slate-300"
                                    )} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2">
                                    {isDragging ? 'ここにドロップしてください' : 'CSVファイルを選択またはドラッグ'}
                                </h3>
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
                                        "存在しないKPI名は自動的に新規登録されます。",
                                        "対象月は YYYY-MM または YYYY-MM-DD 形式で入力してください。",
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
        </div>,
        document.body
    );
}

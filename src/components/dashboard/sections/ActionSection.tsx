"use client";

import { ActionItem } from "@/components/dashboard/ActionItem";

interface ActionSectionProps {
    actions: any[];
}

export function ActionSection({ actions }: ActionSectionProps) {
    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-800 mb-6">📌 今月のアクション提案</h3>
            <div className="space-y-3">
                {actions.length > 0 ? (
                    actions.map((a, i) => (
                        <ActionItem
                            key={i}
                            priority={a.pri}
                            title={a.title}
                            description={a.desc}
                            dept={a.dept}
                            owner={a.owner}
                        />
                    ))
                ) : (
                    <p className="text-center py-10 text-slate-400 text-sm italic">
                        提案されたアクションはまだありません。
                    </p>
                )}
            </div>
        </div>
    );
}

"use client";

import { SemanticLayer } from "@/components/dashboard/SemanticLayer";

interface SemanticSectionProps {
    displaySem: string;
    realSemHistory: any[];
    realDepts: any[];
    actions: any[];
    onSave: (txt: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    companyId?: string;
    aiContent?: any;
}

export function SemanticSection({
    displaySem,
    realSemHistory,
    realDepts,
    actions,
    onSave,
    onDelete,
    companyId,
    aiContent,
}: SemanticSectionProps) {
    return (
        <div className="space-y-6 animate-fadeIn">
            <SemanticLayer
                initialText={displaySem}
                history={realSemHistory}
                departments={realDepts}
                actions={actions}
                onSave={onSave}
                onDelete={onDelete}
                aiContent={aiContent}
                companyId={companyId}
            />
        </div>
    );
}

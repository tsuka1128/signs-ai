"use client";

import { SemanticLayer } from "@/components/dashboard/SemanticLayer";

interface SemanticSectionProps {
    displaySem: string;
    realSemHistory: any[];
    realDepts: any[];
    onSave: (txt: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function SemanticSection({
    displaySem,
    realSemHistory,
    realDepts,
    onSave,
    onDelete,
}: SemanticSectionProps) {
    return (
        <div className="space-y-6 animate-fadeIn">
            <SemanticLayer
                initialText={displaySem}
                history={realSemHistory}
                departments={realDepts}
                onSave={onSave}
                onDelete={onDelete}
            />
        </div>
    );
}

"use client";

import { ReactNode } from "react";
import { Info } from "lucide-react";
import {
    passesAnonymityGuard,
    ANONYMITY_THRESHOLD,
    ANONYMITY_HIDDEN_LABEL,
    ANONYMITY_HIDDEN_REASON,
} from "@/lib/utils/anonymity";

interface AnonymityGateProps {
    /** 対象集計のサンプル数 */
    count: number;
    /** 閾値（デフォルト 3） */
    threshold?: number;
    /** ガード通過時に表示する要素 */
    children: ReactNode;
    /** ガード非通過時のフォールバック表示。未指定時はデフォルトのプレースホルダー */
    fallback?: ReactNode;
    /** フォールバックの理由表示を非表示にする場合 true */
    hideReason?: boolean;
}

export function AnonymityGate({
    count,
    threshold = ANONYMITY_THRESHOLD,
    children,
    fallback,
    hideReason = false,
}: AnonymityGateProps) {
    if (passesAnonymityGuard(count, threshold)) {
        return <>{children}</>;
    }

    if (fallback !== undefined) {
        return <>{fallback}</>;
    }

    return (
        <span
            className="inline-flex items-center gap-1 text-slate-300 font-bold"
            title={ANONYMITY_HIDDEN_REASON}
            aria-label={ANONYMITY_HIDDEN_REASON}
        >
            {ANONYMITY_HIDDEN_LABEL}
            {!hideReason && (
                <Info className="w-3 h-3 text-slate-300" aria-hidden="true" />
            )}
        </span>
    );
}

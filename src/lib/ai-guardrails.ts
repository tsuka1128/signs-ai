/**
 * AI生成テキストの品質ガードレール
 * PHILOSOPHY.md § 3 の「禁止される論法」をプログラムで強制する後処理フィルター。
 * generateAIInsight() の結果に対して適用し、因果断定・誇大表現を除去・変換する。
 */

/** 因果表現 → 相関表現への自動変換マップ */
const CAUSATION_TO_CORRELATION: [RegExp, string][] = [
    [/体温が上がれば(.+)が上がる/g, '体温が高い組織は$1が高い傾向がある'],
    [/体温を上げると(.+)が改善/g, '体温が高い組織では$1が改善している傾向がある'],
    [/体温が(.+)を引き上げ/g, '体温と$1の間に相関が見られ'],
    [/エンゲージメントが上がれば/g, 'エンゲージメントが高い組織では'],
    [/体温改善により/g, '体温が高い組織では'],
    [/導入すれば(.+)が上がる/g, '活用している組織では$1が高い傾向がある'],
    [/によって(.+)が向上する/g, 'と$1の間に相関傾向がある'],
];

/** 禁止フレーズ（出力に含まれてはならない表現） */
const FORBIDDEN_PHRASES: RegExp[] = [
    /SignsAIを導入すれば売上が/,
    /Gallupと同等/,
    /Q12と同じ/,
    /Gallupと提携/,
    /効果を保証/,
    /必ず改善/,
];

/** 数値断定パターン（根拠なき具体的数値の断定） */
const UNSUPPORTED_NUMERIC_ASSERTION: RegExp[] = [
    /\d+%改善されます/,
    /\d+%向上します/,
    /\d+万円の効果/,
    /\d+倍になります/,
];

export interface GuardrailResult {
    /** フィルター適用後のテキスト */
    filtered: string;
    /** 変換・削除されたアイテムのログ */
    warnings: string[];
}

/**
 * 単一テキストにガードレールを適用する
 */
export function applyGuardrails(text: string, fieldName: string): GuardrailResult {
    let filtered = text;
    const warnings: string[] = [];

    // 1. 因果 → 相関 の自動変換
    for (const [pattern, replacement] of CAUSATION_TO_CORRELATION) {
        pattern.lastIndex = 0;
        if (pattern.test(filtered)) {
            warnings.push(`[CAUSATION_CONVERTED] ${fieldName}: "${pattern.source}" を相関表現に変換`);
            filtered = filtered.replace(pattern, replacement);
        }
    }

    // 2. 禁止フレーズの検出・警告（削除はせず警告のみ。重大な場合はUIで注記）
    for (const phrase of FORBIDDEN_PHRASES) {
        if (phrase.test(filtered)) {
            // コメント通り「警告ログのみ・本文は変更しない」。
            // 本文に不自然な定型文を埋め込むと表示が壊れるため、誇大表現の抑制はプロンプト側で行う。
            warnings.push(`[FORBIDDEN_PHRASE] ${fieldName}: 禁止フレーズ "${phrase.source}" を検出`);
        }
    }

    // 3. 数値根拠なき断定の検出
    for (const pattern of UNSUPPORTED_NUMERIC_ASSERTION) {
        if (pattern.test(filtered)) {
            warnings.push(`[UNSUPPORTED_NUMERIC] ${fieldName}: 根拠なき数値断定 "${pattern.source}" を検出`);
            // 断定形 → 傾向形に変換
            filtered = filtered
                .replace(/(\d+%)(改善されます|向上します)/g, '$1程度の改善傾向が見られます（参考値）')
                .replace(/(\d+万円)の効果/g, '$1相当の差異が見られる傾向')
                .replace(/(\d+倍)になります/g, '$1相当の差異が確認されています');
        }
    }

    return { filtered, warnings };
}

/**
 * AI分析結果JSON全体にガードレールを適用する
 * テキストフィールドを再帰的に処理する
 */
export function applyGuardrailsToAIResult(aiResult: any): {
    result: any;
    allWarnings: string[];
} {
    const allWarnings: string[] = [];

    function processValue(value: any, path: string): any {
        if (typeof value === 'string') {
            const { filtered, warnings } = applyGuardrails(value, path);
            allWarnings.push(...warnings);
            return filtered;
        }
        if (Array.isArray(value)) {
            return value.map((item, i) => processValue(item, `${path}[${i}]`));
        }
        if (value && typeof value === 'object') {
            const processed: any = {};
            for (const key of Object.keys(value)) {
                processed[key] = processValue(value[key], `${path}.${key}`);
            }
            return processed;
        }
        return value;
    }

    const result = processValue(aiResult, 'root');

    if (allWarnings.length > 0) {
        console.warn(`[AI Guardrails] ${allWarnings.length} issue(s) detected and processed:`);
        allWarnings.forEach(w => console.warn(` - ${w}`));
    }

    return { result, allWarnings };
}

export interface KpiVoice {
    mood: "sun" | "cloud" | "rain";
    text: string;
}

export interface KpiDisplayData {
    id: string;
    name: string;
    unit: string;
    target: number;
    val: number | string;
    dept: string;
    voices: KpiVoice[];
    prev: number[];
    targetHistory: number[];
    yoy: number | null;
    owner_department_id?: string;
    owner_dept_id?: string;
    is_main?: boolean;
}

export interface DepartmentDisplayData {
    id: string;
    name: string;
    head: string;
    headHistory: number[];
    productivity: number;
    pulse: number;
    pulseHistory: number[];
    weather: "sun" | "cloud" | "rain";
    arrow: string;
    kpiAch: number;
    kpis: any[]; // 近い将来詳細な型を定義
    kpiName?: string;
    productivityHistory: number[];
    xAxisHead?: number;
    sizeValue?: number;
    sizeHistory?: number[];
    mrr?: number;
}

export interface VoiceTopic {
    id: string;
    topic: string; // 例: "評価制度", "コミュニケーション"
    sentiment: "positive" | "negative" | "neutral";
    abstractedVoice: string; // 例: "「評価のフィードバックが丁寧で納得感がある」という声が複数上がっています。"
    persona?: string; // 例: "入社2〜3年目層", "営業部門メンバー" (特定されない抽象的な表現)
}

export interface SurveyHistoryData {
    viewName: string;
    scores: number[];
    prevScores: number[];
    customScores: number[];
    pulse: number;
    pulseHistory: number[];
    aiComment: string;
    responseCount: number;
    responseRate: number;
    voiceTopics?: VoiceTopic[];
    isStale?: boolean;
    dataMonth?: string | null;
}

export interface MatrixItemData extends DepartmentDisplayData {
    head: any; // ScatterPlotとの互換性のため
}

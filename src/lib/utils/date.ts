/**
 * recorded_month の形式を YYYY-MM-DD に正規化する（YYYY-MM 形式も受け入れる）
 */
export const normalizeMonth = (m: string): string => {
    if (!m) return m;
    // YYYY-MM 形式を YYYY-MM-01 に変換
    if (/^\d{4}-\d{2}$/.test(m)) return `${m}-01`;
    return m;
};

/**
 * 直近 N ヶ月分の YYYY-MM-01 形式の配列を生成する
 */
export const getLastNMonths = (n: number): string[] => {
    const dates = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    }
    return dates;
};

/**
 * 日付（YYYY-MM-DD）配列から「X月」形式のラベル配列を生成する
 */
export const getMonthLabels = (dates: string[]): string[] => {
    return dates.map(m => {
        const mm = m.split("-")[1];
        return `${parseInt(mm)}月`;
    });
};

/**
 * 日付（YYYY-MM-DD）配列から「YYYY年X月」形式のラベル配列を生成する
 */
export const getFullMonthLabels = (dates: string[]): string[] => {
    return dates.map(m => {
        const parts = m.split("-");
        return `${parts[0]}年${parseInt(parts[1])}月`;
    });
};

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * YYYY-MM 形式の文字列から1ヶ月遡った YYYY-MM を返すヘルパー
 */
function getPreviousMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  // Dateオブジェクトの月は0始まりなので、month-2 で前月になる
  const date = new Date(year, month - 2, 1);
  const prevYear = date.getFullYear();
  const prevMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${prevYear}-${prevMonth}`;
}

/**
 * 特定部署の指定された複数月（targetYMs）の headcount を carry-forward 適用して一括解決します。
 * N+1クエリを防ぐため、対象月およびその過去13ヶ月分のデータを一括フェッチして処理します。
 * 実績データがない場合は、対象部署の基準人数 (departments.headcount) にフォールバックします。
 */
export async function resolveMonthlyHeadcounts(
  supabase: SupabaseClient<any>,
  deptId: string,
  targetYMs: string[]
): Promise<Record<string, number>> {
  if (targetYMs.length === 0) return {};

  // 部署の基準人数 (departments.headcount) を取得
  const { data: deptData, error: deptErr } = await supabase
    .from("departments")
    .select("headcount")
    .eq("id", deptId)
    .single();
  const defaultHeadcount = deptData?.headcount || 0;

  // targetYMs の中で最も古い月と新しい月を特定
  const sortedYMs = [...targetYMs].sort();
  const oldestYM = sortedYMs[0];
  const newestYM = sortedYMs[sortedYMs.length - 1];

  // 最古の月から13ヶ月遡った月を算出
  let queryStartYM = oldestYM;
  for (let i = 0; i < 13; i++) {
    queryStartYM = getPreviousMonth(queryStartYM);
  }

  const startDateStr = `${queryStartYM}-01`;
  const endDateStr = `${newestYM}-01`;

  // `resource_records` から対象範囲のレコードを一括取得 (axis_id IS NULL フィルタ必須)
  const { data: records, error } = await supabase
    .from("resource_records")
    .select("recorded_month, head_count")
    .eq("department_id", deptId)
    .is("axis_id", null)
    .gte("recorded_month", startDateStr)
    .lte("recorded_month", endDateStr);

  if (error) {
    console.error("Error fetching resource_records in resolveMonthlyHeadcounts:", error);
    // エラー時はフォールバックとして基準人数を返す
    const fallback: Record<string, number> = {};
    targetYMs.forEach(ym => { fallback[ym] = defaultHeadcount; });
    return fallback;
  }

  // 月(YYYY-MM) -> head_count のマップを作成
  const recordsMap: Record<string, number> = {};
  (records || []).forEach(r => {
    const ym = r.recorded_month.substring(0, 7);
    recordsMap[ym] = r.head_count || 0;
  });

  const result: Record<string, number> = {};

  // 各対象月について carry-forward ロジックを実行
  for (const ym of targetYMs) {
    let currentYM = ym;
    let resolvedCount = 0;
    
    // 当月を含めて最大14ヶ月分（当月 + 過去13ヶ月）探索する
    for (let i = 0; i < 14; i++) {
      const val = recordsMap[currentYM];
      if (val !== undefined && val > 0) {
        resolvedCount = val;
        break;
      }
      currentYM = getPreviousMonth(currentYM);
    }

    // フォールバック: 実績が無い/0名の場合は設定画面の基準人数 (headcount) を使用
    if (resolvedCount === 0) {
      resolvedCount = defaultHeadcount;
    }

    result[ym] = resolvedCount;
  }

  return result;
}

/**
 * 指定された会社（companyId）の全部署の指定月（ym）における headcount を carry-forward 適用して一括解決します。
 * 実績データがない部署は、基準人数 (departments.headcount) にフォールバックします。
 */
export async function resolveAllDepartmentsHeadcounts(
  supabase: SupabaseClient<any>,
  companyId: string,
  ym: string
): Promise<Record<string, number>> {
  // ym から13ヶ月遡った月を算出
  let queryStartYM = ym;
  for (let i = 0; i < 13; i++) {
    queryStartYM = getPreviousMonth(queryStartYM);
  }

  const startDateStr = `${queryStartYM}-01`;
  const endDateStr = `${ym}-01`;

  // 会社内の全部署の resource_records を一括取得 (axis_id IS NULL フィルタ必須)
  const { data: records, error } = await supabase
    .from("resource_records")
    .select("department_id, recorded_month, head_count")
    .eq("company_id", companyId)
    .is("axis_id", null)
    .gte("recorded_month", startDateStr)
    .lte("recorded_month", endDateStr);

  if (error) {
    console.error("Error fetching resource_records in resolveAllDepartmentsHeadcounts:", error);
  }

  // 部署ID -> 月(YYYY-MM) -> head_count のネストされたマップを作成
  const recordsMap: Record<string, Record<string, number>> = {};
  (records || []).forEach(r => {
    if (!r.department_id) return;
    const depId = r.department_id;
    const rYM = r.recorded_month.substring(0, 7);
    if (!recordsMap[depId]) {
      recordsMap[depId] = {};
    }
    recordsMap[depId][rYM] = r.head_count || 0;
  });

  // 会社の全部署の基準人数 (departments.headcount) を一括取得
  const { data: deptsData, error: deptsErr } = await supabase
    .from("departments")
    .select("id, headcount")
    .eq("company_id", companyId);

  const defaultHeadcounts: Record<string, number> = {};
  (deptsData || []).forEach(d => {
    defaultHeadcounts[d.id] = d.headcount || 0;
  });

  const result: Record<string, number> = {};

  // 会社の全部署に対して、当月 ym の headcount を解決
  Object.keys(defaultHeadcounts).forEach(depId => {
    let currentYM = ym;
    let resolvedCount = 0;
    
    if (recordsMap[depId]) {
      for (let i = 0; i < 14; i++) {
        const val = recordsMap[depId][currentYM];
        if (val !== undefined && val > 0) {
          resolvedCount = val;
          break;
        }
        currentYM = getPreviousMonth(currentYM);
      }
    }
    
    // フォールバック: 実績が無い/0名の場合は設定の基準人数を使用
    if (resolvedCount === 0) {
      resolvedCount = defaultHeadcounts[depId];
    }
    
    result[depId] = resolvedCount;
  });

  return result;
}

/**
 * 会社IDを指定せず、全社横断で指定月（ym）における全部署の headcount を一括解決します（Cron用）。
 * 実績データがない部署は、基準人数 (departments.headcount) にフォールバックします。
 */
export async function resolveAllDepartmentsHeadcountsAcrossCompany(
  supabase: SupabaseClient<any>,
  ym: string
): Promise<Record<string, number>> {
  // ym から13ヶ月遡った月を算出
  let queryStartYM = ym;
  for (let i = 0; i < 13; i++) {
    queryStartYM = getPreviousMonth(queryStartYM);
  }

  const startDateStr = `${queryStartYM}-01`;
  const endDateStr = `${ym}-01`;

  // 全 resource_records を一括取得 (axis_id IS NULL フィルタ必須)
  const { data: records, error } = await supabase
    .from("resource_records")
    .select("department_id, recorded_month, head_count")
    .is("axis_id", null)
    .gte("recorded_month", startDateStr)
    .lte("recorded_month", endDateStr);

  if (error) {
    console.error("Error fetching resource_records in resolveAllDepartmentsHeadcountsAcrossCompany:", error);
  }

  const recordsMap: Record<string, Record<string, number>> = {};
  (records || []).forEach(r => {
    if (!r.department_id) return;
    const depId = r.department_id;
    const rYM = r.recorded_month.substring(0, 7);
    if (!recordsMap[depId]) {
      recordsMap[depId] = {};
    }
    recordsMap[depId][rYM] = r.head_count || 0;
  });

  // 全部署の基準人数 (departments.headcount) を一括取得
  const { data: deptsData, error: deptsErr } = await supabase
    .from("departments")
    .select("id, headcount");

  const defaultHeadcounts: Record<string, number> = {};
  (deptsData || []).forEach(d => {
    defaultHeadcounts[d.id] = d.headcount || 0;
  });

  const result: Record<string, number> = {};

  // 全部署に対して、当月 ym の headcount を解決
  Object.keys(defaultHeadcounts).forEach(depId => {
    let currentYM = ym;
    let resolvedCount = 0;
    
    if (recordsMap[depId]) {
      for (let i = 0; i < 14; i++) {
        const val = recordsMap[depId][currentYM];
        if (val !== undefined && val > 0) {
          resolvedCount = val;
          break;
        }
        currentYM = getPreviousMonth(currentYM);
      }
    }
    
    // フォールバック: 実績が無い/0名の場合は設定の基準人数を使用
    if (resolvedCount === 0) {
      resolvedCount = defaultHeadcounts[depId];
    }
    
    result[depId] = resolvedCount;
  });

  return result;
}

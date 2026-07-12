import { HrCampaign, KpiRecord, KpiDefinition, ResourceRecord } from "@/types/database";

export interface RoiInputData {
  campaign: HrCampaign;
  displayDepts: any[];
  displayAxes: any[];
  realResources: ResourceRecord[];
  realKpiRecords: KpiRecord[];
  realKpis: KpiDefinition[];
  last13Months: string[];
}

export interface MetricSnapshot {
  productivity: number;
  kpiAch: number;
  pulse: number;
  laborCost: number;
  revenue: number | null;
}

export interface CampaignRoiResult {
  id: string;
  title: string;
  category: string | null;
  targetName: string;
  launchedAt: string;
  investedCost: number | null;
  status: "active" | "archived";

  // 期間情報
  launchIdx: number;
  effectMonths: number;
  isBeforeWindowValid: boolean;
  isAfterWindowValid: boolean;
  isOutOfWindow: boolean;
  missingMonthsMessage?: string;

  // ガードステート
  isLaborCostMissing: boolean;

  // 前後比較指標
  before: MetricSnapshot;
  after: MetricSnapshot;
  diff: MetricSnapshot;
  netDiff: MetricSnapshot; // DiD差分（率系指標のみ）

  // 推移履歴（13ヶ月）
  histories: {
    months: string[];
    productivity: number[];
    productivityFilled: number[];
    kpiAch: number[];
    kpiAchFilled: number[];
    pulse: number[];
    laborCost: number[];
    revenue: (number | null)[];
  };

  // 対照群推移履歴（13ヶ月。対照群がある場合のみ）
  controlHistories?: {
    productivity: number[];
    productivityFilled: number[];
    kpiAch: number[];
    kpiAchFilled: number[];
    pulse: number[];
  };

  // 金額結果
  grossEfficiencyImpact: number;
  netEfficiencyImpact: number; // メイン見出し
  revenueImpact: number | null; // 売上インパクト（gross、該当KPIがある場合のみ）
  companyRevenueGrowthRate: number | null; // 全社売上伸び率%（参考値、該当KPIがある場合のみ）

  // ROI指標
  roiPercent: number | null;
  paybackPeriodMonths: number | null;
}

/**
 * ゼロ割りを防ぐ安全な除算関数 (ゼロ基準ガード)
 */
function safeRatio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * 人数加重平均を算出するヘルパー
 */
function calculateWeightedAverage(values: number[], weights: number[]): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (let i = 0; i < values.length; i++) {
    const w = weights[i] ?? 0;
    weightedSum += (values[i] ?? 0) * w;
    totalWeight += w;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * 施策ROIの純計算ロジック
 */
export function calculateCampaignRoi(input: RoiInputData): CampaignRoiResult {
  const { campaign, displayDepts, displayAxes, realResources, realKpiRecords, realKpis, last13Months } = input;

  // 1. 仮定(Assumptions)の取得
  const assumptions = (campaign.roi_assumptions as any) || {};
  const lagMonths = typeof assumptions.lagMonths === "number" ? assumptions.lagMonths : 1;
  const windowMonths = typeof assumptions.windowMonths === "number" ? assumptions.windowMonths : 3;
  const salesAttribution = typeof assumptions.salesAttribution === "number" ? assumptions.salesAttribution : 1.0;

  // 2. 期間ウィンドウの算出
  const launchedAtStr = campaign.launched_at; // YYYY-MM-01 形式
  // YYYY-MM または YYYY-MM-01 形式を統一
  const normalizedLaunchMonth = launchedAtStr.slice(0, 7) + "-01";
  const launchIdx = last13Months.indexOf(normalizedLaunchMonth);

  const isOutOfWindow = launchIdx === -1;
  const isBeforeWindowValid = launchIdx >= windowMonths;
  const isAfterWindowValid = launchIdx !== -1 && launchIdx + lagMonths <= 12;
  const effectMonths = isAfterWindowValid ? 12 - (launchIdx + lagMonths) + 1 : 0;

  let missingMonthsMessage = "";
  if (isOutOfWindow) {
    missingMonthsMessage = "施策開始月が直近13ヶ月の測定範囲外です。";
  } else if (!isBeforeWindowValid) {
    missingMonthsMessage = `Beforeデータの測定に必要な期間（${windowMonths}ヶ月）が不足しています。`;
  } else if (!isAfterWindowValid) {
    const requiredMonths = lagMonths + 1;
    missingMonthsMessage = `効果測定を開始するには、施策開始から最低${requiredMonths}ヶ月経過する必要があります。`;
  }

  // 3. 対象スコープ (Target) の特定および時系列データの取得
  let isDept = false;
  let isAxis = false;
  let targetName = "全社";

  if (campaign.department_id) {
    isDept = true;
    const dept = displayDepts.find((d) => d.id === campaign.department_id);
    targetName = dept ? dept.name : "削除された部署";
  } else if (campaign.axis_id) {
    isAxis = true;
    const axis = displayAxes.find((a) => a.id === campaign.axis_id);
    targetName = axis ? axis.name : "削除された軸";
  }

  // 各月の時系列データを13ヶ月分格納する配列
  const targetProductivity: number[] = [];
  const targetProductivityFilled: number[] = [];
  const targetKpiAch: number[] = [];
  const targetKpiAchFilled: number[] = [];
  const targetPulse: number[] = [];
  const targetLaborCost: number[] = [];
  const targetRevenue: (number | null)[] = [];

  // 対照群 (Control) の時系列データ用
  const controlProductivity: number[] = [];
  const controlProductivityFilled: number[] = [];
  const controlKpiAch: number[] = [];
  const controlKpiAchFilled: number[] = [];
  const controlPulse: number[] = [];

  // 売上定義 (is_revenue = true の KPI ID リスト)
  const revenueKpiIds = realKpis.filter((k) => k.is_revenue).map((k) => k.id);
  const hasRevenueKpis = revenueKpiIds.length > 0;

  // 13ヶ月分のデータをループで構築
  for (let mIdx = 0; mIdx < 13; mIdx++) {
    const month = last13Months[mIdx];

    // --- 3.1 対象 (Target) データの取得 ---
    if (isDept) {
      const dept = displayDepts.find((d) => d.id === campaign.department_id);
      if (dept) {
        targetProductivity.push(dept.productivityHistory[mIdx] ?? 0);
        targetProductivityFilled.push(dept.productivityHistoryFilled[mIdx] ?? 0);
        targetKpiAch.push(dept.kpiAchHistory[mIdx] ?? 0);
        targetKpiAchFilled.push(dept.kpiAchHistoryFilled[mIdx] ?? 0);
        targetPulse.push(dept.pulseHistory[mIdx] ?? 0);

        // 人件費レコード
        const res = realResources.find(
          (r) => r.department_id === campaign.department_id && r.recorded_month.slice(0, 7) === month.slice(0, 7)
        );
        targetLaborCost.push(res?.labor_cost ?? 0);

        // 売上レコード
        if (hasRevenueKpis) {
          const revRecs = realKpiRecords.filter(
            (r) =>
              r.department_id === campaign.department_id &&
              r.recorded_month.slice(0, 7) === month.slice(0, 7) &&
              r.kpi_definition_id &&
              revenueKpiIds.includes(r.kpi_definition_id)
          );
          targetRevenue.push(revRecs.length > 0 ? revRecs.reduce((sum, r) => sum + (r.value ?? 0), 0) : null);
        } else {
          targetRevenue.push(null);
        }
      }
    } else if (isAxis) {
      const axis = displayAxes.find((a) => a.id === campaign.axis_id);
      if (axis) {
        targetProductivity.push(axis.productivityHistory[mIdx] ?? 0);
        targetProductivityFilled.push(axis.productivityHistoryFilled[mIdx] ?? 0);
        targetKpiAch.push(axis.kpiAchHistory[mIdx] ?? 0);
        targetKpiAchFilled.push(axis.kpiAchHistoryFilled[mIdx] ?? 0);
        targetPulse.push(axis.pulseHistory[mIdx] ?? 0);

        // 人件費
        const res = realResources.find(
          (r) => r.axis_id === campaign.axis_id && r.recorded_month.slice(0, 7) === month.slice(0, 7)
        );
        targetLaborCost.push(res?.labor_cost ?? 0);

        // 売上
        if (hasRevenueKpis) {
          const revRecs = realKpiRecords.filter(
            (r) =>
              r.axis_id === campaign.axis_id &&
              r.recorded_month.slice(0, 7) === month.slice(0, 7) &&
              r.kpi_definition_id &&
              revenueKpiIds.includes(r.kpi_definition_id)
          );
          targetRevenue.push(revRecs.length > 0 ? revRecs.reduce((sum, r) => sum + (r.value ?? 0), 0) : null);
        } else {
          targetRevenue.push(null);
        }
      }
    } else {
      // 全社スコープ: displayDepts の加重平均 / 合計で合成
      const heads = displayDepts.map((d) => d.headHistory[mIdx] ?? 0);
      const totalHead = heads.reduce((sum, h) => sum + h, 0);

      // 加重平均
      const prod = calculateWeightedAverage(
        displayDepts.map((d) => d.productivityHistory[mIdx] ?? 0),
        heads
      );
      const prodFilled = calculateWeightedAverage(
        displayDepts.map((d) => d.productivityHistoryFilled[mIdx] ?? 0),
        heads
      );
      const kpi = calculateWeightedAverage(
        displayDepts.map((d) => d.kpiAchHistory[mIdx] ?? 0),
        heads
      );
      const kpiFilled = calculateWeightedAverage(
        displayDepts.map((d) => d.kpiAchHistoryFilled[mIdx] ?? 0),
        heads
      );
      const pulse = calculateWeightedAverage(
        displayDepts.map((d) => d.pulseHistory[mIdx] ?? 0),
        heads
      );

      targetProductivity.push(prod);
      targetProductivityFilled.push(prodFilled);
      targetKpiAch.push(kpi);
      targetKpiAchFilled.push(kpiFilled);
      targetPulse.push(pulse);

      // 人件費は全社合計
      const monthLaborRes = realResources.filter(
        (r) => r.recorded_month.slice(0, 7) === month.slice(0, 7) && r.department_id !== null
      );
      const totalLabor = monthLaborRes.reduce((sum, r) => sum + (r.labor_cost ?? 0), 0);
      targetLaborCost.push(totalLabor);

      // 売上も全社合計
      if (hasRevenueKpis) {
        const revRecs = realKpiRecords.filter(
          (r) =>
            r.recorded_month.slice(0, 7) === month.slice(0, 7) &&
            r.kpi_definition_id &&
            revenueKpiIds.includes(r.kpi_definition_id)
        );
        targetRevenue.push(revRecs.length > 0 ? revRecs.reduce((sum, r) => sum + (r.value ?? 0), 0) : null);
      } else {
        targetRevenue.push(null);
      }
    }

    // --- 3.2 対照群 (Control) データの合成 ---
    if (isDept) {
      // 対象部署以外の全部署を加重平均
      const otherDepts = displayDepts.filter((d) => d.id !== campaign.department_id);
      const heads = otherDepts.map((d) => d.headHistory[mIdx] ?? 0);

      controlProductivity.push(
        calculateWeightedAverage(
          otherDepts.map((d) => d.productivityHistory[mIdx] ?? 0),
          heads
        )
      );
      controlProductivityFilled.push(
        calculateWeightedAverage(
          otherDepts.map((d) => d.productivityHistoryFilled[mIdx] ?? 0),
          heads
        )
      );
      controlKpiAch.push(
        calculateWeightedAverage(
          otherDepts.map((d) => d.kpiAchHistory[mIdx] ?? 0),
          heads
        )
      );
      controlKpiAchFilled.push(
        calculateWeightedAverage(
          otherDepts.map((d) => d.kpiAchHistoryFilled[mIdx] ?? 0),
          heads
        )
      );
      controlPulse.push(
        calculateWeightedAverage(
          otherDepts.map((d) => d.pulseHistory[mIdx] ?? 0),
          heads
        )
      );
    } else if (isAxis) {
      // 対象軸以外の全軸を加重平均
      const otherAxes = displayAxes.filter((a) => a.id !== campaign.axis_id);
      const heads = otherAxes.map((a) => a.headHistory[mIdx] ?? 0);

      controlProductivity.push(
        calculateWeightedAverage(
          otherAxes.map((a) => a.productivityHistory[mIdx] ?? 0),
          heads
        )
      );
      controlProductivityFilled.push(
        calculateWeightedAverage(
          otherAxes.map((a) => a.productivityHistoryFilled[mIdx] ?? 0),
          heads
        )
      );
      controlKpiAch.push(
        calculateWeightedAverage(
          otherAxes.map((a) => a.kpiAchHistory[mIdx] ?? 0),
          heads
        )
      );
      controlKpiAchFilled.push(
        calculateWeightedAverage(
          otherAxes.map((a) => a.kpiAchHistoryFilled[mIdx] ?? 0),
          heads
        )
      );
      controlPulse.push(
        calculateWeightedAverage(
          otherAxes.map((a) => a.pulseHistory[mIdx] ?? 0),
          heads
        )
      );
    }
  }

  // --- 4. 期間平均の計算 (Before / After) ---
  const beforeRange = isBeforeWindowValid ? Array.from({ length: windowMonths }, (_, i) => launchIdx - windowMonths + i) : [];
  const afterRange = isAfterWindowValid ? Array.from({ length: effectMonths }, (_, i) => launchIdx + lagMonths + i) : [];

  const getAverage = (arr: number[], range: number[]) => {
    if (range.length === 0) return 0;
    const sum = range.reduce((s, idx) => s + (arr[idx] ?? 0), 0);
    return sum / range.length;
  };

  const getAverageNullable = (arr: (number | null)[], range: number[]) => {
    if (range.length === 0) return null;
    const validValues = range.map((idx) => arr[idx]).filter((v): v is number => v !== null && v !== undefined);
    if (validValues.length === 0) return null;
    return validValues.reduce((s, v) => s + v, 0) / validValues.length;
  };

  // Before / After 平均値の算出
  const targetBeforeProd = getAverage(targetProductivityFilled, beforeRange);
  const targetAfterProd = getAverage(targetProductivityFilled, afterRange);

  const targetBeforeKpi = getAverage(targetKpiAchFilled, beforeRange);
  const targetAfterKpi = getAverage(targetKpiAchFilled, afterRange);

  const targetBeforePulse = getAverage(targetPulse, beforeRange);
  const targetAfterPulse = getAverage(targetPulse, afterRange);

  const targetBeforeLabor = getAverage(targetLaborCost, beforeRange);
  const targetAfterLabor = getAverage(targetLaborCost, afterRange);

  const targetBeforeRev = getAverageNullable(targetRevenue, beforeRange);
  const targetAfterRev = getAverageNullable(targetRevenue, afterRange);

  // 対照群の Before / After
  const hasControl = isDept || isAxis;
  const controlBeforeProd = hasControl ? getAverage(controlProductivityFilled, beforeRange) : 0;
  const controlAfterProd = hasControl ? getAverage(controlProductivityFilled, afterRange) : 0;

  const controlBeforeKpi = hasControl ? getAverage(controlKpiAchFilled, beforeRange) : 0;
  const controlAfterKpi = hasControl ? getAverage(controlKpiAchFilled, afterRange) : 0;

  const controlBeforePulse = hasControl ? getAverage(controlPulse, beforeRange) : 0;
  const controlAfterPulse = hasControl ? getAverage(controlPulse, afterRange) : 0;

  // 差分 (After - Before) の計算 (率系指標は%ポイント、実数値は実数差)
  const targetDiffProd = targetAfterProd - targetBeforeProd;
  const targetDiffKpi = targetAfterKpi - targetBeforeKpi;
  const targetDiffPulse = targetAfterPulse - targetBeforePulse;
  const targetDiffLabor = targetAfterLabor - targetBeforeLabor;
  const targetDiffRev = targetAfterRev !== null && targetBeforeRev !== null ? targetAfterRev - targetBeforeRev : null;

  // DiD Net 差分の計算 (率系指標のみ適用)
  let netDiffProd = targetDiffProd;
  let netDiffKpi = targetDiffKpi;
  let netDiffPulse = targetDiffPulse;

  if (hasControl) {
    const controlDiffProd = controlAfterProd - controlBeforeProd;
    const controlDiffKpi = controlAfterKpi - controlBeforeKpi;
    const controlDiffPulse = controlAfterPulse - controlBeforePulse;

    netDiffProd = targetDiffProd - controlDiffProd;
    netDiffKpi = targetDiffKpi - controlDiffKpi;
    netDiffPulse = targetDiffPulse - controlDiffPulse;
  }

  // --- 5. 人件費欠損ガードの判定 ---
  // After期間内の人件費の合計が0である場合は人件費データ欠損と判定する
  const afterLaborCosts = afterRange.map((idx) => targetLaborCost[idx] ?? 0);
  const isLaborCostMissing = afterLaborCosts.length > 0 && afterLaborCosts.every((c) => c === 0);

  // --- 6. 金額インパクトの計算 ---
  let grossEfficiencyImpact = 0;
  let netEfficiencyImpact = 0;

  if (isAfterWindowValid && isBeforeWindowValid && !isLaborCostMissing) {
    // 6.1 生産性効率インパクト (月次積み上げ)
    // ratio_m = Productivity_m / Productivity_before - 1 (ゼロ基準ガード付き)
    afterRange.forEach((m) => {
      const laborCost = targetLaborCost[m] ?? 0;

      // 対象部署の ratio
      let targetRatio = 0;
      if (targetBeforeProd > 0) {
        targetRatio = (targetProductivityFilled[m] ?? 0) / targetBeforeProd - 1;
      }

      // 対照群の ratio
      let controlRatio = 0;
      if (hasControl && controlBeforeProd > 0) {
        controlRatio = (controlProductivityFilled[m] ?? 0) / controlBeforeProd - 1;
      }

      const netRatio = targetRatio - controlRatio;

      grossEfficiencyImpact += laborCost * targetRatio;
      netEfficiencyImpact += laborCost * netRatio;
    });
  }

  // 6.2 売上インパクト (gross変化ベース、DiDは非適用)
  let revenueImpact: number | null = null;
  if (isAfterWindowValid && isBeforeWindowValid && targetBeforeRev !== null && targetAfterRev !== null) {
    // 各After月 m について (Revenue_m - Revenue_before) * salesAttribution の総和
    let sumRevDiff = 0;
    afterRange.forEach((m) => {
      const revVal = targetRevenue[m];
      if (revVal !== null && revVal !== undefined) {
        sumRevDiff += (revVal - targetBeforeRev) * salesAttribution;
      }
    });
    revenueImpact = sumRevDiff;
  }

  // 6.3 全社売上伸び率%の算出 (参考値)
  let companyRevenueGrowthRate: number | null = null;
  if (isAfterWindowValid && isBeforeWindowValid && hasRevenueKpis) {
    // 全社の売上合計系列
    const companyRevenues: number[] = [];
    for (let mIdx = 0; mIdx < 13; mIdx++) {
      const month = last13Months[mIdx];
      const allCompanyRevRecs = realKpiRecords.filter(
        (r) =>
          r.recorded_month.slice(0, 7) === month.slice(0, 7) &&
          r.kpi_definition_id &&
          revenueKpiIds.includes(r.kpi_definition_id)
      );
      companyRevenues.push(allCompanyRevRecs.reduce((sum, r) => sum + (r.value ?? 0), 0));
    }

    const companyBeforeRev = getAverage(companyRevenues, beforeRange);
    const companyAfterRev = getAverage(companyRevenues, afterRange);

    if (companyBeforeRev > 0) {
      companyRevenueGrowthRate = ((companyAfterRev - companyBeforeRev) / companyBeforeRev) * 100;
    } else {
      companyRevenueGrowthRate = 0;
    }
  }

  // --- 7. ROI指標 (投資額がある場合) ---
  const investedCost = campaign.invested_cost ? Number(campaign.invested_cost) : null;
  let roiPercent: number | null = null;
  let paybackPeriodMonths: number | null = null;

  if (investedCost && investedCost > 0 && isAfterWindowValid && isBeforeWindowValid && !isLaborCostMissing) {
    // ROI% = (net効率インパクト - 投資額) / 投資額 * 100
    roiPercent = safeRatio(netEfficiencyImpact - investedCost, investedCost) * 100;

    // 回収期間 = 投資額 / (net効率インパクト / 効果月数)
    const monthlyNetValue = safeRatio(netEfficiencyImpact, effectMonths);
    paybackPeriodMonths = monthlyNetValue > 0 ? investedCost / monthlyNetValue : null;
  }

  // --- 8. 結果の組み立てと返却 ---
  const result: CampaignRoiResult = {
    id: campaign.id,
    title: campaign.title,
    category: campaign.category,
    targetName,
    launchedAt: normalizedLaunchMonth.slice(0, 7),
    investedCost,
    status: campaign.status as "active" | "archived",
    launchIdx,
    effectMonths,
    isBeforeWindowValid,
    isAfterWindowValid,
    isOutOfWindow,
    missingMonthsMessage: missingMonthsMessage || undefined,
    isLaborCostMissing,

    before: {
      productivity: Math.round(targetBeforeProd * 10) / 10,
      kpiAch: Math.round(targetBeforeKpi * 10) / 10,
      pulse: Math.round(targetBeforePulse * 10) / 10,
      laborCost: Math.round(targetBeforeLabor),
      revenue: targetBeforeRev !== null ? Math.round(targetBeforeRev) : null,
    },
    after: {
      productivity: Math.round(targetAfterProd * 10) / 10,
      kpiAch: Math.round(targetAfterKpi * 10) / 10,
      pulse: Math.round(targetAfterPulse * 10) / 10,
      laborCost: Math.round(targetAfterLabor),
      revenue: targetAfterRev !== null ? Math.round(targetAfterRev) : null,
    },
    diff: {
      productivity: Math.round(targetDiffProd * 10) / 10,
      kpiAch: Math.round(targetDiffKpi * 10) / 10,
      pulse: Math.round(targetDiffPulse * 10) / 10,
      laborCost: Math.round(targetDiffLabor),
      revenue: targetDiffRev !== null ? Math.round(targetDiffRev) : null,
    },
    netDiff: {
      productivity: Math.round(netDiffProd * 10) / 10,
      kpiAch: Math.round(netDiffKpi * 10) / 10,
      pulse: Math.round(netDiffPulse * 10) / 10,
      laborCost: Math.round(targetDiffLabor), // 人件費はDiD対象外のため単なる差分
      revenue: null, // 売上はDiD非適用
    },

    histories: {
      months: last13Months.map((m) => m.slice(0, 7)),
      productivity: targetProductivity,
      productivityFilled: targetProductivityFilled,
      kpiAch: targetKpiAch,
      kpiAchFilled: targetKpiAchFilled,
      pulse: targetPulse,
      laborCost: targetLaborCost,
      revenue: targetRevenue,
    },

    grossEfficiencyImpact: Math.round(grossEfficiencyImpact),
    netEfficiencyImpact: Math.round(netEfficiencyImpact),
    revenueImpact: revenueImpact !== null ? Math.round(revenueImpact) : null,
    companyRevenueGrowthRate: companyRevenueGrowthRate !== null ? Math.round(companyRevenueGrowthRate * 10) / 10 : null,
    roiPercent: roiPercent !== null ? Math.round(roiPercent * 10) / 10 : null,
    paybackPeriodMonths: paybackPeriodMonths !== null ? Math.round(paybackPeriodMonths * 10) / 10 : null,
  };

  if (hasControl) {
    result.controlHistories = {
      productivity: controlProductivity,
      productivityFilled: controlProductivityFilled,
      kpiAch: controlKpiAch,
      kpiAchFilled: controlKpiAchFilled,
      pulse: controlPulse,
    };
  }

  return result;
}

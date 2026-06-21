import assert from "node:assert";
import { calculateCampaignRoi, RoiInputData } from "../campaign-roi";
import { HrCampaign, KpiRecord, KpiDefinition, ResourceRecord } from "@/types/database";

// テスト用データ定義ヘルパー
const createMockCampaign = (overrides: Partial<HrCampaign> = {}): HrCampaign => ({
  id: "test-campaign-id",
  company_id: "test-company-id",
  title: "テスト施策",
  category: "culture",
  department_id: null,
  axis_id: null,
  launched_at: "2026-03-01",
  invested_cost: 100000,
  roi_assumptions: {
    lagMonths: 1,
    windowMonths: 3,
    salesAttribution: 0.8
  },
  memo: "テストメモ",
  status: "active",
  created_by: "test-user-id",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  target_kpi_id: null,
  ...overrides
});

const mockMonths = [
  "2025-05-01", // idx 0
  "2025-06-01", // idx 1
  "2025-07-01", // idx 2
  "2025-08-01", // idx 3
  "2025-09-01", // idx 4
  "2025-10-01", // idx 5
  "2025-11-01", // idx 6
  "2025-12-01", // idx 7
  "2026-01-01", // idx 8
  "2026-02-01", // idx 9 (Before window start)
  "2026-03-01", // idx 10 (Launch Month)
  "2026-04-01", // idx 11 (Lag Month)
  "2026-05-01"  // idx 12 (After Month 1)
];

const mockKpiDefinitions: KpiDefinition[] = [
  {
    id: "kpi-sales",
    company_id: "test-company-id",
    name: "売上",
    description: "売上高",
    unit: "円",
    target_default: 1000000,
    is_higher_better: true,
    owner_department_id: null,
    owner_dept_id: null,
    is_revenue: true,
    is_main: true,
    is_secondary_size_metric: false,
    is_public_to_players: true,
    sort_order: 1,
    created_at: new Date().toISOString()
  }
];

const mockKpiRecords: KpiRecord[] = [
  // 売上実績 (全社)
  { id: "r1", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: null, axis_id: null, recorded_month: "2026-02-01", value: 1000000, target_value: 1000000, user_id: null, created_at: "" },
  { id: "r2", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: null, axis_id: null, recorded_month: "2026-03-01", value: 1000000, target_value: 1000000, user_id: null, created_at: "" },
  { id: "r3", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: null, axis_id: null, recorded_month: "2026-04-01", value: 1100000, target_value: 1000000, user_id: null, created_at: "" },
  { id: "r4", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: null, axis_id: null, recorded_month: "2026-05-01", value: 1200000, target_value: 1000000, user_id: null, created_at: "" }
];

const mockResources: ResourceRecord[] = [
  // 全社人件費
  { id: "res1", company_id: "test-company-id", department_id: "dept-a", axis_id: null, recorded_month: "2026-02-01", head_count: 5, labor_cost: 2000000, created_at: "" },
  { id: "res2", company_id: "test-company-id", department_id: "dept-a", axis_id: null, recorded_month: "2026-03-01", head_count: 5, labor_cost: 2000000, created_at: "" },
  { id: "res3", company_id: "test-company-id", department_id: "dept-a", axis_id: null, recorded_month: "2026-04-01", head_count: 5, labor_cost: 2000000, created_at: "" },
  { id: "res4", company_id: "test-company-id", department_id: "dept-a", axis_id: null, recorded_month: "2026-05-01", head_count: 5, labor_cost: 2000000, created_at: "" }
];

const mockDepts = [
  {
    id: "dept-a",
    name: "開発部",
    productivityHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 80, 80, 90], // idx 9 (Before) = 80, idx 12 (After) = 90
    productivityHistoryFilled: [0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 80, 80, 90],
    kpiAchHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 80, 80, 90],
    kpiAchHistoryFilled: [0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 80, 80, 90],
    pulseHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4],
    headHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5]
  },
  {
    id: "dept-b",
    name: "営業部",
    productivityHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 70, 70, 70], // コントロール用（横ばい）
    productivityHistoryFilled: [0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 70, 70, 70],
    kpiAchHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 70, 70, 70],
    kpiAchHistoryFilled: [0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 70, 70, 70],
    pulseHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3],
    headHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5]
  }
];

function runTests() {
  console.log("⏳ Running Campaign ROI Logic Tests...");

  // --- Test 1: 正常系 (部署指定・効果測定あり・DiD netの検証) ---
  {
    console.log("👉 Test 1: Department Scope Normal Case");
    const campaign = createMockCampaign({
      department_id: "dept-a",
      roi_assumptions: { lagMonths: 1, windowMonths: 1, salesAttribution: 1.0 } // Before window = 1 month (idx 9)
    });

    const result = calculateCampaignRoi({
      campaign,
      displayDepts: mockDepts,
      displayAxes: [],
      realResources: mockResources,
      realKpiRecords: mockKpiRecords,
      realKpis: mockKpiDefinitions,
      last13Months: mockMonths
    });

    assert.strictEqual(result.isLaborCostMissing, false, "人件費はあるべき");
    assert.strictEqual(result.isBeforeWindowValid, true, "Before窓は有効であるべき");
    assert.strictEqual(result.isAfterWindowValid, true, "After窓は有効であるべき");
    
    // 対象部署: Before生産性 = 80, After生産性 = 90
    // 対象部署 ratio = (90 / 80) - 1 = 12.5% (0.125)
    // 対照群部署 (dept-b): Before生産性 = 70, After生産性 = 70
    // 対照群 ratio = (70 / 70) - 1 = 0%
    // DiD net ratio = 12.5% - 0% = 12.5% (0.125)
    // After人件費 (idx 12) = 2000000
    // net効率インパクト = 2000000 * 0.125 = 250000
    assert.strictEqual(result.netEfficiencyImpact, 250000, "DiD Net効率インパクトの金額が正しく計算されること");
    assert.strictEqual(result.grossEfficiencyImpact, 250000, "対照群変化が0なのでGrossも250000であること");
  }

  // --- Test 2: ゼロ基準ガードの検証 ---
  {
    console.log("👉 Test 2: Zero-division Guard");
    const zeroDepts = [
      {
        id: "dept-a",
        name: "開発部",
        productivityHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90], // Before window (idx 9) = 0
        productivityHistoryFilled: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90],
        kpiAchHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90],
        kpiAchHistoryFilled: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90],
        pulseHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
        headHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5]
      },
      ...mockDepts.slice(1)
    ];

    const campaign = createMockCampaign({
      department_id: "dept-a",
      roi_assumptions: { lagMonths: 1, windowMonths: 1, salesAttribution: 1.0 }
    });

    const result = calculateCampaignRoi({
      campaign,
      displayDepts: zeroDepts,
      displayAxes: [],
      realResources: mockResources,
      realKpiRecords: mockKpiRecords,
      realKpis: mockKpiDefinitions,
      last13Months: mockMonths
    });

    // Before = 0 のため比率は 0 にガードされ、効率価値も 0 となる（Infinity/NaNを回避）
    assert.strictEqual(result.netEfficiencyImpact, 0, "比率が0になり金額も0になるべき");
  }

  // --- Test 3: 人件費欠損ガードの検証 ---
  {
    console.log("👉 Test 3: Missing Labor Cost Guard");
    const emptyResources = mockResources.map(r => ({ ...r, labor_cost: 0 }));

    const campaign = createMockCampaign({
      department_id: "dept-a",
      roi_assumptions: { lagMonths: 1, windowMonths: 1, salesAttribution: 1.0 }
    });

    const result = calculateCampaignRoi({
      campaign,
      displayDepts: mockDepts,
      displayAxes: [],
      realResources: emptyResources,
      realKpiRecords: mockKpiRecords,
      realKpis: mockKpiDefinitions,
      last13Months: mockMonths
    });

    assert.strictEqual(result.isLaborCostMissing, true, "人件費欠損フラグがtrueであること");
    assert.strictEqual(result.netEfficiencyImpact, 0, "人件費欠損時は効率インパクトが0になること");
  }

  // --- Test 4: 売上の gross 計算 ＆ 全社売上トレンド%の検証 ---
  {
    console.log("👉 Test 4: Gross Revenue and Company Trend Reference");
    const campaign = createMockCampaign({
      department_id: "dept-a",
      roi_assumptions: { lagMonths: 1, windowMonths: 1, salesAttribution: 0.5 } // salesAttribution = 0.5
    });

    const result = calculateCampaignRoi({
      campaign,
      displayDepts: mockDepts,
      displayAxes: [],
      realResources: mockResources,
      realKpiRecords: [
        // dept-a 売上 (Before idx 9 = 4000000, After idx 11 = 5000000, idx 12 = 5000000)
        { id: "r1", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: "dept-a", axis_id: null, recorded_month: "2026-02-01", value: 4000000, target_value: 4000000, user_id: null, created_at: "" },
        { id: "r1_5", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: "dept-a", axis_id: null, recorded_month: "2026-04-01", value: 5000000, target_value: 4000000, user_id: null, created_at: "" },
        { id: "r2", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: "dept-a", axis_id: null, recorded_month: "2026-05-01", value: 5000000, target_value: 4000000, user_id: null, created_at: "" },
        // 全社（dept-a + dept-b）売上合計 Before = 8000000, After = 10000000
        { id: "r3", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: "dept-b", axis_id: null, recorded_month: "2026-02-01", value: 4000000, target_value: 4000000, user_id: null, created_at: "" },
        { id: "r3_5", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: "dept-b", axis_id: null, recorded_month: "2026-04-01", value: 5000000, target_value: 4000000, user_id: null, created_at: "" },
        { id: "r4", kpi_definition_id: "kpi-sales", company_id: "test-company-id", department_id: "dept-b", axis_id: null, recorded_month: "2026-05-01", value: 5000000, target_value: 4000000, user_id: null, created_at: "" }
      ],
      realKpis: mockKpiDefinitions,
      last13Months: mockMonths
    });

    // 売上増分 = (5000000 - 4000000) = 1000000 (各月)
    // salesAttribution = 0.5 のため、500000 * 2ヶ月 = 1000000
    assert.strictEqual(result.revenueImpact, 1000000, "売上インパクトがgross * salesAttributionで計算されること");
    
    // 全社 Before = 8000000, After = 10000000, 伸び率 = (10000000 - 8000000) / 8000000 = 25%
    assert.strictEqual(result.companyRevenueGrowthRate, 25, "全社売上伸び率が25%と算出されること");
  }

  // --- Test 5: 期間の境界値 (期間不足、測定範囲外) の検証 ---
  {
    console.log("👉 Test 5: Window Constraints Validation");
    
    // 期間不足: Before window が 13ヶ月の最初より前に飛び出る場合
    const campaignShortBefore = createMockCampaign({
      launched_at: "2025-05-01", // idx 0
      roi_assumptions: { lagMonths: 1, windowMonths: 3, salesAttribution: 1.0 }
    });

    const resultShortBefore = calculateCampaignRoi({
      campaign: campaignShortBefore,
      displayDepts: mockDepts,
      displayAxes: [],
      realResources: mockResources,
      realKpiRecords: mockKpiRecords,
      realKpis: mockKpiDefinitions,
      last13Months: mockMonths
    });

    assert.strictEqual(resultShortBefore.isBeforeWindowValid, false, "Before期間が足りないのでfalse");
    assert.ok(resultShortBefore.missingMonthsMessage?.includes("Beforeデータ"), "適切なエラーメッセージが表示されること");

    // 期間不足: After期間が最新月（idx 12）に達せず効果測定できない場合
    const campaignShortAfter = createMockCampaign({
      launched_at: "2026-05-01", // idx 12
      roi_assumptions: { lagMonths: 1, windowMonths: 1, salesAttribution: 1.0 }
    });

    const resultShortAfter = calculateCampaignRoi({
      campaign: campaignShortAfter,
      displayDepts: mockDepts,
      displayAxes: [],
      realResources: mockResources,
      realKpiRecords: mockKpiRecords,
      realKpis: mockKpiDefinitions,
      last13Months: mockMonths
    });

    assert.strictEqual(resultShortAfter.isAfterWindowValid, false, "After期間がないのでfalse");
    assert.ok(resultShortAfter.missingMonthsMessage?.includes("効果測定を開始するには"), "適切なエラーメッセージが表示されること");
  }

  console.log("🚀 All tests passed successfully!");
}

runTests();

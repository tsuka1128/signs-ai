"use client";

import { useCompany } from "./useCompany";
import { useCallback, useMemo } from "react";

export type FeatureKey = 
  | 'second_axis' 
  | 'slack_integration' 
  | 'labor_analytics' 
  | 'pdf_export' 
  | 'timelapse' 
  | 'policy_reflection'
  | 'manual_ai_runs';

export function usePlanFeatures() {
  const { company, plan, loading, isTrial } = useCompany();

  // 個別上書き設定を取得 (JSONB)
  const overrides = useMemo(() => {
    return (company as any)?.plan_overrides || {};
  }, [company]);

  // 機能ごとのアクセス可否判定
  const canUse = useCallback((feature: FeatureKey): boolean => {
    if (!plan && !loading) return false;
    if (loading) return true; // ロード中はひとまず制限しない（チラつき防止）

    // 1. 個別上書き設定をチェック
    const overrideKeyMap: Record<FeatureKey, string> = {
      'second_axis': 'enable_second_axis',
      'slack_integration': 'enable_slack',
      'labor_analytics': 'enable_labor_analytics',
      'pdf_export': 'enable_pdf_export',
      'timelapse': 'enable_timelapse',
      'policy_reflection': 'enable_policy_reflection',
      'manual_ai_runs': 'enable_manual_ai_runs'
    };

    const overrideKey = overrideKeyMap[feature];
    if (overrideKey && overrides[overrideKey] !== undefined) {
      return !!overrides[overrideKey];
    }

    // 2. 基本的にプランが持っているフラグに従う
    switch (feature) {
      case 'second_axis':
        return plan?.enable_second_axis ?? false;
      case 'slack_integration':
        return plan?.enable_slack ?? false;
      case 'labor_analytics':
        // Proプランか、個別オプション（addon_labor_analytics）が有効ならOK
        return (plan?.enable_labor_analytics || company?.addon_labor_analytics || overrides.enable_labor_analytics) ?? false;
      case 'pdf_export':
        return plan?.enable_pdf_export ?? false;
      case 'timelapse':
        // Team以上ならOK (migrationでFree/Team/Standard/Pro全てで有効)
        return true; 
      case 'policy_reflection':
        // Team以上ならOK
        return true;
      case 'manual_ai_runs':
        // 基本的にどのプランでも回数制限はあるが、機能自体は存在。
        // ここではプランが取得できているかのみチェック（具体的な残数は limits.manualAiRuns で行うがゲートとしては true）
        return !!plan;
      default:
        return false;
    }
  }, [company, plan, loading, overrides]);

  // 数量制限の取得 (オーバーライド優先)
  const limits = useMemo(() => ({
    maxDepartments: overrides.max_departments ?? plan?.max_departments ?? 3,
    maxKpis: overrides.max_kpis ?? plan?.max_kpis ?? 5,
    maxMembers: overrides.max_headcount ?? plan?.max_headcount ?? 20,
    manualAiRuns: overrides.manual_ai_runs_per_month ?? plan?.manual_ai_runs_per_month ?? 1,
  }), [plan, overrides]);

  // バリデーションヘルパー
  const checkLimit = useCallback((type: 'departments' | 'kpis' | 'members', currentCount: number) => {
    switch (type) {
      case 'departments':
        return currentCount < limits.maxDepartments;
      case 'kpis':
        return currentCount < limits.maxKpis;
      case 'members':
        return currentCount < limits.maxMembers;
      default:
        return true;
    }
  }, [limits]);

  return {
    plan,
    company,
    loading,
    isTrial,
    trialDaysRemaining: useCompany().trialDaysRemaining,
    canUse,
    limits,
    checkLimit,
    planName: plan?.name ?? 'Free',
  };
}

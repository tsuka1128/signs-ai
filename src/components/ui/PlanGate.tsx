"use client";

import React from "react";
import { usePlanFeatures, FeatureKey } from "@/hooks/usePlanFeatures";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/index";

interface PlanGateProps {
  children: React.ReactNode;
  feature?: FeatureKey;
  requiredPlan?: 'Standard' | 'Pro';
  className?: string;
  showOverlay?: boolean;
}

export function PlanGate({ 
  children, 
  feature, 
  requiredPlan = 'Standard', 
  className,
  showOverlay = true 
}: PlanGateProps) {
  const { canUse, planName, loading } = usePlanFeatures();

  // 権限チェック
  const hasAccess = feature ? canUse(feature) : (
    requiredPlan === 'Pro' ? planName === 'Pro' : 
    (planName === 'Standard' || planName === 'Pro')
  );

  if (loading) return <div className="animate-pulse bg-slate-50 rounded-xl h-20" />;
  if (hasAccess) return <>{children}</>;

  // アクセス不可時の表示
  return (
    <div className={cn("relative group", className)}>
      {/* コンテンツを半透明にして表示（どんな機能かチラ見せ） */}
      <div className="opacity-20 pointer-events-none filter blur-[1px]">
        {children}
      </div>

      {/* ロックオーバーレイ */}
      {showOverlay && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-white/40 backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-slate-200 shadow-inner">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform group-hover:scale-110 transition-transform">
            <Lock className="w-6 h-6 text-white" />
          </div>
          
          <h3 className="text-slate-900 font-bold text-center mb-2 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
            {requiredPlan} プラン限定機能
          </h3>
          
          <p className="text-slate-500 text-xs text-center mb-6 leading-relaxed max-w-[200px]">
            この機能を利用するには、{requiredPlan} プランへのアップグレードが必要です。
          </p>
          
          <button 
            onClick={() => window.open('/marketing#pricing', '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            プランを確認
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

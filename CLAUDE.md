# Signs AI 開発ガイド

## サービス概要
組織の体温を可視化するBtoB SaaS。
KPI×アンケートをAIで分析し経営者向けに提案する。

## 技術スタック
- Next.js (App Router) + TypeScript
- Supabase (PostgreSQL + RLS)
- Claude API (AI診断)
- Vercel (ホスティング・CI/CD)

## 絶対に守るルール
- RLSは必ず get_my_company_id() 関数を使う
- 新テーブル追加時はRLSポリシーを必ず設定する
- kpi_records の onConflict は 'kpi_definition_id,recorded_month,department_id'（axis_idは不要）
- recorded_month は YYYY-MM-01 形式で保存
- survey_responses の recorded_month は YYYY-MM 形式
- エラー時はトースト表示（成功:緑 / 失敗:赤）

## ブランチ運用
- バグ修正: fix/xxxx
- 新機能: feature/xxxx
- mainへのマージ前にレビュー必須

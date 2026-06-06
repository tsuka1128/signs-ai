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
- kpi_records の onConflict は 'kpi_definition_id,recorded_month,department_id,axis_id'（axis_id=NULLが部署基本データ、axis_id=IDが第2軸データとして区別される）
- recorded_month は YYYY-MM-01 形式で保存
- survey_responses の recorded_month は YYYY-MM 形式
- エラー時はトースト表示（成功:緑 / 失敗:赤）

## DB変更ルール（厳守・乖離防止）
- **DBスキーマ変更（テーブル/カラム/制約/インデックス）は必ず `supabase/migrations/` にファイルを作成し、`supabase db push` で適用する**
- **Supabase SQL Editor での直接 ALTER / カラム追加 / 制約変更 / データ構造変更は禁止**（本番DBとmigrationの乖離を生むため）
- 変更後は `supabase db pull` で本番DBとローカルmigrationの差分がゼロであることを確認する
- AIプロンプト等の重要設定（system_settings）を変更した場合は、変更内容とJSON構造をPR説明に必ず記載する
- 緊急ホットフィックスでSQL Editorを使わざるを得なかった場合も、事後に必ず同内容のmigrationファイルを作成してコミットする

## ブランチ運用
- バグ修正: fix/xxxx
- 新機能: feature/xxxx
- mainへのマージ前にレビュー必須

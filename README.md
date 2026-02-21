# LLM GM ソロTRPG Webアプリ

LLMがGMとして **シナリオ生成とゲーム進行**を担う、**1人用（ソロ）**のTRPG Webアプリです。

## ドキュメント構成
仕様書は `docs/` 配下に配置します。

- `docs/game-spec.md`  
  ゲーム全体の仕様（概要、セッション構造、進行ループ、失敗時の扱い、終了条件、ゲーム内データの意味など）。  
  ※判定の数値設計・能力値/技能の詳細・UI詳細は含めません。:contentReference[oaicite:2]{index=2}

- `docs/mechanics-spec.md`  
  ゲームメカニクスの仕様（能力値/派生値、技能ポイント、技能一覧と初期値、判定方式（d100）、成功段階、失敗の代償など）。:contentReference[oaicite:3]{index=3}

- `docs/functional-spec.md`  
  **ゲーム全体の機能仕様**（セッション開始/終了、キャラ作成、シナリオ生成（outline/guidance）、チャット進行、判定の流れ、状態更新、ログ/要約、エラー時の扱い）を定義します。:contentReference[oaicite:4]{index=4}

- `docs/ui-spec.md`  
  UI要件の仕様（画面構成、チャット/選択肢/判定/ステータス/ログ等の要素、操作フロー、エラー表示、レスポンシブ方針）。:contentReference[oaicite:5]{index=5}

## Antigravityでの開発
- `docs/antigravity-instructions.md`  
  Antigravityに実装させるための指示書（React + AWS + Terraform + Bedrock、PhaseごとにPR、applyはユーザーが実施、Terraform差分PRにはplan/cost/approval必須）。:contentReference[oaicite:6]{index=6}

## ops（デプロイ前チェック）
Terraform差分がある変更では、デプロイ前に必ず更新・確認します（デプロイはユーザーが実施）。
- `ops/cost-estimate.md`：AWSコスト概算と前提（差分があれば必ず更新）
- `ops/deploy-approval.md`：デプロイ承認チェック（差分と承認内容）

## ライセンス
TBD
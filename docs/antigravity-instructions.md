# Antigravity 指示書（MVP実装 / React + AWS + Terraform + Bedrock）

## 目的
このリポジトリの `docs/` にある仕様書に従って、LLMがGMを行うソロTRPG WebアプリのMVPを実装する。  
フロントエンドはReactで実装し、AWS上で稼働させる。AWSリソースはTerraform（IaC）で管理する。LLMは Amazon Bedrock を利用する。

## 参照する仕様書（必読・優先順）
1. `docs/functional-spec.md`（機能・LLM入出力・状態・運用方針）
2. `docs/mechanics-spec.md`（CoC風メカニクス：能力値/技能/判定）
3. `docs/ui-spec.md`（画面要件）
4. `docs/game-spec.md`（体験の骨格）

仕様と矛盾する実装は行わない。仕様が足りない場合は、勝手に拡張せずIssueに質問事項を列挙する。

---

## 実装方針（重要）
- まず **縦スライスMVP** を完成させる（Start → Character → Play → Result）。
- 見た目より「フローが通ること」を優先する。
- LLM入出力は `functional-spec.md` の契約に従う。LLM応答は構造化（JSON）で扱う。
- AWSリソースは **Terraform** で管理する。
- **デプロイ（terraform apply / 実際のAWS反映）はユーザーが実施する。Antigravityは絶対に実行しない。**
- `ops/cost-estimate.md` にAWSリソースの月額コストの概算を記載し管理する。
- Terraformコードに変更が伴う場合は必ず `ops/cost-estimate.md` の概算を更新する（差分がある場合は更新必須）。

---

## GitHub運用（最低限）
- 変更はブランチで作業し、GitHubへpushしてPRを作成する（Antigravityが実施する）。
- PR本文に最低限以下を含める：
  - 何をしたか
  - 動作確認方法
  - （AWS変更がある場合）影響するTerraformリソースと `ops/cost-estimate.md` 更新有無
  - （AWS変更がある場合）ユーザーが実行すべきコマンド例（`terraform plan` など。applyは書いてもよいがAntigravityは実行しない）

---

## デプロイ前承認ルール（必須）
- Terraform差分が出る変更は、PRに以下を必ず含める：
  1) `ops/cost-estimate.md` の更新（今回の差分を反映）
  2) `ops/deploy-approval.md` の更新（差分と承認チェック）
  3) `terraform plan` の結果（貼り付け or ファイル化。機密はマスク）
- **ユーザー承認を得るまでデプロイは行わない（デプロイはユーザーが実施）。**

---

## まず作るもの（縦スライスMVPの範囲）
### 1) Start画面
- 「テーマ・雰囲気」をユーザーが自然言語で入力できる（任意、200文字目安）。
- 「はじめる」で Characterへ。

### 2) Character画面（CoC風）
- 能力値生成（ダイス）→ 派生値算出
- 職業/趣味技能ポイント表示
- 技能割り振り（技能一覧＋初期値を表示）
- 「確定して開始」で Playへ

### 3) Play画面（チャット）
- GM文表示、プレイヤー入力、送信
- choices があればボタン表示（2〜4）
- check_request があれば判定UIを表示し、d100ロール→結果をログ化→LLMへ送信
- state_patch があればアプリ側で検証して反映し、更新サマリを表示
- objective、主要リソース、所持品、重要フラグを状態パネルに表示

### 4) Result画面
- 結末種別、要約、獲得/喪失、最終状態を表示
- 「もう一度遊ぶ」でStartへ
- （任意）ログのコピー/ダウンロード

---

## LLM連携（Amazon Bedrock）
### 1) 方式
- フロントエンドからBedrockへ直接アクセスしない（権限をクライアントに置かない）。
- AWS側に **API（Backend）** を用意し、そこからBedrockを呼ぶ。
  - 例：API Gateway + Lambda（またはLambda Function URL）

### 2) Bedrockでのモデル呼び出し
- Bedrock Runtimeを使い、テキスト生成（会話進行）を行う。
- LLM出力は `functional-spec.md` に定義された構造（player_facing_text / choices / check_request / state_patch / end_signal）で返す。
- JSONが壊れた場合は、バックエンド側で1回リトライして整形を試みる（それでも失敗したらエラー応答）。

### 3) 権限（Terraformで管理）
- Lambda実行ロールに、Bedrock呼び出しに必要な権限を付与する（モデルIDは変数化）。
- 可能ならリージョンは固定する（Bedrockが利用可能なリージョン）。

---

## Terraform（AWS）方針
### 1) 最小構成（推奨）
- フロント：S3 + CloudFront（静的ホスティング）
- バックエンド：API Gateway + Lambda
- LLM：Amazon Bedrock（Lambdaから呼び出し）
- ログ：CloudWatch Logs

### 2) Terraformの成果物
- `infra/` 配下にTerraformコードを配置する
- 変数：リージョン、BedrockモデルID、環境名（dev/prodでも可）などを `variables.tf` で定義
- 出力：CloudFront URLやAPIエンドポイント等を `outputs.tf` で出す
- 機密情報はリポジトリに置かない（必要ならSSM/Secrets ManagerをTerraformで参照する）

### 3) ユーザーが実行するコマンド（参考）
Antigravityはコマンド例をREADME/opsに記載してよいが、実行はしない。
- `terraform init`
- `terraform plan`

---

## コスト概算ファイル（必須）
- `ops/cost-estimate.md` を作成し、月額の概算と前提を書く
  - CloudFront/S3、API Gateway、Lambda、CloudWatch Logs、Bedrock呼び出し回数の想定など
- Terraformに差分が出た場合、デプロイ前に必ず更新する

---

## 実装ステップ（順番）
> 各Phaseは「1つのPR」として完結させる。  
> 次Phaseに進む前に、必ずPRを作成し、差分と動作確認方法を記載する。

### Phase A：ローカルで縦スライス（LLMはスタブ）
**作業内容**
1. Reactで Start → Character → Play → Result を実装
2. LLM呼び出しはスタブ応答で動作させる（choices/check_request/state_patch/end_signalをテスト）

**PR（必須）**
- PRタイトル例：`Phase A: Frontend vertical slice (stub LLM)`
- PRに含めるもの：
  - 画面遷移が通ること
  - 判定UI（d100）とログ表示が動くこと
  - state_patch反映が動くこと
  - 動作確認手順（ローカル起動）

### Phase B：バックエンドAPI（ローカル動作確認）
**作業内容**
1. `server/`（または `backend/`）でLambda相当の処理を実装
2. Bedrock呼び出しは一旦モック可能にし、I/O契約を固定
3. フロント→バックエンド（ローカル）で、スタブの代わりにAPI経由で動くようにする

**PR（必須）**
- PRタイトル例：`Phase B: Backend API skeleton (mockable)`
- PRに含めるもの：
  - APIのI/O（functional-specの契約）を満たす
  - ローカルでの動作確認方法（curl等でも可）
  - フロントがAPIを叩けること（ローカル）

### Phase C：Terraform追加
**作業内容**
1. `infra/` にAWS構成をTerraformで定義（S3/CloudFront、API/Lambda、IAM、Logs）
2. `terraform init` / `terraform plan` で差分が見える状態にする（applyはユーザーが実施）
3. `ops/cost-estimate.md` と `ops/deploy-approval.md` を作成（または更新）

**PR（必須）**
- PRタイトル例：`Phase C: Terraform infrastructure (plan-only)`
- PRに含めるもの：
  - `infra/` 一式
  - `ops/cost-estimate.md`（概算＋前提）
  - `ops/deploy-approval.md`（承認チェック）
  - `terraform plan` 結果（貼り付け or ファイル、機密マスク）
  - ユーザーが実行するコマンド例（init/plan）

### Phase D：Bedrock接続
**作業内容**
1. LambdaからBedrock Runtimeを呼び、`functional-spec.md`の形式で返す
2. JSON不正時のリトライ/エラー応答を実装
3. 可能ならローカルでも動作確認できるように、Bedrock呼び出しを切替可能にする（env等）

**PR（必須）**
- PRタイトル例：`Phase D: Bedrock integration`
- PRに含めるもの：
  - Bedrock呼び出し実装
  - 必要なIAM権限（Terraform側）更新（差分があるなら plan を添付）
  - `ops/cost-estimate.md` 更新（Bedrock想定呼び出し回数/トークン前提の追記）
  - 動作確認方法（ローカル or デプロイ後確認手順の案内。applyはしない）

---

## 禁止事項
- 仕様にない機能（セーブ/再開、マルチ、長期キャンペーン）を追加しない
- UIを豪華にしすぎない（まずフロー優先）
- LLMの自由テキストのみで状態を更新しない（必ず state_patch を経由）
- outline を毎ターン送らない（節目のみ guidance）
- Antigravityが `terraform apply` やAWSデプロイを実行しない
- `ops/cost-estimate.md` を更新せずにデプロイ準備PRを作らない

---

## 完了条件（MVP）
- Start→Character→Play→Resultが一通り動く
- 判定UIが動き、結果がログに残る
- state_patchが反映され、状態パネルに表示が更新される
- スタブでもフローが成立し、Bedrock接続でも同様に動く
- TerraformでAWS構成を管理でき、plan結果とコスト概算を更新したPRを作成できる
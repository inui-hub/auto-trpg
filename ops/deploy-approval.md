# Deploy Approval Checklist

本ドキュメントは、AWS環境へのデプロイ（`terraform apply`）を実施する前に確認すべき事項をまとめたものです。

## 1. ビルドの確認
デプロイする前に、最新のソースコードがビルドされていることを確認してください。

- [ ] フロントエンドのビルドが成功していること
  ```bash
  npm run build
  ```
- [ ] バックエンドのビルドが成功し、Lambda用のzipファイルが生成可能であること
  *(Phase C時点ではまだデプロイパイプラインは構築していませんが、将来的な要件です)*

## 2. Terraform Plan の確認
インフラストラクチャの変更を適用する前に、どのようなリソースが作成・変更・削除されるかを確認してください。

- [ ] 以下のコマンドを実行し、意図せぬリソース削除（Destroy）が含まれていないか確認する
  ```bash
  cd infra
  terraform plan
  ```

## 3. 手動デプロイ手順 (仮)
現在自動デプロイ（CI/CD）は構築していません。以下の手動手順で適用します。

1. インフラの適用
   ```bash
   cd infra
   terraform apply
   ```
2. フロントエンドのアップロード (Terraform Apply成功後に S3 バケット名を確認して実行)
   ```bash
   aws s3 sync dist/ s3://[あなたのバケット名] --delete
   ```
3. CloudFrontのキャッシュ無効化 (必要に応じて)
   ```bash
   aws cloudfront create-invalidation --distribution-id [ディストリビューションID] --paths "/*"
   ```

## 4. 承認
上記すべての確認が終わった場合のみ、管理者（あなた）の責任において `terraform apply` を実行してください。

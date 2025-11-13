# React Frontend (Vite + TS)
## Setup
1. `npm i`
2. `.env` を作成（`.env.sample`コピー）し、`VITE_GAS_URL` に **GAS Web App URL** を設定。
3. `npm run dev` でローカル起動。

## Deploy (Vercel)
- Vercel プロジェクトを作成し、環境変数 `VITE_GAS_URL` を設定してデプロイ。
- 認証は GAS 側で **社内ドメイン限定** にしておくのが簡単です（Reactはそのまま叩くだけ）。

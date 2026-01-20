# Year-End Lottery Frontend

## Local Development

```bash
# 先啟動 backend（從專案根目錄執行）
./deploy.sh --backend-only

# 啟動 frontend dev server
pnpm install
pnpm dev        # http://localhost:3000
```

API proxy 自動讀取 `apps/backend/.env` 的 `LOTTERY_FORWARD_API_PORT`。

## Production

由根目錄 `deploy.sh` 處理，參見 `/README.md`。

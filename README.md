# Year-End Lottery

## Deployment

```bash
./deploy.sh              # 完整部署
./deploy.sh --backend-only  # 只部署 backend（前端本地開發用）
```

腳本會：
1. 啟動 backend Docker containers
2. 執行 database migrations
3. Build frontend（除非 `--backend-only`）
4. 設定 Nginx 並 reload（除非 `--backend-only`）

## Configuration

所有設定在 `apps/backend/.env`，複製 `.env.example` 開始：

```bash
cp apps/backend/.env.example apps/backend/.env
```

### 必填變數

| 變數 | 說明 | 範例 |
|------|------|------|
| `DOCKER_ENV` | dev 或 prod | `dev` |
| `DOCKER_SERVICES` | 要啟動的服務 | `api,data` |
| `LOTTERY_FORWARD_API_PORT` | API 對外 port | `8487` |

### DOCKER_SERVICES 選項

- `api` - Backend API container
- `data` - PostgreSQL container（本地開發用，prod 可連 RDS）

## Local Development

```bash
# 啟動 backend containers + DB
./deploy.sh --backend-only

# Frontend（另開 terminal）
cd apps/frontend && pnpm install && pnpm dev
```

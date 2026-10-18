#!/usr/bin/env bash
# pay-gateway 启动脚本（服务器上使用）
# 依赖 Node 20.6+（原生 --env-file 载入 .env，无需 dotenv）
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "❌ 未找到 .env，请先复制 .env.example 为 .env 并填入真实值"
  exit 1
fi

echo "▶ 启动 pay-gateway（前台）。Ctrl+C 停止；生产用 nohup/pm2 常驻。"
exec node --env-file=.env server.mjs

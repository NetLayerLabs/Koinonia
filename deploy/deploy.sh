#!/usr/bin/env bash
# Update the public demo: copy the code, build on the server, restart the service.
# Never copies .env files, saved data (server/data) or node_modules; the server keeps its own.
# Usage: deploy/deploy.sh [user@host]   (default root@38.49.213.208)
set -euo pipefail
HOST="${1:-root@38.49.213.208}"
DIR=/opt/koinonia
cd "$(dirname "$0")/.."

rsync -az --delete \
  --exclude node_modules --exclude dist --exclude video --exclude .git --exclude '*.tsbuildinfo' --exclude .DS_Store \
  --exclude '.env' --exclude '.env.local' --exclude '.env.*.local' --exclude 'server/data' \
  ./ "$HOST:$DIR/"

ssh "$HOST" "set -e; cd $DIR && npm ci --no-audit --no-fund >/dev/null && npm run build >/dev/null && systemctl restart koinonia && sleep 2 && systemctl is-active koinonia && curl -s http://127.0.0.1:8795/api/status"
echo

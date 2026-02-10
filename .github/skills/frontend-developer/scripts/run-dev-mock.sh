#!/usr/bin/env bash
# 本地启动 mock 服务示例（使用 json-server 或自定义 mock）
echo "Starting dev mock server..."
if command -v json-server >/dev/null 2>&1; then
  json-server --watch mock/db.json --port 4000
else
  echo "请安装 json-server：npm install -g json-server" >&2
fi

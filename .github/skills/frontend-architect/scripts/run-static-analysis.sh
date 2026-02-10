#!/usr/bin/env bash
echo "运行静态分析（示例）：eslint + typecheck"
if command -v npm >/dev/null 2>&1; then
  npm run lint || echo "请配置 package.json 中的 lint 脚本"
  npm run typecheck || echo "请配置 typecheck 脚本（tsc）"
else
  echo "请使用 npm/yarn 运行静态分析"
fi

#!/bin/bash

# 同时启动编辑器和 API 服务的脚本
# Usage: ./scripts/start-all.sh

echo "🚀 启动低代码编辑平台和 API 服务..."
echo ""

# 创建 data 目录（如果不存在）
if [ ! -d "./data" ]; then
    mkdir -p ./data
    echo "✓ 创建数据目录: ./data"
fi

# 启动编辑器（前台运行，以便可以看到日志）
echo "📦 启动编辑器 (端口 5556)..."
npm start &
EDITOR_PID=$!
echo "编辑器 PID: $EDITOR_PID"

echo ""
echo "⏳ 等待编辑器启动..."
sleep 3

# 启动 API 服务（后台运行）
echo "🔌 启动 API 服务 (端口 8080)..."
npm run storage-sync &
API_PID=$!
echo "API 服务 PID: $API_PID"

echo ""
echo "✓ 所有服务已启动！"
echo ""
echo "📍 编辑器地址: http://localhost:5556"
echo "📍 API 服务地址: http://localhost:8080"
echo ""
echo "按 Ctrl+C 停止所有服务..."
echo ""

# 等待用户中断
trap "kill $EDITOR_PID $API_PID 2>/dev/null; echo ''; echo '已停止所有服务'; exit" SIGINT SIGTERM

# 保持脚本运行
wait

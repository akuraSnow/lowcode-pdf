#!/bin/bash

# 快速启动脚本 - 安装依赖并启动服务

echo "🚀 启动低代码平台..."
echo ""

# 检查 Node.js 版本
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "📦 Node.js 版本: $NODE_VERSION"
echo ""

# 检查是否需要安装依赖
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📥 首次运行，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo ""
fi

# 检查端口是否被占用
check_port() {
    local PORT=$1
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  端口 $PORT 已被占用"
        return 1
    fi
    return 0
}

echo "🔍 检查端口..."
check_port 8000
FRONTEND_AVAILABLE=$?

check_port 8080
BACKEND_AVAILABLE=$?

if [ $FRONTEND_AVAILABLE -ne 0 ] || [ $BACKEND_AVAILABLE -ne 0 ]; then
    echo ""
    echo "请先停止占用这些端口的进程，或修改配置使用其他端口"
    exit 1
fi

echo "✅ 端口检查通过"
echo ""

# 启动服务
echo "🎬 启动服务..."
echo "   - 前端开发服务器: http://localhost:8000"
echo "   - 后端 API 服务器: http://localhost:8080"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

npm start

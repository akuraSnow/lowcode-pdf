#!/bin/bash

# 测试发布 API 的脚本
# 这个脚本会启动 API 服务，测试 /api/publish 端点，然后关闭服务

echo "🧪 发布 API 功能测试"
echo "======================"
echo ""

# 启动 API 服务
echo "📌 启动 API 服务..."
cd "$(dirname "$0")/.."
npm run storage-sync > /tmp/api-server.log 2>&1 &
API_PID=$!
echo "API 服务 PID: $API_PID"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 2

# 测试 API 健康状态
echo ""
echo "🔍 测试 API 健康检查..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "status"; then
    echo "✅ API 健康检查成功: $HEALTH_RESPONSE"
else
    echo "❌ API 健康检查失败"
    echo "   响应: $HEALTH_RESPONSE"
fi

# 测试发布端点
echo ""
echo "🔍 测试发布端点 (POST /api/publish)..."

TEST_PAYLOAD='{
  "path": "./data/test-publish.json",
  "schema": {
    "name": "Test Product",
    "version": "1.0.0"
  },
  "productId": "test-product-001",
  "productName": "Test Product"
}'

PUBLISH_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  http://localhost:3001/api/publish)

if echo "$PUBLISH_RESPONSE" | grep -q "success"; then
    echo "✅ 发布端点测试成功!"
    echo "   响应: $PUBLISH_RESPONSE"
    
    # 检查文件是否被创建
    if [ -f "./data/test-publish.json" ]; then
        echo "✅ 测试文件已创建: ./data/test-publish.json"
        # 显示文件内容
        echo ""
        echo "📄 文件内容预览:"
        head -c 200 "./data/test-publish.json"
        echo "..."
    else
        echo "⚠️  测试文件未创建"
    fi
else
    echo "❌ 发布端点测试失败"
    echo "   响应: $PUBLISH_RESPONSE"
fi

# 停止 API 服务
echo ""
echo "🛑 停止 API 服务..."
kill $API_PID 2>/dev/null
wait $API_PID 2>/dev/null

echo ""
echo "✅ 测试完成"
echo ""

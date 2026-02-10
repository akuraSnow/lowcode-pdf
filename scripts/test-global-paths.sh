#!/bin/bash

# 全局路径设置功能 - 快速测试脚本
# 用途: 快速验证全局路径设置功能是否正常工作

set -e

echo "======================================"
echo "全局路径设置功能 - 快速测试"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASS=0
FAIL=0

# 测试函数
test_step() {
    local description=$1
    echo -e "${YELLOW}测试:${NC} $description"
}

test_pass() {
    local message=$1
    echo -e "${GREEN}✓ PASS:${NC} $message"
    ((PASS++))
}

test_fail() {
    local message=$1
    echo -e "${RED}✗ FAIL:${NC} $message"
    ((FAIL++))
}

# 1. 检查构建产物
echo "1. 检查构建产物"
echo "--------------------------------"

test_step "检查 build/js/home.js 是否存在"
if [ -f "build/js/home.js" ]; then
    test_pass "build/js/home.js 存在"
else
    test_fail "build/js/home.js 不存在，请先运行 npm run build"
    exit 1
fi

test_step "检查 build/js/index.js 是否存在"
if [ -f "build/js/index.js" ]; then
    test_pass "build/js/index.js 存在"
else
    test_fail "build/js/index.js 不存在"
fi || true

test_step "检查 build/home.html 是否存在"
if [ -f "build/home.html" ]; then
    test_pass "build/home.html 存在"
else
    test_fail "build/home.html 不存在"
fi || true

echo ""

# 2. 检查源文件
echo "2. 检查源文件"
echo "--------------------------------"

test_step "检查 src/types/settings.ts 是否存在"
if [ -f "src/types/settings.ts" ]; then
    test_pass "settings.ts 类型文件存在"
else
    test_fail "settings.ts 类型文件不存在"
fi

test_step "检查 src/stores/globalSettingsStore.ts 是否存在"
if [ -f "src/stores/globalSettingsStore.ts" ]; then
    test_pass "globalSettingsStore.ts Store文件存在"
else
    test_fail "globalSettingsStore.ts Store文件不存在"
fi

test_step "检查 src/components/GlobalSettingsModal/index.tsx 是否存在"
if [ -f "src/components/GlobalSettingsModal/index.tsx" ]; then
    test_pass "GlobalSettingsModal 组件存在"
else
    test_fail "GlobalSettingsModal 组件不存在"
fi

echo ""

# 3. 检查代码内容
echo "3. 检查代码修改"
echo "--------------------------------"

test_step "检查 Product 类型是否移除了 savePath"
if grep -q "savePath" "src/types/product.ts" 2>/dev/null; then
    test_fail "Product 类型仍包含 savePath 字段（应该已移除）"
else
    test_pass "Product 类型已移除 savePath 字段"
fi

test_step "检查 ProductHomePage 是否导入了 GlobalSettingsModal"
if grep -q "GlobalSettingsModal" "src/components/ProductHomePage/index.tsx" 2>/dev/null; then
    test_pass "ProductHomePage 已导入 GlobalSettingsModal"
else
    test_fail "ProductHomePage 未导入 GlobalSettingsModal"
fi

test_step "检查 publish 插件是否使用了全局设置"
if grep -q "getGlobalSettings" "src/plugins/plugin-publish/index.tsx" 2>/dev/null; then
    test_pass "publish 插件已使用 getGlobalSettings"
else
    test_fail "publish 插件未使用 getGlobalSettings"
fi

echo ""

# 4. 创建测试目录
echo "4. 创建测试目录"
echo "--------------------------------"

test_step "创建 ./test-output/products 测试目录"
mkdir -p ./test-output/products 2>/dev/null
if [ -d "./test-output/products" ]; then
    test_pass "测试目录创建成功"
else
    test_fail "测试目录创建失败"
fi

echo ""

# 5. 检查 API 服务器
echo "5. 检查 API 服务器"
echo "--------------------------------"

test_step "检查 server/api-server.js 是否存在"
if [ -f "server/api-server.js" ]; then
    test_pass "API 服务器文件存在"
else
    test_fail "API 服务器文件不存在"
fi

test_step "检查 API 端口 3001 是否被占用"
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    test_pass "API 服务器已在端口 3001 上运行"
    API_RUNNING=true
else
    test_fail "API 服务器未在端口 3001 上运行"
    echo "   提示: 运行 'node server/api-server.js' 启动 API 服务器"
    API_RUNNING=false
fi

echo ""

# 6. 检查编辑器服务
echo "6. 检查编辑器服务"
echo "--------------------------------"

test_step "检查编辑器端口 5556 是否被占用"
if lsof -Pi :5556 -sTCP:LISTEN -t >/dev/null 2>&1; then
    test_pass "编辑器已在端口 5556 上运行"
    EDITOR_RUNNING=true
else
    test_fail "编辑器未在端口 5556 上运行"
    echo "   提示: 运行 'npm run start' 启动编辑器"
    EDITOR_RUNNING=false
fi

echo ""

# 7. 文档检查
echo "7. 检查文档"
echo "--------------------------------"

test_step "检查使用指南文档"
if [ -f "GLOBAL_PATH_SETTINGS_GUIDE.md" ]; then
    test_pass "使用指南文档存在"
else
    test_fail "使用指南文档不存在"
fi

test_step "检查测试指南文档"
if [ -f "TEST_GLOBAL_SETTINGS.md" ]; then
    test_pass "测试指南文档存在"
else
    test_fail "测试指南文档不存在"
fi

test_step "检查实施总结文档"
if [ -f "IMPLEMENTATION_SUMMARY_GLOBAL_PATHS.md" ]; then
    test_pass "实施总结文档存在"
else
    test_fail "实施总结文档不存在"
fi

echo ""

# 总结
echo "======================================"
echo "测试总结"
echo "======================================"
echo -e "${GREEN}通过:${NC} $PASS"
echo -e "${RED}失败:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    echo ""
    echo "下一步操作:"
    
    if [ "$API_RUNNING" = false ] || [ "$EDITOR_RUNNING" = false ]; then
        echo "1. 启动服务:"
        if [ "$API_RUNNING" = false ]; then
            echo "   - API: node server/api-server.js"
        fi
        if [ "$EDITOR_RUNNING" = false ]; then
            echo "   - 编辑器: npm run start"
        fi
        echo "   或使用一键启动: ./scripts/start-all.sh"
        echo ""
    fi
    
    echo "2. 打开浏览器测试功能:"
    echo "   - 主页: http://localhost:5556/home.html"
    echo "   - 点击'全局设置'按钮"
    echo "   - 配置路径并保存"
    echo "   - 创建产品并测试发布"
    echo ""
    echo "3. 查看详细测试步骤:"
    echo "   cat TEST_GLOBAL_SETTINGS.md"
    echo ""
    
    exit 0
else
    echo -e "${RED}✗ 存在失败的测试，请检查${NC}"
    echo ""
    echo "常见问题:"
    echo "1. 如果构建文件不存在，运行: npm run build"
    echo "2. 如果源文件不存在，检查是否正确创建了文件"
    echo "3. 如果服务未运行，使用: ./scripts/start-all.sh"
    echo ""
    exit 1
fi

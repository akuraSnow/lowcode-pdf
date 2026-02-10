#!/bin/bash

# 数据同步服务启动脚本
# 用法: ./scripts/start-storage-sync.sh [保存路径]

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Lowcode 数据同步服务启动器${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 Node.js${NC}"
    echo -e "${YELLOW}请先安装 Node.js: https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"

# 检查依赖是否安装
if [ ! -d "node_modules/express" ] || [ ! -d "node_modules/cors" ]; then
    echo -e "${YELLOW}⚠️  检测到缺少依赖，正在安装...${NC}"
    npm install express cors
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
fi

# 设置保存路径
if [ -n "$1" ]; then
    SAVE_PATH="$1"
    echo -e "${GREEN}✓ 使用自定义保存路径: ${SAVE_PATH}${NC}"
else
    SAVE_PATH="$(pwd)/data"
    echo -e "${GREEN}✓ 使用默认保存路径: ${SAVE_PATH}${NC}"
fi

# 创建保存目录
mkdir -p "$SAVE_PATH"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 保存目录已就绪${NC}"
else
    echo -e "${RED}❌ 无法创建保存目录${NC}"
    exit 1
fi

# 设置端口
PORT=${PORT:-3001}
echo -e "${GREEN}✓ 服务端口: ${PORT}${NC}"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🚀 正在启动服务...${NC}"
echo -e "${BLUE}========================================${NC}"

# 启动服务
SAVE_PATH="$SAVE_PATH" PORT="$PORT" node server/api-server.js

# 捕获 Ctrl+C
trap 'echo -e "\n${YELLOW}⚠️  服务已停止${NC}"; exit 0' INT

#!/bin/bash

# 安装后端Word转PDF所需依赖

echo "=========================================="
echo "安装Word转PDF功能依赖"
echo "=========================================="

# 安装Node.js依赖
echo ""
echo "1. 安装Node.js依赖 (express, cors, multer)..."
npm install express cors multer

# 检查LibreOffice安装
echo ""
echo "2. 检查LibreOffice安装..."

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  if [ -d "/Applications/LibreOffice.app" ]; then
    echo "✓ LibreOffice已安装"
  else
    echo "⚠ LibreOffice未安装"
    echo ""
    echo "请安装LibreOffice："
    echo "  方式1: brew install --cask libreoffice"
    echo "  方式2: 访问 https://www.libreoffice.org/download/"
  fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  if command -v libreoffice &> /dev/null; then
    echo "✓ LibreOffice已安装"
  else
    echo "⚠ LibreOffice未安装"
    echo ""
    echo "请安装LibreOffice："
    echo "  Ubuntu/Debian: sudo apt-get install libreoffice"
    echo "  CentOS/RHEL: sudo yum install libreoffice"
  fi
else
  echo "⚠ Windows系统请手动安装LibreOffice"
  echo "  下载地址: https://www.libreoffice.org/download/"
fi

echo ""
echo "=========================================="
echo "安装完成！"
echo "=========================================="
echo ""
echo "启动服务："
echo "  npm start          # 同时启动前后端"
echo "  npm run dev:backend # 仅启动后端API服务"
echo ""
echo "Word转PDF API地址："
echo "  POST http://localhost:8080/api/convert/word-to-pdf"
echo ""

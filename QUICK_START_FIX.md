# 🚀 快速启动指南

## 📌 问题已解决！

**修复内容**: 发布功能 404 错误 (localhost:8000 → localhost:3001)

```
❌ 之前: POST http://localhost:8000/api/publish 404
✅ 现在: POST http://localhost:3001/api/publish 200 OK
```

---

## ⚡ 快速开始（3 步）

### 1️⃣ 一条命令启动所有服务
```bash
./scripts/start-all.sh
```

**输出**:
```
🚀 启动低代码编辑平台和 API 服务...
✓ 创建数据目录: ./data
📦 启动编辑器 (端口 5556)...
🔌 启动 API 服务 (端口 3001)...
✓ 所有服务已启动！
📍 编辑器地址: http://localhost:5556
📍 API 服务地址: http://localhost:3001
```

### 2️⃣ 打开编辑器
```
打开浏览器访问: http://localhost:5556
```

### 3️⃣ 测试发布功能
```
1. 选择一个产品 → 点击"编辑"
2. 在编辑器中进行修改（可选）
3. 点击顶部右侧"发布"按钮
4. 在弹窗中点击"确认"
5. ✅ 看到成功提示："发布成功！文件已保存到..."
6. 文件保存在: ./data/
```

---

## 🔧 分别启动（用于开发调试）

### 终端 1: 启动编辑器
```bash
npm start
# 编辑器: http://localhost:5556
```

### 终端 2: 启动 API 服务
```bash
npm run storage-sync
# API: http://localhost:3001
```

---

## 🧪 验证功能

### 自动测试
```bash
./scripts/test-publish-api.sh
```

输出应该显示：
```
✅ API 健康检查成功
✅ 发布端点测试成功!
✅ 测试文件已创建
```

### 手动测试
```bash
# 测试 API 健康状态
curl http://localhost:3001/api/health

# 测试发布端点
curl -X POST http://localhost:3001/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "path": "./data/test.json",
    "schema": {"name": "test"},
    "productId": "test-001",
    "productName": "Test"
  }'
```

---

## 📋 核心 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/publish` | 发布产品（保存到文件系统） |
| POST | `/api/storage/save` | 保存浏览器数据到文件系统 |
| GET | `/api/storage/list` | 列出已保存的文件 |
| GET | `/api/health` | 健康检查 |

**基础地址**: `http://localhost:3001`

---

## 🗂️ 项目结构概览

```
demo-general/
├── src/                           # 编辑器源代码
│   └── plugins/
│       └── plugin-publish/
│           └── index.tsx          # ✅ 已修复（使用 localhost:3001）
├── server/
│   └── api-server.js              # ✅ API 服务（端口 3001）
├── scripts/
│   ├── start-all.sh               # ✅ 一键启动脚本
│   └── test-publish-api.sh        # ✅ 测试脚本
├── data/                          # 📁 保存的文件目录
│   ├── products/
│   ├── projectSchema/
│   ├── templates/
│   └── test-publish.json          # ✅ 测试文件
└── build/                         # 🔨 构建输出
```

---

## 🔍 常见问题

### Q: 如何停止所有服务？
**A**: 按 `Ctrl+C` 即可停止

### Q: 如何更改端口？
**A**: 
- 编辑器端口: `npm start -- --port 8000`
- API 端口: `PORT=3002 npm run storage-sync`

### Q: 文件保存在哪里？
**A**: `./data/` 目录中

### Q: 能否改变保存路径？
**A**: 是的，在发布时通过产品的 `savePath` 属性控制

### Q: 发布失败怎么办？
**A**: 检查：
1. ✅ API 服务是否在 3001 运行
2. ✅ `./data/` 目录是否存在
3. ✅ 浏览器控制台错误信息

---

## 📊 修复内容总结

| 修改 | 文件 | 状态 |
|------|------|------|
| 修正 API URL | `src/plugins/plugin-publish/index.tsx` | ✅ |
| 添加启动脚本 | `scripts/start-all.sh` | ✅ |
| 添加测试脚本 | `scripts/test-publish-api.sh` | ✅ |
| 重新编译 | `npm run build` | ✅ |
| 创建文档 | 多个 .md 文件 | ✅ |

---

## ✨ 功能流程示意

```
编辑器 (localhost:5556)
     ↓
  用户点击"发布"
     ↓
  获取产品信息
     ↓
  显示确认弹窗
     ↓
  用户确认
     ↓
  发送 POST 请求
     ↓
API 服务 (localhost:3001) ← POST /api/publish
     ↓
  保存到文件系统
     ↓
  返回成功响应
     ↓
  显示成功提示
     ↓
  文件保存在 ./data/
```

---

## 🎯 下一步

1. **使用统一启动脚本**: `./scripts/start-all.sh`
2. **打开浏览器**: `http://localhost:5556`
3. **测试发布功能**: 点击发布按钮
4. **查看保存的文件**: `./data/` 目录

---

**文档更新**: 2026-02-10  
**状态**: ✅ 生产就绪  
**测试**: ✅ 已验证

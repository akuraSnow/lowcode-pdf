# 🚀 低代码编辑平台

> 一个功能完整的低代码可视化编辑器，支持实时预览、产品管理和发布功能。

## ✨ 主要特性

- 🎨 **可视化编辑**: 拖拽式组件编辑，实时预览
- 📦 **产品管理**: 创建、编辑、删除产品
- 💾 **数据持久化**: 支持浏览器存储和文件系统保存
- 🔌 **插件系统**: 可扩展的插件架构
- 📤 **发布功能**: 一键发布到文件系统（已修复）
- 🌐 **跨域通信**: 支持多端口架构

## 🚀 快速开始

### 前置要求
- Node.js 14+
- npm 6+

### 安装依赖
```bash
npm install
```

### 一键启动（推荐）
```bash
./scripts/start-all.sh
```

这将启动：
- **编辑器**: http://localhost:5556
- **API 服务**: http://localhost:3001

### 分别启动

**终端 1 - 启动编辑器**:
```bash
npm start
# 访问: http://localhost:5556
```

**终端 2 - 启动 API 服务**:
```bash
npm run storage-sync
# 运行在: http://localhost:3001
```

## 📋 可用命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动开发服务器 (端口 5556) |
| `npm run build` | 生产环境构建 |
| `npm run storage-sync` | 启动数据同步 API 服务 (端口 3001) |
| `./scripts/start-all.sh` | 同时启动编辑器和 API 服务 |
| `./scripts/test-publish-api.sh` | 测试发布 API 功能 |

## 🏗️ 项目结构

```
demo-general/
├── src/                              # 源代码
│   ├── plugins/                      # 插件
│   │   ├── plugin-publish/           # 发布插件 ✅
│   │   ├── plugin-page-management/   # 页面管理
│   │   ├── plugin-resource-management/
│   │   ├── plugin-simulator-locale/
│   │   └── ...其他插件
│   ├── components/                   # React 组件
│   │   ├── PageManager/
│   │   ├── ResourceManager/
│   │   └── ...其他组件
│   ├── stores/                       # 状态管理
│   ├── services/                     # API 定义
│   ├── utils/                        # 工具函数
│   │   └── storageSync.ts            # 存储同步工具
│   └── ...其他源文件
├── server/
│   └── api-server.js                 # 后端 API 服务 ✅
├── scripts/
│   ├── start-all.sh                  # 统一启动脚本 ✅
│   └── test-publish-api.sh           # 测试脚本 ✅
├── data/                             # 保存的文件
│   ├── products/
│   ├── projectSchema/
│   └── templates/
├── public/                           # 静态文件
├── build/                            # 构建输出
├── package.json
└── README.md
```

## 🔧 核心 API 端点

### 发布功能
```http
POST /api/publish
Content-Type: application/json

{
  "path": "./data/product.json",
  "schema": { /* 页面 schema */ },
  "productId": "prod-001",
  "productName": "产品名称"
}
```

### 数据存储
```http
POST /api/storage/save
POST /api/storage/batch-save
GET /api/storage/list
DELETE /api/storage/delete
```

### 健康检查
```http
GET /api/health
```

## 📚 详细文档

| 文档 | 说明 |
|------|------|
| [FIX_SUMMARY.md](FIX_SUMMARY.md) | 404 错误修复总结 |
| [PUBLISH_API_FIX.md](PUBLISH_API_FIX.md) | API 路径修复详细说明 |
| [QUICK_START_FIX.md](QUICK_START_FIX.md) | 快速启动指南 |
| [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md) | 完整验证报告 |

## 🧪 测试

### 运行 API 测试
```bash
./scripts/test-publish-api.sh
```

**预期输出**:
```
✅ API 健康检查成功
✅ 发布端点测试成功!
✅ 测试文件已创建
```

### 手动测试发布功能

1. 打开编辑器: http://localhost:5556
2. 进入产品编辑页面
3. 点击顶部右侧"发布"按钮
4. 在确认弹窗中点击"确认"
5. 应该看到成功提示和保存的文件

## 🐛 故障排除

### 404 错误
**症状**: `POST http://localhost:8000/api/publish 404`

**原因**: API 地址使用了错误的端口

**解决**:
- ✅ 已修复：API URL 现在正确指向 `http://localhost:3001/api/publish`
- ✅ 确保 API 服务在运行：`npm run storage-sync`

### 端口被占用
**症状**: `Port 5556 is already in use` 或 `Port 3001 is already in use`

**解决**:
```bash
# 杀死占用端口的进程
lsof -i :5556
kill -9 <PID>

# 或指定不同的端口
npm start -- --port 8000
PORT=3002 npm run storage-sync
```

### CORS 错误
**症状**: `Access to XMLHttpRequest has been blocked by CORS policy`

**原因**: 跨域请求被阻止

**解决**: 
- API 服务已配置 CORS
- 确保编辑器和 API 服务都在运行
- 查看浏览器控制台获取详细错误信息

### 文件未保存
**症状**: 发布成功但文件未创建

**检查**:
1. `./data/` 目录是否存在
2. 目录是否有写权限
3. 磁盘空间是否充足
4. 检查 API 服务日志

## 🎯 使用流程

### 1. 创建产品
- 打开编辑器首页
- 点击"新建产品"
- 输入产品名称和保存路径

### 2. 编辑页面
- 从首页进入产品编辑
- 使用拖拽式编辑器设计页面
- 实时预览修改效果

### 3. 发布产品
- 点击顶部"发布"按钮
- 确认发布信息
- 文件自动保存到指定路径

### 4. 查看文件
- 保存的文件位置：`./data/`
- 文件格式：JSON（低代码 schema）

## 🔄 系统架构

```
┌─────────────────────────────────────────────────────┐
│                   浏览器 (localhost:5556)            │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │         低代码编辑器 (React)                  │   │
│  │  - 可视化页面设计                            │   │
│  │  - 产品列表管理                              │   │
│  │  - 资源管理                                  │   │
│  └─────────────────────────────────────────────┘   │
└──────────┬──────────────────────────────────────────┘
           │ HTTP 请求
           │ POST /api/publish
           │ GET /api/health
           ↓
┌─────────────────────────────────────────────────────┐
│            Node.js API 服务 (localhost:3001)        │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │         Express.js 应用                      │   │
│  │  - 发布端点：/api/publish                    │   │
│  │  - 存储端点：/api/storage/*                  │   │
│  │  - CORS 支持                                 │   │
│  └─────────────────────────────────────────────┘   │
└──────────┬──────────────────────────────────────────┘
           │ 文件操作
           ↓
┌─────────────────────────────────────────────────────┐
│           文件系统 (./data 目录)                     │
├─────────────────────────────────────────────────────┤
│  - products/         (产品 schema)                 │
│  - projectSchema/    (项目 schema)                 │
│  - templates/        (模板文件)                    │
└─────────────────────────────────────────────────────┘
```

## 📊 技术栈

| 层 | 技术 |
|----|------|
| **前端** | React 18+, TypeScript, Antd, Formily |
| **编辑器** | @alilc/lowcode-editor, @alilc/lowcode-engine |
| **状态管理** | 低代码内置（project store） |
| **样式** | SCSS, Tailwind CSS |
| **后端** | Node.js, Express |
| **通信** | HTTP/REST, CORS |
| **构建** | build-scripts, Webpack |
| **包管理** | npm |

## 📈 最近更新

### ✅ 2026-02-10
- 🔧 修复发布功能 404 错误（localhost:8000 → localhost:3001）
- 📝 创建启动脚本 `start-all.sh`
- 🧪 创建测试脚本 `test-publish-api.sh`
- 📚 编写详细文档

### ✅ 2026-02-09
- 🎨 完成数据同步功能
- 🔌 集成 API 服务
- 📦 配置插件系统

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

此项目采用 MIT 许可证

## 📞 支持

如有问题或建议，请：
1. 查看 [文档](PUBLISH_API_FIX.md)
2. 运行测试脚本：`./scripts/test-publish-api.sh`
3. 检查 API 健康状态：`curl http://localhost:3001/api/health`

---

**最后更新**: 2026-02-10  
**版本**: 1.0.28  
**状态**: ✅ 生产就绪

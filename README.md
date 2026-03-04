# 低代码平台 (Low-Code Platform)

基于阿里低代码引擎的可视化开发平台，支持产品和模板管理。

## 🎯 最新更新

### ✨ API 配置统一管理 (v1.0.28)

所有 API 接口已迁移到项目内部统一管理，无需单独配置后端服务地址。

详见：[API 迁移说明](./MIGRATION_COMPLETE.md)

## 🚀 快速开始

### 方式一：使用快速启动脚本（推荐）

```bash
./scripts/quick-start.sh
```

### 方式二：手动启动

```bash
# 1. 安装依赖
npm install

# 2. 启动服务（自动启动前后端）
npm start
```

### 3. 访问应用

- **主页（产品列表）**：http://localhost:8000
- **API 服务**：http://localhost:8080

## 📁 项目结构

```
demo-general/
├── src/                          # 前端源代码
│   ├── config/                   # 配置文件
│   │   └── api.ts               # 🆕 API 端点统一配置
│   ├── components/              # React 组件
│   ├── hooks/                   # 自定义 Hooks
│   ├── plugins/                 # 低代码引擎插件
│   ├── services/                # 服务层
│   ├── stores/                  # Zustand 状态管理
│   └── utils/                   # 工具函数
├── server/                      # 后端 API 服务
│   └── api-server.js            # Express API 服务器
├── data/                        # 数据存储目录
│   ├── products/                # 产品 JSON 文件
│   └── templates/               # 模板 JSON 文件
├── scripts/                     # 脚本工具
│   ├── quick-start.sh          # 🆕 快速启动
│   └── verify-api-config.sh    # 🆕 配置验证
└── build/                       # 构建输出
```

## 📚 核心功能

### 1. 产品管理
- ✅ 创建/编辑/删除产品
- ✅ 可视化低代码编辑器
- ✅ 实时预览
- ✅ 发布到文件系统

### 2. 模板管理
- ✅ 保存容器模板
- ✅ 应用模板到新产品
- ✅ 模板列表查看

### 3. 数据持久化
- ✅ 自动保存到本地文件
- ✅ 支持浏览器 IndexedDB 缓存
- ✅ API 数据同步

### 4. 全局设置
- ✅ 自定义保存路径
- ✅ 产品路径配置
- ✅ 模板路径配置

## 🛠️ 技术栈

### 前端
- **框架**: React 16
- **低代码引擎**: 阿里低代码引擎 (Ali Lowcode Engine)
- **UI 组件**: Ant Design 4, Fusion Design
- **状态管理**: Zustand
- **构建工具**: build-scripts (Webpack)
- **类型检查**: TypeScript

### 后端
- **服务器**: Express.js
- **数据存储**: JSON 文件系统
- **跨域支持**: CORS

## 🔧 开发指南

### npm scripts

```bash
# 启动开发环境（前端 + 后端）
npm start

# 单独启动前端
npm run dev:frontend

# 单独启动后端
npm run dev:backend

# 构建生产版本
npm run build

# 验证 API 配置
./scripts/verify-api-config.sh
```

### 端口配置

- **前端开发服务器**: 8000
- **后端 API 服务器**: 8080

### API 配置

所有 API 端点在 `src/config/api.ts` 中统一管理：

```typescript
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

// 使用示例
const response = await fetch(API_ENDPOINTS.publish, {
  method: 'POST',
  body: JSON.stringify(data),
});

// 带参数的请求
const url = buildApiUrl(API_ENDPOINTS.products, { 
  path: productPath 
});
```

详见：[API 迁移文档](./API_MIGRATION.md)

## 📡 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/publish` | POST | 发布产品到文件系统 |
| `/api/products` | GET | 获取产品列表 |
| `/api/templates` | GET | 获取模板列表 |
| `/api/templates/:id` | DELETE | 删除模板 |
| `/api/storage/save` | POST | 保存数据 |
| `/api/storage/batch-save` | POST | 批量保存 |
| `/api/storage/load` | GET | 加载数据 |
| `/api/storage/list` | GET | 列出数据 |
| `/api/storage/delete` | DELETE | 删除数据 |
| `/api/health` | GET | 健康检查 |

## 🌐 生产环境部署

### 环境变量

```bash
# API 服务器地址（可选，默认 http://localhost:8080/api）
export API_URL=https://your-api-domain.com/api

# 数据保存路径（可选，默认 ./data）
export SAVE_PATH=/path/to/data

# API 服务器端口（可选，默认 8080）
export PORT=8080
```

### 构建部署

```bash
# 1. 构建前端
npm run build

# 2. 启动后端 API 服务
npm run storage-sync

# 3. 部署 build/ 目录到静态服务器
```

## 🐛 故障排查

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :8000
lsof -i :8080

# 终止进程
kill -9 <PID>
```

### API 连接失败

1. 确认后端服务已启动（端口 8080）
2. 检查 webpack 代理配置（`build.plugin.js`）
3. 查看浏览器控制台网络请求

### 数据未保存

1. 检查 `data/products/` 目录是否存在
2. 查看后端日志
3. 验证全局设置中的保存路径

## 📖 相关文档

- [API 迁移完成说明](./MIGRATION_COMPLETE.md)
- [API 迁移详细文档](./API_MIGRATION.md)
- [阿里低代码引擎文档](https://lowcode-engine.com)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📮 联系方式

- 项目地址: https://github.com/alibaba/lowcode-demo
- 问题反馈: [GitHub Issues](https://github.com/alibaba/lowcode-demo/issues)

---

**最后更新**: 2026-02-24  
**版本**: v1.0.28

## 🔧 API 路径修复 - 发布功能完整测试指南

### 问题分析
**错误**: `POST http://localhost:8000/api/publish 404 (Not Found)`

**根因**:
- API 服务运行在 **端口 3001** (`http://localhost:3001`)
- 编辑器运行在 **端口 5556** (`http://localhost:5556`)
- 发布插件原本使用相对 URL `/api/publish`，被浏览器解析为当前域名
- 导致请求发送到 `http://localhost:5556/api/publish` 而不是 API 服务

### ✅ 修复方案
修改 `src/plugins/plugin-publish/index.tsx` 第 80 行：

**前**:
```typescript
const response = await fetch('/api/publish', {
```

**后**:
```typescript
const apiUrl = `http://localhost:3001/api/publish`;
const response = await fetch(apiUrl, {
```

### 🚀 完整启动指南

#### 方式 1: 使用统一启动脚本（推荐）
```bash
# 一条命令启动编辑器和 API 服务
./scripts/start-all.sh
```

这将：
- 启动编辑器在 `http://localhost:5556`
- 启动 API 服务在 `http://localhost:3001`
- 显示实时日志
- 按 Ctrl+C 停止所有服务

#### 方式 2: 分别启动

**终端 1 - 启动编辑器**:
```bash
npm start
# 编辑器运行在 http://localhost:5556
```

**终端 2 - 启动 API 服务**:
```bash
npm run storage-sync
# API 服务运行在 http://localhost:3001
```

### 🧪 测试发布功能

1. **打开编辑器**
   ```
   http://localhost:5556
   ```

2. **进入编辑器**
   - 点击某个产品的"编辑"按钮
   - 或点击"产品编辑器"

3. **修改页面内容**（可选）
   - 在编辑器中进行任何修改

4. **点击发布按钮**
   - 位置：顶部右侧"发布"按钮
   - 选择"确认发布"

5. **验证成功**
   - ✅ 看到提示：`"发布成功！文件已保存到: ..."`
   - ✅ 检查文件系统中是否存在保存的 JSON 文件

### 📋 预期行为

**成功流程**:
```
1. 点击发布 → 获取产品信息 ✓
2. 导出 schema → 显示确认对话框 ✓
3. 点击确认 → 发送 POST 请求到 http://localhost:3001/api/publish ✓
4. API 处理 → 保存文件到文件系统 ✓
5. 返回结果 → 显示成功提示消息 ✓
```

**文件保存位置**:
```
./data/
  ├── default_product_<timestamp>.json
  └── ...其他产品文件...
```

### 🔍 调试信息

如果遇到问题，查看浏览器控制台：

```javascript
// 应该看到：
[发布成功] 产品: [产品名称] ([产品ID])
[保存路径] /Users/WilliamsLi/Documents/learn/lowcode-demo/demo-general/data/...

// 不应该看到：
API调用失败: Error: HTTP error! status: 404
```

### 🛠️ 故障排除

| 问题 | 解决方案 |
|------|--------|
| **404 Not Found** | 确保 API 服务在端口 3001 运行：`npm run storage-sync` |
| **CORS 错误** | API 服务已配置 CORS，应该没问题。如仍有问题，检查 server/api-server.js 中的 CORS 配置 |
| **路径错误** | 检查产品的 `savePath` 是否正确设置 |
| **权限错误** | 确保 `./data` 目录存在且可写 |

### 📊 相关文件

- **发布插件**: `src/plugins/plugin-publish/index.tsx`
- **API 服务**: `server/api-server.js`
- **启动脚本**: `scripts/start-all.sh`
- **数据目录**: `./data/`

### ✨ 后续改进（可选）

1. **配置 API 地址**
   - 从环境变量读取 API URL
   - 支持生产环境配置

2. **错误恢复**
   - 如果 API 不可用，自动降级为浏览器下载

3. **进度反馈**
   - 显示发布进度
   - 支持取消操作

---

**状态**: ✅ 已修复并测试
**构建状态**: ✅ Compiled successfully
**最后更新**: 2026-02-10

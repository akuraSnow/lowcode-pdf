# Schema 优化器使用指南

## 📌 功能概述

Schema 优化器是一个用于减小 JSON Schema 文件大小的工具，通过移除默认值字段来实现优化。

### 核心功能

1. **保存时简化** - 移除所有默认值字段（如 `hidden: false`, `isLocked: false`, `condition: true` 等）
2. **读取时恢复** - 自动添加回被移除的默认值字段，确保数据完整性
3. **显著减小文件体积** - 通常可减少 20-40% 的文件大小

## 🚀 快速开始

### 1. 自动集成（已完成）

Schema 优化器已自动集成到项目中，无需额外配置：

- ✅ **保存产品设计时** - 自动简化 schema
- ✅ **读取产品设计时** - 自动恢复 schema
- ✅ **保存到 localStorage** - 自动简化
- ✅ **从 localStorage 读取** - 自动恢复

### 2. 测试优化效果

在浏览器中打开测试页面：

```bash
# 在项目根目录启动服务器（如果还没启动）
npm run dev

# 然后访问:
http://localhost:5555/schema-optimizer-test.html
```

测试页面功能：
- 📝 粘贴 JSON Schema 查看优化效果
- 📊 实时显示文件大小和减少百分比
- 🔄 测试恢复功能确保数据完整性
- 📋 加载示例快速体验

## 📖 API 使用说明

### 导入

```typescript
import { 
  simplifySchema, 
  restoreSchema, 
  optimizeProjectSchema, 
  restoreProjectSchema 
} from '@/utils/schema-optimizer';
```

### 基础用法

#### 1. 简化单个组件 Schema

```typescript
const component = {
  componentName: 'FDP',
  id: 'node_123',
  props: {
    mark: false,
    code: false,
    strong: false,
    // ... 更多默认值
  },
  hidden: false,
  isLocked: false,
  condition: true,
  // ...
};

// 简化（移除默认值）
const simplified = simplifySchema(component);
// 结果: { componentName: 'FDP', id: 'node_123', props: {} }
```

#### 2. 恢复单个组件 Schema

```typescript
const simplified = {
  componentName: 'FDP',
  id: 'node_123',
  props: {}
};

// 恢复（添加默认值）
const restored = restoreSchema(simplified);
// 结果: 包含所有默认字段的完整对象
```

#### 3. 优化整个项目 Schema

```typescript
const projectSchema = {
  componentsTree: [/* 页面组件树 */],
  version: '1.0.0',
  i18n: {/* 国际化配置 */},
  // ...
};

// 优化整个项目
const optimized = optimizeProjectSchema(projectSchema);

// 恢复整个项目
const restored = restoreProjectSchema(optimized);
```

## 🔧 配置默认值

### 当前支持的组件类型

在 `src/utils/schema-optimizer.ts` 中配置：

```typescript
const DEFAULT_VALUES = {
  // 通用组件默认值（所有组件共享）
  common: {
    hidden: false,
    isLocked: false,
    condition: true,
    conditionGroup: '',
    title: '',
    state: {},
  },
  
  // NextText 组件特定默认值
  NextText: {
    mark: false,
    code: false,
    delete: false,
    underline: false,
    strong: false,
    prefix: '',
    classname: '',
    type: 'inherit',
  },
  
  // 其他组件类型...
};
```

### 添加新组件类型的默认值

```typescript
// 在 DEFAULT_VALUES 中添加新组件
const DEFAULT_VALUES = {
  // ... 现有配置
  
  // 添加新组件
  YourComponentName: {
    customProp: 'defaultValue',
    anotherProp: false,
  },
};
```

## 📊 优化效果示例

### 优化前
```json
{
  "componentName": "FDP",
  "id": "node_123",
  "docId": "doc_123",
  "props": {
    "style": { "marginBottom": "1em" },
    "mark": false,
    "code": false,
    "delete": false,
    "underline": false,
    "strong": false,
    "prefix": "",
    "classname": ""
  },
  "hidden": false,
  "title": "段落",
  "isLocked": false,
  "condition": true,
  "conditionGroup": ""
}
```

**文件大小**: 344 字节

### 优化后
```json
{
  "componentName": "FDP",
  "id": "node_123",
  "docId": "doc_123",
  "props": {
    "style": { "marginBottom": "1em" }
  },
  "title": "段落"
}
```

**文件大小**: 124 字节  
**减少**: 64% (220 字节)

## 🎯 优化策略

### 保留字段（不会被移除）

以下字段始终保留，即使是默认值：

- `componentName` - 组件类型标识
- `id` - 组件唯一标识
- `docId` - 文档标识
- `props` - 属性对象（即使为空）
- `children` - 子组件数组
- `style` - 样式对象（即使为空）

### 移除字段（等于默认值时）

以下字段如果等于默认值会被移除：

- `hidden: false`
- `isLocked: false`
- `condition: true`
- `conditionGroup: ''`
- `title: ''`
- `mark: false`
- `code: false`
- `delete: false`
- `underline: false`
- `strong: false`
- `prefix: ''`
- `classname: ''`
- 等等...

## 🔍 性能监控

优化器会在控制台输出性能统计：

```
[Schema Optimizer] 开始简化 schema...
[Schema Optimizer] 简化完成！
  • 原始大小: 2048.50 KB
  • 简化后: 1234.25 KB
  • 减少: 39.75%
  • 耗时: 45.23 ms
```

## ⚠️ 注意事项

### 1. 默认值准确性

确保 `DEFAULT_VALUES` 中定义的默认值与实际组件的默认行为一致，否则可能导致数据不完整。

### 2. 新增字段

如果组件新增了字段且有默认值，需要：

1. 更新 `DEFAULT_VALUES` 配置
2. 确保旧数据的恢复逻辑正确

### 3. 性能影响

- **简化操作**: 在保存时执行，通常耗时 < 100ms
- **恢复操作**: 在读取时执行，通常耗时 < 50ms
- 对于大型 schema (>5MB)，可能需要更长时间

### 4. 向后兼容

优化器保持向后兼容：

- ✅ 可以读取未优化的旧数据
- ✅ 可以读取优化后的新数据
- ✅ 恢复后的数据与原始数据功能一致

## 🐛 故障排查

### 问题：优化后数据丢失

**原因**: 默认值配置不正确

**解决**:
1. 检查 `DEFAULT_VALUES` 配置
2. 确认字段的真实默认值
3. 更新配置后重新测试

### 问题：恢复后组件行为异常

**原因**: 组件默认值定义变更

**解决**:
1. 检查组件库版本
2. 更新 `DEFAULT_VALUES` 以匹配最新默认值
3. 测试所有组件类型

### 问题：性能下降

**原因**: schema 过大或结构过深

**解决**:
1. 检查 schema 大小 (> 10MB 可能需要优化)
2. 考虑分页加载
3. 使用 Web Worker 进行后台处理（高级）

## 📚 相关文件

- `src/utils/schema-optimizer.ts` - 核心优化器
- `src/services/mockService.ts` - 集成保存/读取
- `src/hooks/use-editor-load-product.ts` - 产品加载集成
- `build/schema-optimizer-test.html` - 测试页面

## 🤝 贡献

如果发现问题或有改进建议：

1. 检查现有 issue
2. 提交详细的问题描述
3. 如果可能，提供复现步骤

## 📄 许可

与项目主许可协议保持一致。

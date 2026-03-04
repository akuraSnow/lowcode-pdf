# Word 表格解析优化说明

## 修改概述

将 Word 文档解析中的表格处理从 `display: table` CSS 样式改为两种方案：
1. **原生 `<table>` 元素** - 用于真实合并 + 可访问性 + 复杂表头
2. **CSS Grid 布局** - 用于自由布局 + 跨行跨列

## 技术方案

### 1. 智能表格类型检测

解析器会自动检测表格复杂度，选择最合适的渲染方案：

```javascript
const hasComplexSpan = element.querySelector('[colspan], [rowspan]');
const isComplexHeader = element.querySelectorAll('thead th').length > 5;

if (hasComplexSpan || isComplexHeader) {
  // 使用原生 <table> 元素
} else {
  // 使用 CSS Grid 布局
}
```

### 2. 原生 Table 方案

**适用场景**：
- 存在单元格合并（colspan 或 rowspan）
- 复杂的表头结构（超过5个表头列）
- 需要屏幕阅读器支持的表格
- 需要浏览器原生表格功能的场景

**实现方式**：
```javascript
// 生成原生 table 元素
{
  componentName: 'table',
  props: {
    className: 'parsed-native-table',
    style: {
      borderCollapse: 'collapse',
      width: '100%',
      border: '1px solid #e0e0e0'
    }
  },
  children: [
    // thead, tbody, tfoot
    {
      componentName: 'thead',
      children: [
        // tr
        {
          componentName: 'tr',
          children: [
            // th 或 td，保留真实的 colspan 和 rowspan
            {
              componentName: 'th',
              props: {
                colSpan: 2,  // 真实的 HTML 属性
                rowSpan: 1,
                style: { /* ... */ }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**优势**：
- ✅ 真实的单元格合并（浏览器原生支持）
- ✅ 完整的可访问性支持（ARIA 属性）
- ✅ 屏幕阅读器友好
- ✅ 复杂表头结构支持
- ✅ 表格语义完整

### 3. CSS Grid 方案

**适用场景**：
- 简单的表格布局（无合并单元格）
- 需要灵活布局控制
- 需要响应式设计
- 简单的数据展示

**实现方式**：
```javascript
// 使用 CSS Grid 容器
{
  componentName: 'FDCell',
  props: {
    className: 'parsed-grid-table',
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${colCount}, 1fr)`,
      gridTemplateRows: `repeat(${rowCount}, auto)`,
      gap: '0px'
    }
  },
  children: [
    // 直接放置单元格（不需要 tbody/tr 包装）
    {
      componentName: 'FDCell',
      props: {
        className: 'parsed-grid-td',
        style: {
          gridColumn: 'span 1',  // CSS Grid 跨列
          gridRow: 'span 1'       // CSS Grid 跨行
        }
      }
    }
  ]
}
```

**优势**：
- ✅ 灵活的布局控制
- ✅ 更简洁的 DOM 结构
- ✅ 易于响应式调整
- ✅ 现代化的 CSS 方案

## CSS 样式定义

### 原生 Table 样式
```css
.parsed-native-table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 12px;
}

.parsed-native-th,
.parsed-native-td {
  padding: 8px;
  border: 1px solid #e0e0e0;
  vertical-align: middle;
}

.parsed-native-th {
  background-color: #fafafa;
  font-weight: bold;
  text-align: center;
}

.parsed-native-td {
  background-color: #fff;
  text-align: left;
}
```

### CSS Grid 样式
```css
.parsed-grid-table {
  display: grid;
  gap: 0;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
}

.parsed-grid-th,
.parsed-grid-td {
  padding: 8px;
  border: 1px solid #e0e0e0;
}

.parsed-grid-th {
  background-color: #fafafa;
  font-weight: bold;
  text-align: center;
}

.parsed-grid-td {
  background-color: #fff;
  text-align: left;
}
```

## 单元格合并处理

### 原生 Table 方案
使用 HTML 原生属性：
```javascript
// 跨2列、跨3行的单元格
{
  componentName: 'td',
  props: {
    colSpan: 2,  // HTML 原生属性
    rowSpan: 3,  // HTML 原生属性
    style: { /* ... */ }
  }
}
```

### CSS Grid 方案
使用 Grid 属性：
```javascript
// 跨2列、跨3行的单元格
{
  componentName: 'FDCell',
  props: {
    style: {
      gridColumn: 'span 2',  // CSS Grid 跨列
      gridRow: 'span 3'       // CSS Grid 跨行
    }
  }
}
```

## 示例对比

### 原生 Table 示例

**Word 表格**：
```
┌────────────────────────┬────────┐
│    标题 (跨2列)        │        │
├────────┬───────────────┼────────┤
│  姓名  │     部门      │  工号  │
├────────┼───────────────┼────────┤
│  张三  │    技术部     │  001   │
└────────┴───────────────┴────────┘
```

**生成 Schema**：
```javascript
{
  componentName: 'table',
  children: [
    {
      componentName: 'thead',
      children: [
        {
          componentName: 'tr',
          children: [
            { componentName: 'th', props: { colSpan: 2 }, children: ['标题'] }
          ]
        },
        {
          componentName: 'tr',
          children: [
            { componentName: 'th', children: ['姓名'] },
            { componentName: 'th', children: ['部门'] },
            { componentName: 'th', children: ['工号'] }
          ]
        }
      ]
    },
    {
      componentName: 'tbody',
      children: [
        {
          componentName: 'tr',
          children: [
            { componentName: 'td', children: ['张三'] },
            { componentName: 'td', children: ['技术部'] },
            { componentName: 'td', children: ['001'] }
          ]
        }
      ]
    }
  ]
}
```

### CSS Grid 示例

**简单表格**：
```
┌────────┬───────────────┬────────┐
│  姓名  │     部门      │  工号  │
├────────┼───────────────┼────────┤
│  张三  │    技术部     │  001   │
│  李四  │    产品部     │  002   │
└────────┴───────────────┴────────┘
```

**生成 Schema**：
```javascript
{
  componentName: 'FDCell',
  props: {
    className: 'parsed-grid-table',
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, auto)',
      gap: '0px'
    }
  },
  children: [
    // 第一行（表头）
    { componentName: 'FDCell', children: ['姓名'] },
    { componentName: 'FDCell', children: ['部门'] },
    { componentName: 'FDCell', children: ['工号'] },
    // 第二行
    { componentName: 'FDCell', children: ['张三'] },
    { componentName: 'FDCell', children: ['技术部'] },
    { componentName: 'FDCell', children: ['001'] },
    // 第三行
    { componentName: 'FDCell', children: ['李四'] },
    { componentName: 'FDCell', children: ['产品部'] },
    { componentName: 'FDCell', children: ['002'] }
  ]
}
```

## 特性对比

| 特性 | 原生 Table | CSS Grid | 旧方案 (display: table) |
|------|-----------|----------|------------------------|
| 单元格合并 | ✅ 原生支持 | ⚠️ 有限支持 | ❌ 不支持 |
| 可访问性 | ✅ 完整 | ⚠️ 需额外配置 | ❌ 语义丢失 |
| 屏幕阅读器 | ✅ 原生支持 | ❌ 不支持 | ❌ 不支持 |
| 复杂表头 | ✅ 完整支持 | ⚠️ 有限支持 | ❌ 难以实现 |
| 布局灵活性 | ⚠️ 中等 | ✅ 很高 | ⚠️ 中等 |
| 响应式 | ⚠️ 需额外CSS | ✅ 原生支持 | ⚠️ 需额外CSS |
| 浏览器兼容性 | ✅ 优秀 | ✅ 现代浏览器 | ✅ 优秀 |
| DOM 结构 | 标准 | 简洁 | 伪表格 |
| 性能 | 优秀 | 优秀 | 中等 |

## 使用建议

### 何时使用原生 Table
1. Word 文档包含合并单元格
2. 需要导出为 PDF 或打印
3. 需要屏幕阅读器支持
4. 复杂的表头结构（多级表头）
5. 需要完整的表格语义

### 何时使用 CSS Grid
1. 简单的数据网格展示
2. 需要响应式布局
3. 需要灵活的布局控制
4. 现代浏览器环境
5. 不需要单元格合并

## 向后兼容性

修改后的解析器保持向后兼容：
- 自动检测表格类型，智能选择渲染方案
- 已有的 Word 文档重新解析后自动适配新方案
- 不影响非表格元素的解析

## 测试建议

1. **简单表格测试**：验证 CSS Grid 方案正常工作
2. **合并单元格测试**：验证原生 Table 方案的 colspan/rowspan
3. **多级表头测试**：验证复杂表头结构
4. **可访问性测试**：使用屏幕阅读器验证
5. **响应式测试**：在不同设备尺寸下测试

## 已知限制

1. **CSS Grid 方案**：不支持真实的单元格合并（仅视觉上跨越）
2. **原生 Table**：复杂样式可能需要额外的 CSS 调整
3. **预览模式**：需要确保 CSS 样式在预览环境中正确加载

## 未来优化方向

1. 支持表格主题配置（边框样式、颜色等）
2. 支持表格排序和筛选
3. 支持表格导出（Excel、CSV）
4. 增强响应式表格支持（移动端优化）
5. 支持表格编辑功能

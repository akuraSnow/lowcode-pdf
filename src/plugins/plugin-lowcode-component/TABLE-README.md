# 简化表格组件 (SimpleTable)

## 组件概述

简化表格组件是一个基于 Fusion Next Table 的低代码表格组件，去除了复杂的高级功能，保留了核心的表格展示能力，并增强了表头跨列跨行的功能。

## 功能特点

### ✅ 保留的功能

- **基础表格展示**: 支持数据源绑定和列配置
- **列配置**: 支持列宽、对齐方式、锁列等基础配置
- **表头分组**: 支持多级表头，可配置跨列和跨行
- **表格样式**: 支持边框、尺寸、加载状态等基础样式
- **固定表头**: 支持固定表头和最大高度设置
- **空数据提示**: 支持自定义空数据显示内容
- **基础事件**: 支持行点击、排序、筛选等基础事件

### ❌ 移除的功能

- 自定义工具栏渲染
- 复杂的风格与样式配置
- 内置行选择器（可通过自定义实现）
- 内置分页设置
- 可折叠表格
- 顶部操作选项
- 操作条
- 外链操作条
- 操作列选项
- 操作列

## 使用方法

### 1. 基础使用

```javascript
// 最简单的表格配置
{
  dataSource: [
    { id: '1', name: '张三', age: 28, address: '北京市朝阳区' },
    { id: '2', name: '李四', age: 32, address: '上海市浦东新区' }
  ],
  columns: [
    { dataIndex: 'name', title: '姓名', width: 120 },
    { dataIndex: 'age', title: '年龄', width: 100 },
    { dataIndex: 'address', title: '地址', width: 200 }
  ]
}
```

### 2. 表头分组（跨列）

```javascript
{
  dataSource: [
    { id: '1', name: '张三', age: 28, gender: '男', phone: '13800138000', email: 'zhangsan@example.com' }
  ],
  columns: [
    { dataIndex: 'name', title: '姓名', width: 120 },
    { dataIndex: 'age', title: '年龄', width: 80 },
    { dataIndex: 'gender', title: '性别', width: 80 },
    { dataIndex: 'phone', title: '电话', width: 140 },
    { dataIndex: 'email', title: '邮箱', width: 200 }
  ],
  columnGroups: [
    { title: '基本信息', colSpan: 3, align: 'center' },  // 跨3列：姓名、年龄、性别
    { title: '联系方式', colSpan: 2, align: 'center' }   // 跨2列：电话、邮箱
  ]
}
```

渲染效果：
```
┌─────────────────────┬─────────────────────┐
│      基本信息       │      联系方式       │
├────────┬──────┬─────┼────────┬───────────┤
│  姓名  │ 年龄 │性别 │  电话  │   邮箱    │
├────────┼──────┼─────┼────────┼───────────┤
│  张三  │  28  │ 男  │1380... │ zhang...  │
└────────┴──────┴─────┴────────┴───────────┘
```

### 3. 多级表头（嵌套分组）

通过 columnGroups 可以实现复杂的多级表头结构：

```javascript
{
  columns: [
    { dataIndex: 'name', title: '姓名', width: 100 },
    { dataIndex: 'age', title: '年龄', width: 80 },
    { dataIndex: 'chinese', title: '语文', width: 80 },
    { dataIndex: 'math', title: '数学', width: 80 },
    { dataIndex: 'english', title: '英语', width: 80 }
  ],
  columnGroups: [
    { title: '学生信息', colSpan: 2, align: 'center' },
    { title: '考试成绩', colSpan: 3, align: 'center' }
  ]
}
```

## 属性配置

### dataSource
- **类型**: `Array<Object>`
- **说明**: 表格的数据源
- **示例**: `[{ id: 1, name: '张三' }]`

### columns
- **类型**: `Array<Object>`
- **说明**: 列配置数组
- **子属性**:
  - `dataIndex` (string, 必填): 数据字段名
  - `title` (string, 必填): 列标题
  - `width` (number): 列宽度
  - `align` (string): 对齐方式，可选值: 'left' | 'center' | 'right'
  - `lock` (boolean | string): 锁列，可选值: false | 'left' | 'right'

### columnGroups
- **类型**: `Array<Object>`
- **说明**: 表头分组配置，用于实现多级表头和跨列
- **子属性**:
  - `title` (string, 必填): 分组标题
  - `colSpan` (number, 默认: 1): 该分组横跨的列数
  - `align` (string, 默认: 'center'): 对齐方式

### hasBorder
- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否显示表格边框

### fixedHeader
- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否固定表头

### maxBodyHeight
- **类型**: `number`
- **说明**: 表格最大高度，超出会出现滚动条（需要启用 fixedHeader）

### size
- **类型**: `'small' | 'medium' | 'large'`
- **默认值**: `'medium'`
- **说明**: 表格尺寸

### loading
- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 表格加载状态

### emptyContent
- **类型**: `string`
- **默认值**: `'暂无数据'`
- **说明**: 数据为空时显示的内容

## 事件

### onRowClick
- **说明**: 点击表格行时触发
- **参数**: `(record, index, event)`

### onChange
- **说明**: 表格发生变化时触发（排序、筛选等）
- **参数**: `(dataSource)`

### onSort
- **说明**: 点击列排序时触发
- **参数**: `(dataIndex, order)`

### onFilter
- **说明**: 筛选条件变化时触发
- **参数**: `(filterParams)`

## 方法

组件提供了以下方法供外部调用：

### updateDataSource(newData)
更新表格数据源

### updateColumns(newColumns)
更新表格列配置

### updateColumnGroups(newGroups)
更新表头分组配置

## 使用场景

1. **简单数据展示**: 适合展示简单的列表数据
2. **报表展示**: 适合展示固定格式的报表数据
3. **数据对比**: 通过表头分组可以清晰地对比不同维度的数据
4. **多维度数据**: 通过跨列表头可以展示具有层级关系的数据

## 注意事项

1. **跨列配置**: columnGroups 中的 colSpan 总和应该等于 columns 的长度
2. **数据绑定**: 确保 dataSource 中的数据字段与 columns 中的 dataIndex 对应
3. **性能优化**: 对于大数据量场景，建议使用虚拟滚动或分页（需自行实现）
4. **样式定制**: 可以通过 className 和 style 属性进行样式定制

## 与 NextTable 的区别

| 功能 | SimpleTable | NextTable |
|------|-------------|-----------|
| 基础表格 | ✅ | ✅ |
| 表头分组 | ✅ 增强 | ✅ |
| 自定义工具栏 | ❌ | ✅ |
| 内置分页 | ❌ | ✅ |
| 行选择器 | ❌ | ✅ |
| 操作列 | ❌ | ✅ |
| 可折叠行 | ❌ | ✅ |
| 学习成本 | 低 | 中 |
| 配置复杂度 | 低 | 高 |

## 示例代码

完整的使用示例：

```json
{
  "componentName": "SimpleTable",
  "props": {
    "dataSource": [
      {
        "id": "1",
        "name": "张三",
        "age": 28,
        "gender": "男",
        "department": "技术部",
        "position": "前端工程师",
        "salary": 15000
      },
      {
        "id": "2",
        "name": "李四",
        "age": 32,
        "gender": "女",
        "department": "产品部",
        "position": "产品经理",
        "salary": 18000
      }
    ],
    "columns": [
      { "dataIndex": "name", "title": "姓名", "width": 100 },
      { "dataIndex": "age", "title": "年龄", "width": 80 },
      { "dataIndex": "gender", "title": "性别", "width": 80 },
      { "dataIndex": "department", "title": "部门", "width": 120 },
      { "dataIndex": "position", "title": "职位", "width": 120 },
      { "dataIndex": "salary", "title": "薪资", "width": 100 }
    ],
    "columnGroups": [
      { "title": "个人信息", "colSpan": 3, "align": "center" },
      { "title": "工作信息", "colSpan": 3, "align": "center" }
    ],
    "hasBorder": true,
    "size": "medium"
  }
}
```

## 技术实现

组件基于 Fusion Next Table 实现，主要技术点：

1. **低代码模式**: 使用 lowCode 开发模式，支持可视化编辑
2. **Schema 驱动**: 通过 JSON Schema 定义组件结构
3. **状态管理**: 使用组件内部 state 管理数据和配置
4. **方法暴露**: 通过 methods 暴露更新方法供外部调用
5. **表头分组**: 通过 getColumns 方法动态构建多级表头结构

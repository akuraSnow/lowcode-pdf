# 更新日志

## 2025-02-24 - 编辑器按钮布局优化

### 新增功能 ✨

1. **左上角返回主页按钮**
   - 提供快速返回产品列表的入口
   - 始终可见，无需展开菜单

2. **右下角浮动操作按钮 (FAB)**
   - 点击主按钮展开/收起功能菜单
   - 整合以下功能：
     - 📥 导出 Schema
     - 📄 导出 PDF
     - 📂 导入 Schema
     - 💾 保存为模板
     - 📚 应用模板
     - 📤 上传文档
   - 支持动画效果和延迟展开
   - 鼠标悬停显示功能说明

### 文件变更 📝

**新增文件**:
- `src/components/FloatingActionButton/index.tsx` - 浮动按钮组件
- `src/components/FloatingActionButton/styles.css` - 浮动按钮样式
- `src/components/FloatingActionButton/styles.scss` - 原SCSS样式（保留）
- `src/plugins/plugin-unified-actions/index.tsx` - 统一操作插件
- `docs/button-layout-optimization.md` - 优化说明文档

**修改文件**:
- `src/index.ts` - 注册统一操作插件
- `src/plugins/plugin-document-export/index.tsx` - 移除顶部按钮，暴露导出功能
- `src/plugins/plugin-publish/index.tsx` - 移除顶部按钮
- `src/plugins/plugin-template-manager/index.tsx` - 移除顶部按钮，暴露模板功能
- `src/plugins/plugin-document-parser/index.tsx` - 移除顶部按钮，暴露上传功能

### 改进点 🎯

1. **简洁的界面**
   - 顶部工具栏不再拥挤
   - 更多空间用于画布显示

2. **渐进披露**
   - 功能默认隐藏，需要时才展开
   - 减少视觉干扰和认知负担

3. **易于扩展**
   - 新功能只需在统一操作插件中添加一项
   - 插件间通过 config API 通信

4. **现代化体验**
   - 符合 Material Design 设计规范
   - 流畅的展开/收起动画

### 使用说明 📖

**返回主页**:
```
点击左上角 "🏠 返回主页" 按钮
```

**使用功能**:
```
1. 点击右下角 ➕ 按钮
2. 从展开的菜单中选择功能
3. 菜单自动收起
```

### 技术细节 🔧

**依赖更新**:
- 使用 `@alifd/next` 的 `Balloon` 组件替代 `Tooltip`
- 使用 `ReactDOM.render` 渲染浮动按钮到 body

**插件通信**:
- 功能插件通过 `config.set(key, function)` 暴露功能
- 统一操作插件通过 `config.get(key)` 获取功能

**性能考虑**:
- 浮动按钮延迟 1 秒渲染，避免影响编辑器初始化
- 使用 CSS 动画而非 JS 动画，性能更优

### 已知限制 ⚠️

1. 浮动按钮可能遮挡右下角内容
   - 计划：后续版本支持拖拽定位

2. 发布功能暂未集成到浮动按钮
   - 原因：需要复杂的确认流程
   - 计划：考虑简化流程后集成

### 后续规划 🚀

- [ ] 支持浮动按钮拖拽定位
- [ ] 添加快捷键支持（如 Cmd+S 保存）
- [ ] 添加功能搜索（当功能较多时）
- [ ] 支持用户自定义功能顺序
- [ ] 集成发布功能到浮动按钮

### 测试建议 🧪

1. 验证返回主页功能是否正常
2. 验证浮动按钮展开/收起动画
3. 测试每个功能是否正常工作：
   - 导出/导入 Schema
   - 导出 PDF
   - 保存/应用模板
   - 上传文档
4. 检查在不同屏幕尺寸下的显示效果
5. 验证浮动按钮是否遮挡重要内容

### 回滚方案 🔄

如需回滚此更新：

```bash
# 删除新增文件
rm -rf src/components/FloatingActionButton
rm -f src/plugins/plugin-unified-actions/index.tsx

# 恢复修改的文件（从 git）
git checkout src/index.ts
git checkout src/plugins/plugin-document-export/index.tsx
git checkout src/plugins/plugin-publish/index.tsx
git checkout src/plugins/plugin-template-manager/index.tsx
git checkout src/plugins/plugin-document-parser/index.tsx
```

/**
 * Schema 优化工具 - 用于简化和恢复 JSON Schema
 * 
 * 功能:
 * 1. 保存时移除默认值字段以减小文件大小
 * 2. 读取时恢复默认值字段以确保数据完整性
 */

/**
 * 默认值配置
 * 定义了各个组件类型的默认字段值
 */
const DEFAULT_VALUES = {
  // 通用组件默认值
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
  
  // 表格相关组件默认值
  table: {
    className: '',
  },
  
  // FDCell 组件默认值
  FDCell: {
    align: 'left',
    verAlign: 'top',
  },
  
  // FDP (段落) 组件默认值
  FDP: {},
  
  // HtmlRenderer 组件默认值
  HtmlRenderer: {},
};

/**
 * 检查值是否为默认值
 */
function isDefaultValue(key: string, value: any, componentName?: string): boolean {
  // 先检查组件特定默认值
  if (componentName && DEFAULT_VALUES[componentName as keyof typeof DEFAULT_VALUES]) {
    const componentDefaults = DEFAULT_VALUES[componentName as keyof typeof DEFAULT_VALUES];
    if (key in componentDefaults) {
      return componentDefaults[key as keyof typeof componentDefaults] === value;
    }
  }
  
  // 再检查通用默认值
  if (key in DEFAULT_VALUES.common) {
    return DEFAULT_VALUES.common[key as keyof typeof DEFAULT_VALUES.common] === value;
  }
  
  return false;
}

/**
 * 递归移除对象中的默认值字段
 */
function removeDefaultValues(obj: any, componentName?: string, visited = new WeakSet()): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // 检测循环引用
  if (visited.has(obj)) {
    return obj;
  }
  visited.add(obj);
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => removeDefaultValues(item, componentName, visited));
  }
  
  // 处理对象
  const result: any = {};
  const currentComponentName = obj.componentName || componentName;
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    
    const value = obj[key];
    
    // 保留的关键字段（不检查是否为默认值）
    const preservedKeys = [
      'componentName', 'id', 'docId', 'fileName',
      'props', 'children', 'style', 'settings',
      'version', 'pages', 'currentPageId', 'metadata',
      'ref', 'componentsMap', 'i18n', 'componentsTree'
    ];
    
    // 跳过默认值字段（但保留关键字段）
    if (
      !preservedKeys.includes(key) &&
      isDefaultValue(key, value, currentComponentName)
    ) {
      continue;
    }
    
    // 递归处理子对象/数组（只处理特定字段）
    const recursiveKeys = ['children', 'props', 'pages', 'settings', 'style', 'componentsTree'];
    if (recursiveKeys.includes(key)) {
      result[key] = removeDefaultValues(value, currentComponentName, visited);
    } else if (typeof value === 'object' && value !== null) {
      const processed = removeDefaultValues(value, currentComponentName, visited);
      // 只保留非空对象
      if (Array.isArray(processed) ? processed.length > 0 : Object.keys(processed).length > 0) {
        result[key] = processed;
      } else if (key === 'props' || key === 'style' || key === 'settings') {
        // props, style 和 settings 即使为空也保留
        result[key] = processed;
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * 递归添加默认值字段
 */
function addDefaultValues(obj: any, componentName?: string, visited = new WeakSet(), isRootLevel = true): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // 检测循环引用
  if (visited.has(obj)) {
    return obj;
  }
  visited.add(obj);
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => addDefaultValues(item, componentName, visited, false));
  }
  
  // 处理对象
  const result: any = { ...obj };
  const currentComponentName = obj.componentName || componentName;
  
  // 只在组件根级别添加通用默认值（不在 style、props 等嵌套对象中添加）
  if (isRootLevel && obj.componentName) {
    for (const key in DEFAULT_VALUES.common) {
      if (!(key in result)) {
        result[key] = DEFAULT_VALUES.common[key as keyof typeof DEFAULT_VALUES.common];
      }
    }
  }
  
  // 添加组件特定默认值（如果是 props 对象）
  if (currentComponentName && result.props) {
    const componentDefaults = DEFAULT_VALUES[currentComponentName as keyof typeof DEFAULT_VALUES];
    if (componentDefaults) {
      for (const key in componentDefaults) {
        if (!(key in result.props)) {
          result.props[key] = componentDefaults[key as keyof typeof componentDefaults];
        }
      }
    }
  }
  
  // 递归处理子对象（只处理特定的已知字段，避免无限递归）
  const recursiveKeys = ['children', 'props', 'pages', 'componentsTree', 'settings', 'style'];
  for (const key of recursiveKeys) {
    if (key in result && typeof result[key] === 'object' && result[key] !== null) {
      // 对于 children 数组中的项，它们是新的组件，所以 isRootLevel 应为 true
      const childIsRootLevel = key === 'children' || key === 'pages' || key === 'componentsTree';
      result[key] = addDefaultValues(result[key], currentComponentName, visited, childIsRootLevel);
    }
  }
  
  return result;
}

/**
 * 简化 Schema - 移除默认值字段
 * @param schema 原始 schema
 * @returns 简化后的 schema
 */
export function simplifySchema(schema: any): any {
  if (!schema) return schema;
  
  console.log('[Schema Optimizer] 开始简化 schema...');
  const startTime = performance.now();
  const originalSize = JSON.stringify(schema).length;
  
  const simplified = removeDefaultValues(schema);
  
  const simplifiedSize = JSON.stringify(simplified).length;
  const reduction = ((originalSize - simplifiedSize) / originalSize * 100).toFixed(2);
  const endTime = performance.now();
  
  console.log(`[Schema Optimizer] 简化完成！`);
  console.log(`  • 原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`  • 简化后: ${(simplifiedSize / 1024).toFixed(2)} KB`);
  console.log(`  • 减少: ${reduction}%`);
  console.log(`  • 耗时: ${(endTime - startTime).toFixed(2)} ms`);
  
  return simplified;
}

/**
 * 恢复 Schema - 添加默认值字段
 * @param schema 简化的 schema
 * @returns 完整的 schema
 */
export function restoreSchema(schema: any): any {
  if (!schema) return schema;
  
  console.log('[Schema Optimizer] 开始恢复 schema 默认值...');
  const startTime = performance.now();
  
  const restored = addDefaultValues(schema);
  
  const endTime = performance.now();
  console.log(`[Schema Optimizer] 恢复完成！耗时: ${(endTime - startTime).toFixed(2)} ms`);
  
  return restored;
}

/**
 * 优化整个项目 Schema
 * @param projectSchema 项目 schema (包含 componentsTree, pages, i18n 等)
 * @returns 简化后的项目 schema
 */
export function optimizeProjectSchema(projectSchema: any): any {
  if (!projectSchema) return projectSchema;
  
  const originalSize = JSON.stringify(projectSchema).length;
  console.log(`[Schema Optimizer] 开始优化 Schema, 原始大小: ${originalSize} bytes`);
  
  const optimized = { ...projectSchema };
  
  // 简化 componentsTree（单页面格式）
  if (optimized.componentsTree && Array.isArray(optimized.componentsTree)) {
    console.log(`[Schema Optimizer] 优化 ${optimized.componentsTree.length} 个 componentsTree...`);
    optimized.componentsTree = optimized.componentsTree.map((tree: any, index: number) => {
      const treeOriginalSize = JSON.stringify(tree).length;
      const simplified = simplifySchema(tree);
      const treeOptimizedSize = JSON.stringify(simplified).length;
      const reduction = ((treeOriginalSize - treeOptimizedSize) / treeOriginalSize * 100).toFixed(2);
      console.log(`[Schema Optimizer] componentsTree[${index}]: ${treeOriginalSize} → ${treeOptimizedSize} bytes (减少 ${reduction}%)`);
      return simplified;
    });
  }
  
  // 简化 pages（多页面格式）
  if (optimized.pages && Array.isArray(optimized.pages)) {
    console.log(`[Schema Optimizer] 优化 ${optimized.pages.length} 个 pages...`);
    optimized.pages = optimized.pages.map((page: any, index: number) => {
      const pageOriginalSize = JSON.stringify(page).length;
      const simplified = simplifySchema(page);
      const pageOptimizedSize = JSON.stringify(simplified).length;
      const reduction = ((pageOriginalSize - pageOptimizedSize) / pageOriginalSize * 100).toFixed(2);
      console.log(`[Schema Optimizer] pages[${index}]: ${pageOriginalSize} → ${pageOptimizedSize} bytes (减少 ${reduction}%)`);
      return simplified;
    });
  }
  
  const optimizedSize = JSON.stringify(optimized).length;
  const totalReduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
  console.log(`[Schema Optimizer] 优化完成: ${originalSize} → ${optimizedSize} bytes (总共减少 ${totalReduction}%)`);
  
  return optimized;
}

/**
 * 恢复整个项目 Schema
 * @param projectSchema 简化的项目 schema
 * @returns 完整的项目 schema
 */
export function restoreProjectSchema(projectSchema: any): any {
  if (!projectSchema) return projectSchema;
  
  const restored = { ...projectSchema };
  
  // 恢复 componentsTree（单页面格式）
  if (restored.componentsTree && Array.isArray(restored.componentsTree)) {
    restored.componentsTree = restored.componentsTree.map((tree: any) => 
      restoreSchema(tree)
    );
  }
  
  // 恢复 pages（多页面格式）
  if (restored.pages && Array.isArray(restored.pages)) {
    restored.pages = restored.pages.map((page: any) => 
      restoreSchema(page)
    );
  }
  
  return restored;
}

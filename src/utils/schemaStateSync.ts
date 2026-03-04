/**
 * Schema State 同步工具
 * 确保 schema 的 state 字段与 dataStore 的 pageData 保持同步
 */

import { project } from '@alilc/lowcode-engine';
import { IPublicEnumTransformStage } from '@alilc/lowcode-types';
import { useDataStore } from '../stores/dataStore';

/**
 * 将 dataStore 的 pageData 同步到 schema 的 state 字段
 * 这样可以确保 JSExpression (如 this.state.xxx) 能正确访问数据
 */
export function syncPageDataToSchemaState() {
  try {
    const pageData = useDataStore.getState().pageData;
    
    // 获取当前 schema
    const schema = project.exportSchema(IPublicEnumTransformStage.Render);
    
    if (schema.componentsTree && schema.componentsTree[0]) {
      const pageSchema = schema.componentsTree[0] as any;
      
      // 初始化或更新 state 字段
      if (!pageSchema.state) {
        pageSchema.state = {};
      }
      
      // 将 pageData 的每个字段转换为 JSExpression 格式
      Object.keys(pageData).forEach(key => {
        const value = pageData[key];
        pageSchema.state[key] = {
          type: 'JSExpression',
          value: JSON.stringify(value),
        };
      });
      
      // 重新导入 schema
      project.importSchema(schema as any);
      
      console.log('[SchemaStateSync] ✓ 已同步 pageData 到 schema.state:', Object.keys(pageData));
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('[SchemaStateSync] 同步失败:', err);
    return false;
  }
}

/**
 * 将 schema 的 state 字段同步到 dataStore 的 pageData
 * 用于加载 schema 时恢复数据
 */
export function syncSchemaStateToPageData() {
  try {
    const schema = project.exportSchema(IPublicEnumTransformStage.Render);
    
    if (schema.componentsTree && schema.componentsTree[0]) {
      const pageSchema = schema.componentsTree[0] as any;
      
      if (pageSchema.state) {
        const pageData: Record<string, any> = {};
        
        // 解析 schema.state 中的 JSExpression
        Object.keys(pageSchema.state).forEach(key => {
          const stateValue = pageSchema.state[key] as any;
          
          if (stateValue && typeof stateValue === 'object') {
            if (stateValue.type === 'JSExpression') {
              // 解析 JSExpression 的值
              try {
                // 移除引号并解析
                const value = String(stateValue.value).replace(/^"|"$/g, '');
                pageData[key] = JSON.parse(value);
              } catch (err) {
                // 如果解析失败,尝试直接使用字符串值
                pageData[key] = stateValue.value;
              }
            } else {
              pageData[key] = stateValue;
            }
          } else {
            pageData[key] = stateValue;
          }
        });
        
        // 更新 dataStore
        useDataStore.getState().setPageData(pageData);
        console.log('[SchemaStateSync] ✓ 已同步 schema.state 到 pageData:', Object.keys(pageData));
        return true;
      }
    }
    
    return false;
  } catch (err) {
    console.error('[SchemaStateSync] 同步失败:', err);
    return false;
  }
}

/**
 * 初始化同步监听器
 * 监听 dataStore 的变化并自动同步到 schema
 */
export function initSchemaStateSync() {
  // 订阅 dataStore 的变化
  useDataStore.subscribe(
    (state: any) => state.pageData,
    (pageData: any, prevPageData: any) => {
      // 检查是否有实际变化
      if (JSON.stringify(pageData) !== JSON.stringify(prevPageData)) {
        console.log('[SchemaStateSync] 检测到 pageData 变化,准备同步到 schema');
        // 延迟同步以避免频繁更新
        setTimeout(() => {
          syncPageDataToSchemaState();
        }, 100);
      }
    }
  );
  
  console.log('[SchemaStateSync] ✓ 同步监听器已初始化');
}

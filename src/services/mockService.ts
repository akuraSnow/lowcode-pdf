import { material, project } from '@alilc/lowcode-engine';
import { filterPackages } from '@alilc/lowcode-plugin-inject'
import { Message, Dialog } from '@alifd/next';
import { IPublicTypeProjectSchema, IPublicEnumTransformStage } from '@alilc/lowcode-types';
import DefaultPageSchema from './defaultPageSchema.json';
import DefaultI18nSchema from './defaultI18nSchema.json';
import { useProductStore } from '../stores/productStore';
import { API_ENDPOINTS } from '../config/api';
import { optimizeProjectSchema, restoreProjectSchema } from '../utils/schema-optimizer';

const generateProjectSchema = (pageSchema: any, i18nSchema: any): IPublicTypeProjectSchema => {
  return {
    componentsTree: [pageSchema],
    componentsMap: (material && material.componentsMap) ? material.componentsMap as any : {},
    version: '1.0.0',
    i18n: i18nSchema,
  };
}


export const saveSchema = async (scenarioName: string = 'unknown') => {
  setProjectSchemaToLocalStorage(scenarioName);
  await setPackagesToLocalStorage(scenarioName);
  
  // 检查是否在编辑具体产品
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('productId');
  
  if (productId) {
    // 导出当前 schema
    const schema = project.exportSchema(IPublicEnumTransformStage.Save);
    
    // 同步 dataStore 的 pageData 到 schema 的 state 字段
    try {
      const { useDataStore } = await import('../stores/dataStore');
      const pageData = useDataStore.getState().pageData;
      
      // 将 pageData 转换为 schema state 格式
      if (schema.componentsTree && schema.componentsTree[0]) {
        const pageSchema = schema.componentsTree[0];
        
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
        
        console.log(`[saveSchema] ✓ 已同步 pageData 到 schema.state:`, Object.keys(pageData));
      }
    } catch (err) {
      console.warn(`[saveSchema] 同步 pageData 到 schema 失败:`, err);
    }
    
    console.log(`[saveSchema] 导出的 schema 结构:`, {
      has_componentsTree: !!schema.componentsTree,
      componentsTree_length: schema.componentsTree?.length,
      schema_keys: Object.keys(schema),
    });
    
    // 1. 保存到本地 localStorage（用于降级方案）
    const productKey = `${productId}_project_schema`;
    localStorage.setItem(productKey, JSON.stringify(schema));
    console.log(`✓ 产品设计已缓存到本地: ${productId}`);
    
    // 2. 更新 Zustand store
    try {
      const productStore = useProductStore.getState();
      productStore.updateProduct(productId, {
        schema: schema,
        updatedAt: new Date().toISOString(),
      });
      console.log(`✓ 已更新 Zustand store 中的产品数据: ${productId}`);
    } catch (err) {
      console.warn(`更新 Zustand store 失败:`, err);
    }
    
    // 3. 发布到后端 API（主要存储方式）
    try {
      // 获取产品的基本信息
      const product = useProductStore.getState().getProductById(productId);
      
      // 简化 schema 以减小文件大小
      const optimizedSchema = optimizeProjectSchema(schema);
      
      // 构建完整的产品数据对象（包含元数据和 schema）
      const productWithMetadata = {
        id: productId,
        name: product?.name || productId,
        description: product?.description || '',
        createdAt: product?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectSchema: optimizedSchema, // 实际的 ProjectSchema 存储在 projectSchema 字段（已优化）
        // 保留 schema 字段作为兼容性
        schema: optimizedSchema,
      };
      
      const response = await fetch(API_ENDPOINTS.publish, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `./data/products/${productId}.json`,
          schema: productWithMetadata, // 发送包含元数据的完整对象
          productId: productId,
        }),
      });
      
      if (response.ok) {
        console.log(`✓ 产品设计已发布到服务器: ${productId}`);
        Message.success('产品设计已保存！');
      } else {
        console.warn(`产品发布失败: ${response.statusText}`);
        Message.warning('产品设计已保存到本地，但发布到服务器失败');
      }
    } catch (err) {
      console.warn(`产品发布异常:`, err);
      Message.warning('产品设计已保存到本地，但无法连接服务器');
    }
  } else {
    Message.success('成功保存到本地');
  }
};

export const resetSchema = async (scenarioName: string = 'unknown') => {
  try {
    await new Promise<void>((resolve, reject) => {
      Dialog.confirm({
        content: '确定要重置吗？您所有的修改都将消失！',
        onOk: () => {
          resolve();
        },
        onCancel: () => {
          reject()
        },
      })
    })
  } catch(err) {
    return;
  }
  const defaultSchema = generateProjectSchema(DefaultPageSchema, DefaultI18nSchema);

  project.importSchema(defaultSchema as any);
  project.simulatorHost?.rerender();

  setProjectSchemaToLocalStorage(scenarioName);
  await setPackagesToLocalStorage(scenarioName);
  Message.success('成功重置页面');
}

const getLSName = (scenarioName: string, ns: string = 'projectSchema') => `${scenarioName}:${ns}`;

export const getProjectSchemaFromLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  const localValue = window.localStorage.getItem(getLSName(scenarioName));
  if (localValue) {
    const schema = JSON.parse(localValue);
    // 恢复 schema 的默认值字段
    return restoreProjectSchema(schema);
  }
  return undefined;
}

const setProjectSchemaToLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  const schema = project.exportSchema(IPublicEnumTransformStage.Save);
  const optimized = optimizeProjectSchema(schema);
  window.localStorage.setItem(
    getLSName(scenarioName),
    JSON.stringify(optimized)
  );
}

const setPackagesToLocalStorage = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  const packages = await filterPackages(material.getAssets().packages);
  window.localStorage.setItem(
    getLSName(scenarioName, 'packages'),
    JSON.stringify(packages),
  );
}

export const getPackagesFromLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  return JSON.parse(window.localStorage.getItem(getLSName(scenarioName, 'packages')) || '{}');
}

export const getProjectSchema = async (scenarioName: string = 'unknown') : Promise<IPublicTypeProjectSchema> => {
  const pageSchema = await getPageSchema(scenarioName);
  return generateProjectSchema(pageSchema, DefaultI18nSchema);
};

export const getPageSchema = async (scenarioName: string = 'unknown') => {
  const pageSchema = getProjectSchemaFromLocalStorage(scenarioName)?.componentsTree?.[0];
  if (pageSchema) {
    return pageSchema;
  }

  return DefaultPageSchema;
};

export const getPreviewLocale = (scenarioName: string) => {
  const key = getLSName(scenarioName, 'previewLocale');
  return window.localStorage.getItem(key) || 'zh-CN';
}

export const setPreviewLocale = (scenarioName: string, locale: string) => {
  const key = getLSName(scenarioName, 'previewLocale');
  window.localStorage.setItem(key, locale || 'zh-CN');
  window.location.reload();
}

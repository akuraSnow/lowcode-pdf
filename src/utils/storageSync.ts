/**
 * 浏览器数据库数据同步工具
 * 
 * 用于将 IndexedDB 中的数据同步到后端服务器文件系统
 * 支持的数据类型:
 * - general:projectSchema (项目Schema)
 * - lowcode_products (产品列表)
 * - lowcode_templates (模板列表)
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

export type StorageType = 'projectSchema' | 'products' | 'templates';

export interface SaveOptions {
  type: StorageType;
  key: string;
  data: any;
  customPath?: string;
}

export interface BatchSaveOptions {
  items: Array<{
    type: StorageType;
    key: string;
    data: any;
  }>;
  customPath?: string;
}

export interface LoadOptions {
  type: StorageType;
  key: string;
  customPath?: string;
}

export interface ListOptions {
  type: StorageType;
  customPath?: string;
}

export interface DeleteOptions {
  type: StorageType;
  key: string;
  customPath?: string;
}

/**
 * 保存单个数据到服务器
 */
export async function saveToServer(options: SaveOptions): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/storage/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '保存失败');
    }
    
    return result;
  } catch (error) {
    console.error('[StorageSync] 保存失败:', error);
    throw error;
  }
}

/**
 * 批量保存数据到服务器
 */
export async function batchSaveToServer(options: BatchSaveOptions): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/storage/batch-save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '批量保存失败');
    }
    
    return result;
  } catch (error) {
    console.error('[StorageSync] 批量保存失败:', error);
    throw error;
  }
}

/**
 * 从服务器加载数据
 */
export async function loadFromServer(options: LoadOptions): Promise<any> {
  try {
    const params = new URLSearchParams({
      type: options.type,
      key: options.key,
    });
    
    if (options.customPath) {
      params.append('customPath', options.customPath);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/storage/load?${params}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '加载失败');
    }
    
    return result.data;
  } catch (error) {
    console.error('[StorageSync] 加载失败:', error);
    throw error;
  }
}

/**
 * 列出服务器上指定类型的所有数据
 */
export async function listFromServer(options: ListOptions): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      type: options.type,
    });
    
    if (options.customPath) {
      params.append('customPath', options.customPath);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/storage/list?${params}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '列表获取失败');
    }
    
    return result.data;
  } catch (error) {
    console.error('[StorageSync] 列表获取失败:', error);
    throw error;
  }
}

/**
 * 从服务器删除数据
 */
export async function deleteFromServer(options: DeleteOptions): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/storage/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '删除失败');
    }
    
    return result;
  } catch (error) {
    console.error('[StorageSync] 删除失败:', error);
    throw error;
  }
}

/**
 * 从 IndexedDB 中读取数据并同步到服务器
 */
export async function syncIndexedDBToServer(customPath?: string): Promise<void> {
  try {
    const items: Array<{ type: StorageType; key: string; data: any }> = [];
    
    // 打开 IndexedDB
    const dbRequest = indexedDB.open('general', 1);
    
    await new Promise((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = () => reject(dbRequest.error);
    });
    
    const db = dbRequest.result;
    
    // 读取 projectSchema
    try {
      const tx1 = db.transaction(['general'], 'readonly');
      const store1 = tx1.objectStore('general');
      const request1 = store1.get('projectSchema');
      
      await new Promise((resolve, reject) => {
        request1.onsuccess = () => {
          if (request1.result) {
            items.push({
              type: 'projectSchema',
              key: 'general:projectSchema',
              data: request1.result,
            });
          }
          resolve(request1.result);
        };
        request1.onerror = () => reject(request1.error);
      });
    } catch (error) {
      console.warn('[StorageSync] 读取 projectSchema 失败:', error);
    }
    
    // 读取 lowcode_products
    try {
      const tx2 = db.transaction(['lowcode_products'], 'readonly');
      const store2 = tx2.objectStore('lowcode_products');
      const request2 = store2.getAll();
      
      await new Promise((resolve, reject) => {
        request2.onsuccess = () => {
          if (request2.result && request2.result.length > 0) {
            request2.result.forEach((product: any, index: number) => {
              items.push({
                type: 'products',
                key: product.id || `product_${index}`,
                data: product,
              });
            });
          }
          resolve(request2.result);
        };
        request2.onerror = () => reject(request2.error);
      });
    } catch (error) {
      console.warn('[StorageSync] 读取 lowcode_products 失败:', error);
    }
    
    // 读取 lowcode_templates
    try {
      const tx3 = db.transaction(['lowcode_templates'], 'readonly');
      const store3 = tx3.objectStore('lowcode_templates');
      const request3 = store3.getAll();
      
      await new Promise((resolve, reject) => {
        request3.onsuccess = () => {
          if (request3.result && request3.result.length > 0) {
            request3.result.forEach((template: any, index: number) => {
              items.push({
                type: 'templates',
                key: template.id || `template_${index}`,
                data: template,
              });
            });
          }
          resolve(request3.result);
        };
        request3.onerror = () => reject(request3.error);
      });
    } catch (error) {
      console.warn('[StorageSync] 读取 lowcode_templates 失败:', error);
    }
    
    db.close();
    
    // 批量保存到服务器
    if (items.length > 0) {
      console.log(`[StorageSync] 准备同步 ${items.length} 个数据项到服务器...`);
      const result = await batchSaveToServer({ items, customPath });
      console.log('[StorageSync] 同步完成:', result);
      return result;
    } else {
      console.log('[StorageSync] 没有数据需要同步');
    }
  } catch (error) {
    console.error('[StorageSync] 同步失败:', error);
    throw error;
  }
}

/**
 * 检查服务器健康状态
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('[StorageSync] 服务器健康检查失败:', error);
    return false;
  }
}

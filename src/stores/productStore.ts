/**
 * 产品数据存储 - 使用 Zustand 管理产品列表
 * 不缓存到浏览器，所有数据通过 API 获取
 */

import create from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductFormData } from '../types/product';
import DefaultPageSchema from '../services/defaultPageSchema.json';
import DefaultI18nSchema from '../services/defaultI18nSchema.json';
import { useGlobalSettingsStore } from './globalSettingsStore';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import { toCamelCase } from '../utils';

interface ProductStore {
  /** 产品列表 */
  products: Product[];
  
  /** 加载状态 */
  isLoading: boolean;
  
  /** 错误信息 */
  error: Error | null;
  
  /** 当前编辑的产品ID */
  currentProductId: string | null;
  
  /** 获取所有产品 */
  getProducts: () => Product[];
  
  /** 根据ID获取产品 */
  getProductById: (id: string) => Product | undefined;
  
  /** 添加新产品 */
  addProduct: (data: ProductFormData) => Promise<Product>;
  
  /** 更新产品 */
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  
  /** 删除产品 */
  deleteProduct: (id: string) => Promise<void>;
  
  /** 设置当前产品 */
  setCurrentProduct: (id: string | null) => void;
  
  /** 从 API 加载产品列表 */
  fetchProducts: () => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  currentProductId: null,
  
  getProducts: () => get().products,
  
  getProductById: (id: string) => {
    return get().products.find((p) => p.id === id);
  },
  
  addProduct: async (data: ProductFormData) => {
    // 生成默认的 ProjectSchema
    // 注意：在产品列表页面创建产品时使用空的 componentsMap
    // 编辑器打开产品时会自动加载正确的组件映射
    const defaultProjectSchema = {
      componentsTree: [DefaultPageSchema],
      componentsMap: {}, // 使用空对象，编辑器会在加载时填充
      version: '1.0.0',
      i18n: DefaultI18nSchema,
    };
    
    const newProduct: Product = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schema: defaultProjectSchema, // 添加默认 schema
    };
    
    set((state) => ({
      products: [...state.products, newProduct],
    }));
    
    // 发布到后端
    try {
      // 从全局设置获取产品路径
      const globalSettings = useGlobalSettingsStore.getState();
      const productPath = globalSettings.settings.paths.productPath || './data/products';
      
      // 构建完整的产品数据对象（包含元数据和 schema）
      const productWithMetadata = {
        id: newProduct.id,
        name: newProduct.name,
        description: newProduct.description,
        createdAt: newProduct.createdAt,
        updatedAt: newProduct.updatedAt,
        projectSchema: defaultProjectSchema, // 实际的 ProjectSchema
        schema: defaultProjectSchema, // 兼容性字段
      };
      
      // 使用驼峰命名的产品名称作为文件名
      const fileName = toCamelCase(newProduct.name) || newProduct.id;
      
      await fetch(API_ENDPOINTS.publish, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `${productPath}/${fileName}.json`,
          schema: productWithMetadata,
          productId: newProduct.id,
        }),
      });
      console.log(`✓ 新产品已保存: ${newProduct.id}，包含默认 schema`);
    } catch (err) {
      console.warn('产品保存到服务器失败:', err);
    }
    
    return newProduct;
  },
  
  updateProduct: async (id: string, data: Partial<Product>) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id
          ? {
              ...p,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));
    
    // 发布到后端
    try {
      // 从全局设置获取产品路径
      const globalSettings = useGlobalSettingsStore.getState();
      const productPath = globalSettings.settings.paths.productPath || './data/products';
      
      const product = get().products.find((p) => p.id === id);
      if (product) {
        // 确保发送的数据包含完整的元数据，包括 id
        const productWithMetadata = {
          id: product.id,
          name: product.name,
          description: product.description,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          projectSchema: product.schema, // 实际的 schema
          schema: product.schema, // 兼容性字段
        };
        
        // 使用驼峰命名的产品名称作为文件名
        const fileName = toCamelCase(product.name) || id;
        
        await fetch(API_ENDPOINTS.publish, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: `${productPath}/${fileName}.json`,
            schema: productWithMetadata,
            productId: id,
          }),
        });
      }
    } catch (err) {
      console.warn('产品更新到服务器失败:', err);
    }
  },
  
  deleteProduct: async (id: string) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      currentProductId: state.currentProductId === id ? null : state.currentProductId,
    }));
  },
  
  setCurrentProduct: (id: string | null) => {
    set({ currentProductId: id });
  },
  
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      // 从全局设置获取产品路径
      const globalSettings = useGlobalSettingsStore.getState();
      const productPath = globalSettings.settings.paths.productPath || './data/products';
      
      console.log(`[ProductStore] 正在加载产品，路径: ${productPath}`);
      
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.products, { path: productPath })
      );
      if (!response.ok) {
        throw new Error(`获取产品列表失败: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        // 从 API 响应中提取产品信息
        const products = data.data.map((item: any) => {
          // API 返回的数据可能在 item.projectSchema 或 item.schema 中
          // 优先使用 projectSchema（是实际的 ProjectSchema）
          const schema = item.projectSchema || item.schema || {};
          
          return {
            id: item.id,
            name: item.name,
            description: item.description || '',
            schema: schema,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        });
        console.log(`[ProductStore] ✓ 成功加载 ${products.length} 个产品`, {
          products_ids: products.map(p => p.id),
        });
        set({ products, isLoading: false });
      } else {
        throw new Error(data.message || '获取产品列表失败');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      set({ error, isLoading: false });
      console.error('[ProductStore] 获取产品列表失败:', error);
    }
  },
}));


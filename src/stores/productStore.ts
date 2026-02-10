/**
 * 产品数据存储 - 使用 Zustand 管理产品列表
 */

import create from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductFormData } from '../types/product';

interface ProductStore {
  /** 产品列表 */
  products: Product[];
  
  /** 当前编辑的产品ID */
  currentProductId: string | null;
  
  /** 获取所有产品 */
  getProducts: () => Product[];
  
  /** 根据ID获取产品 */
  getProductById: (id: string) => Product | undefined;
  
  /** 添加新产品 */
  addProduct: (data: ProductFormData) => Product;
  
  /** 更新产品 */
  updateProduct: (id: string, data: Partial<Product>) => void;
  
  /** 删除产品 */
  deleteProduct: (id: string) => void;
  
  /** 设置当前产品 */
  setCurrentProduct: (id: string | null) => void;
  
  /** 初始化产品列表(从localStorage加载) */
  initProducts: () => void;
  
  /** 保存产品列表到localStorage */
  saveProducts: () => void;
}

const STORAGE_KEY = 'lowcode_products';

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  currentProductId: null,
  
  getProducts: () => get().products,
  
  getProductById: (id: string) => {
    return get().products.find((p) => p.id === id);
  },
  
  addProduct: (data: ProductFormData) => {
    const newProduct: Product = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    set((state) => ({
      products: [...state.products, newProduct],
    }));
    
    get().saveProducts();
    return newProduct;
  },
  
  updateProduct: (id: string, data: Partial<Product>) => {
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
    
    get().saveProducts();
  },
  
  deleteProduct: (id: string) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      currentProductId: state.currentProductId === id ? null : state.currentProductId,
    }));
    
    get().saveProducts();
  },
  
  setCurrentProduct: (id: string | null) => {
    set({ currentProductId: id });
  },
  
  initProducts: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const products = JSON.parse(stored);
        set({ products });
      }
    } catch (error) {
      console.error('Failed to load products from localStorage:', error);
    }
  },
  
  saveProducts: () => {
    try {
      const products = get().products;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Failed to save products to localStorage:', error);
    }
  },
}));

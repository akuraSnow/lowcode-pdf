/**
 * 获取产品列表的自定义 Hook
 * 从后端 API 获取所有产品，并支持自定义产品路径
 */

import { useEffect, useState } from 'react';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
  schema: any;
}

interface UseProductsOptions {
  productPath?: string;
  autoFetch?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 获取产品列表 Hook
 * @param options - 配置选项
 * @returns 产品列表、加载状态、错误信息和刷新方法
 * 
 * @example
 * const { products, isLoading, error } = useProducts();
 * 
 * @example
 * const { products, refetch } = useProducts({ 
 *   productPath: './data/products',
 *   autoFetch: true 
 * });
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { productPath, autoFetch = true } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 构建请求 URL
      const url = productPath
        ? buildApiUrl(API_ENDPOINTS.products, { path: productPath })
        : API_ENDPOINTS.products;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`获取产品列表失败: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
      } else {
        throw new Error(data.message || '获取产品列表失败');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('获取产品列表异常:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [productPath, autoFetch]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}

/**
 * 获取单个产品的自定义 Hook
 * 从后端 API 或本地存储获取产品详细信息
 */

import { useEffect, useState } from 'react';
import { useProductStore } from '../stores/productStore';

export interface ProductDetail {
  id: string;
  name: string;
  description?: string;
  schema: any;
  createdAt: string;
  updatedAt: string;
}

interface UseProductDetailOptions {
  productId?: string;
  autoFetch?: boolean;
}

interface UseProductDetailReturn {
  product: ProductDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 获取单个产品详情 Hook
 * @param options - 配置选项
 * @returns 产品详情、加载状态、错误信息和刷新方法
 * 
 * @example
 * const { product, isLoading } = useProductDetail({ productId: 'product-1' });
 */
export function useProductDetail(options: UseProductDetailOptions = {}): UseProductDetailReturn {
  const { productId, autoFetch = true } = options;
  const products = useProductStore((state) => state.products);
  
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProduct = async () => {
    if (!productId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 首先从本地 store 中查找产品
      const localProduct = products.find((p) => p.id === productId);

      if (localProduct) {
        setProduct({
          id: localProduct.id,
          name: localProduct.name,
          description: localProduct.description,
          schema: localProduct.schema || {},
          createdAt: localProduct.createdAt,
          updatedAt: localProduct.updatedAt,
        });
      } else {
        throw new Error(`产品 ${productId} 不存在`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('获取产品详情异常:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && productId) {
      fetchProduct();
    }
  }, [productId, autoFetch]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  };
}

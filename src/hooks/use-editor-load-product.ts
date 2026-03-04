/**
 * 编辑器产品加载 Hook
 * 根据 productId 从 URL 参数获取产品，加载到编辑器中
 */

import { useEffect, useState } from 'react';
import { project } from '@alilc/lowcode-engine';
import { useProductStore } from '../stores/productStore';
import { useEditorStore } from '../stores/editorStore';
import { Message } from '@alifd/next';
import { restoreProjectSchema } from '../utils/schema-optimizer';

interface UseEditorLoadProductOptions {
  autoLoad?: boolean;
}

interface UseEditorLoadProductReturn {
  isLoading: boolean;
  error: Error | null;
  productId: string | null;
  loadProduct: (productId: string) => Promise<void>;
}

/**
 * 编辑器产品加载 Hook
 * 从 URL 查询参数获取 productId，并加载对应的产品 schema
 * 
 * @param options - 配置选项
 * @returns 加载状态和控制方法
 * 
 * @example
 * const { isLoading, productId, error } = useEditorLoadProduct();
 */
export function useEditorLoadProduct(
  options: UseEditorLoadProductOptions = {}
): UseEditorLoadProductReturn {
  const { autoLoad = true } = options;
  const products = useProductStore((state) => state.products);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  const loadProduct = async (pid: string) => {
    if (!pid) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 从产品 store 中查找产品
      const targetProduct = products.find((p) => p.id === pid);

      if (!targetProduct) {
        throw new Error(`产品 ${pid} 不存在`);
      }

      if (!targetProduct.schema) {
        console.warn(`产品 ${pid} 暂无设计数据，使用默认空 schema`);
      }

      // 恢复 schema 的默认值字段
      const schema = targetProduct.schema ? restoreProjectSchema(targetProduct.schema) : targetProduct.schema;

      // 检查是否是多页面格式
      if (schema && schema.pages && Array.isArray(schema.pages)) {
        console.log(`[加载产品] 检测到多页面格式，共 ${schema.pages.length} 个页面`);
        
        // 清空 editorStore 现有页面
        useEditorStore.setState({
          document: {
            pages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          currentPageId: '',
        });
        
        // 为每个页面创建 editorStore 页面
        const createdPageIds: string[] = [];
        for (let i = 0; i < schema.pages.length; i++) {
          const pageData = schema.pages[i];
          
          const newPageId = useEditorStore.getState().addPage({
            name: pageData.fileName || pageData.settings?.name || `Page ${i + 1}`,
          });
          
          createdPageIds.push(newPageId);
          
          // 更新页面内容
          const currentDocument = useEditorStore.getState().document;
          const pageIndex = currentDocument.pages.findIndex(p => p.settings.id === newPageId);
          
          if (pageIndex >= 0) {
            const updatedPages = [...currentDocument.pages];
            updatedPages[pageIndex] = {
              ...updatedPages[pageIndex],
              components: pageData.children || [],
            };
            
            useEditorStore.setState({
              document: {
                ...currentDocument,
                pages: updatedPages,
              },
            });
            
            console.log(`[加载产品] ✓ 已恢复页面 ${i + 1}: ${pageData.fileName}`);
          }
        }
        
        // 切换到第一个页面或保存的当前页面
        const targetPageId = schema.currentPageId && createdPageIds.includes(schema.currentPageId)
          ? schema.currentPageId
          : createdPageIds[0];
        
        if (targetPageId) {
          useEditorStore.getState().setCurrentPage(targetPageId);
          console.log(`[加载产品] ✓ 已切换到页面: ${targetPageId}`);
          
          // 立即加载第一页到画布
          setTimeout(() => {
            try {
              const currentDocument = useEditorStore.getState().document;
              const firstPage = currentDocument.pages.find(p => p.settings.id === targetPageId);
              
              if (firstPage && project.currentDocument) {
                console.log('[加载产品] 正在加载第一页到画布:', firstPage.settings.name);
                
                // 检查页面是否已有样式（避免覆盖原有样式）
                const pageStyle = firstPage.settings?.pageStyle || { height: '100%' };
                
                const pageSchema = {
                  version: '1.0.0',
                  componentsTree: [{
                    componentName: 'Page',
                    fileName: firstPage.settings.name || 'Page',
                    id: `${firstPage.settings.id}_${Date.now()}`,
                    props: {
                      ref: `page_${firstPage.settings.id}`,
                      style: pageStyle
                    },
                    children: firstPage.components || [],
                  }],
                };
                
                try {
                  project.importSchema(pageSchema as any);
                  console.log('[加载产品] ✓ 第一页已加载到画布');
                } catch (schemaError) {
                  console.error('[加载产品] Schema导入失败，尝试加载空页面:', schemaError);
                  // 如果导入失败，尝试导入空页面
                  const emptyPageSchema = {
                    version: '1.0.0',
                    componentsTree: [{
                      componentName: 'Page',
                      fileName: firstPage.settings.name || 'Page',
                      id: `${firstPage.settings.id}_${Date.now()}`,
                      props: { ref: `page_${firstPage.settings.id}`, style: pageStyle },
                      children: [],
                    }],
                  };
                  project.importSchema(emptyPageSchema as any);
                  console.warn('[加载产品] 已加载空页面作为降级方案');
                }
              }
            } catch (error) {
              console.error('[加载产品] 加载第一页到画布失败:', error);
            }
          }, 100);
        }
        
        Message.success(`已加载产品 "${targetProduct.name}"，共 ${schema.pages.length} 个页面`);
      } else {
        // 旧格式（单页面）兼容处理
        console.log(`[加载产品] 检测到单页面格式，使用兼容模式`);
        
        const singlePageSchema = schema || {
          version: '1.0.0',
          componentName: 'Page',
          props: {
            ref: 'page_abc',
            style: {
              height: '100%',
              paddingLeft: '83px',
              paddingRight: '83px',
              paddingTop: '10px',
              paddingBottom: '22px'
            }
          },
          children: [],
        };

        // 通过 project API 设置 schema
        if (project.currentDocument) {
          // 清空现有页面
          const existingPages = project.currentDocument.pages;
          if (existingPages && existingPages.length > 0) {
            // 保留第一个页面，更新其 schema
            const firstPage = existingPages[0];
            if (firstPage.importSchema) {
              firstPage.importSchema(singlePageSchema);
            }
          } else {
            // 如果没有页面，导入为新页面
            project.currentDocument.importSchema({
              version: '1.0.0',
              pages: [singlePageSchema],
            });
          }

          console.log(`✓ 已加载产品 "${targetProduct.name}" 的设计`);
        }
      }

      setProductId(pid);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('加载产品设计失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      // 从 URL 查询参数获取 productId
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('productId');

      if (pid) {
        loadProduct(pid);
      }
    }
  }, [autoLoad]);

  return {
    isLoading,
    error,
    productId,
    loadProduct,
  };
}

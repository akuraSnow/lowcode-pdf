/**
 * 发布功能插件 - 保存低代码平台JSON到指定路径
 */

import React from 'react';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { Button, Message, Dialog } from '@alifd/next';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useGlobalSettingsStore } from '../../stores/globalSettingsStore';
import { useEditorStore } from '../../stores/editorStore';
import { API_ENDPOINTS } from '../../config/api';
import { toCamelCase } from '../../utils';
import { useProductStore } from '../../stores/productStore';
import { optimizeProjectSchema } from '../../utils/schema-optimizer';

const PublishPlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      const { skeleton, config, project } = ctx;

      // 获取当前产品ID
      const getCurrentProductId = () => {
        return sessionStorage.getItem('currentProductId');
      };

      // 发布功能
      const handlePublish = async () => {
        const productId = getCurrentProductId();
        
        if (!productId) {
          Message.warning('请先选择或创建一个产品');
          return;
        }

        try {
          // 获取全局设置
          const globalSettings = useGlobalSettingsStore.getState().settings;
          const productPath = globalSettings.paths?.productPath || './data/products';

          // 先保存当前页面到 store
          try {
            const currentPageId = useEditorStore.getState().currentPageId;
            if (currentPageId && project.currentDocument) {
              const currentPageSchema = project.exportSchema();
              
              if (currentPageSchema && currentPageSchema.componentsTree && currentPageSchema.componentsTree[0]) {
                const currentDocument = useEditorStore.getState().document;
                const currentPageIndex = currentDocument.pages.findIndex(p => p.settings.id === currentPageId);
                
                if (currentPageIndex >= 0) {
                  const componentsToSave = JSON.parse(JSON.stringify(
                    currentPageSchema.componentsTree[0].children || []
                  ));
                  
                  const updatedPages = [...currentDocument.pages];
                  updatedPages[currentPageIndex] = {
                    ...updatedPages[currentPageIndex],
                    components: componentsToSave,
                  };
                  
                  useEditorStore.setState({
                    document: {
                      ...currentDocument,
                      pages: updatedPages,
                      updatedAt: new Date(),
                    },
                  });
                  
                  console.log('[发布] 已保存当前页面到 store');
                }
              }
            }
          } catch (error) {
            console.warn('[发布] 保存当前页面失败:', error);
          }

          // 从 editorStore 获取所有页面数据
          const editorState = useEditorStore.getState();
          const allPages = editorState.document.pages;
          
          console.log(`[发布] 准备发布 ${allPages.length} 个页面`);
          
          // 构建包含所有页面的完整 schema
          const multiPageSchema = {
            version: '1.0.0',
            pages: allPages.map((page, index) => ({
              componentName: 'Page',
              id: page.settings.id,
              fileName: page.settings.name || `Page ${index + 1}`,
              props: {
                ref: `page_${page.settings.id}`,
                style: {
                  height: '100%',
                  paddingLeft: '83px',
                  paddingRight: '83px',
                  paddingTop: '10px',
                  paddingBottom: '22px'
                }
              },
              children: page.components || [],
              settings: page.settings,
            })),
            currentPageId: editorState.currentPageId,
            metadata: {
              totalPages: allPages.length,
              updatedAt: new Date().toISOString(),
            }
          };

          // 获取产品名称用于生成文件名
          const products = useProductStore.getState().products;
          const currentProduct = products.find(p => p.id === productId);
          const fileName = currentProduct ? toCamelCase(currentProduct.name) : productId;
          
          // 简化 schema 以减小文件大小
          const optimizedSchema = optimizeProjectSchema(multiPageSchema);
          
          console.log('[发布] Schema 优化完成');
          
          // 显示确认对话框
          Dialog.confirm({
            title: '确认发布',
            content: `确定要发布产品 ${currentProduct?.name || productId} 吗？\n这将保存所有 ${allPages.length} 个页面的修改。\n文件名: ${fileName}.json`,
            onOk: async () => {
              try {
                Message.loading('正在发布...', 0);

                // 发送到后端 API（使用优化后的 schema）
                const response = await fetch(API_ENDPOINTS.publish, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    path: `${productPath}/${fileName}.json`,
                    schema: optimizedSchema,
                    productId: productId,
                  }),
                });

                Message.hide();

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(`发布失败: ${response.statusText} - ${errorData.message || ''}`);
                }

                const result = await response.json();
                Message.success(`发布成功！已保存 ${allPages.length} 个页面。正在返回主页...`);

                // 延迟 1 秒后返回主页
                setTimeout(() => {
                  window.location.href = '/';
                }, 1000);

              } catch (error) {
                Message.hide();
                console.error('发布失败:', error);
                Message.error(error instanceof Error ? error.message : '发布失败');
              }
            },
          });

        } catch (error) {
          console.error('准备发布时出错:', error);
          Message.error('准备发布时出错');
        }
      };

      // 注册顶部发布按钮
      skeleton.add({
        area: 'topArea',
        type: 'Widget',
        name: 'publishButton',
        content: Button,
        contentProps: {
          type: 'primary',
          children: (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CloudUploadOutlined style={{ fontSize: '16px' }} />
              <span>发布</span>
            </span>
          ),
          onClick: handlePublish,
          style: {
            fontSize: '14px',
            fontWeight: 500,
            padding: '4px 16px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        props: {
          align: 'right',
          width: 100,
        },
      });

      // 将发布功能暴露给其他插件（如果需要从 FAB 调用）
      config.set('publishAction', handlePublish);
    },
  };
};

PublishPlugin.pluginName = 'PublishPlugin';
PublishPlugin.meta = {
  preferenceDeclaration: {
    title: '发布插件配置',
    properties: [],
  },
};

export default PublishPlugin;

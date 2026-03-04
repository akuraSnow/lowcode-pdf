import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { injectAssets } from '@alilc/lowcode-plugin-inject';
import assets from '../../services/assets.json';
import { getProjectSchema } from '../../services/mockService';
import DefaultI18nSchema from '../../services/defaultI18nSchema.json';
import { useGlobalSettingsStore } from '../../stores/globalSettingsStore';
import { API_ENDPOINTS, buildApiUrl } from '../../config/api';
import { restoreProjectSchema } from '../../utils/schema-optimizer';

const EditorInitPlugin = (ctx: IPublicModelPluginContext, options: any) => {
  return {
    async init() {
      try {
        console.log('[EditorInit] 开始初始化编辑器...');
        
        const { material, project, config } = ctx;
        
        // 检查必要的对象是否存在
        if (!material) {
          console.error('[EditorInit] ✗ material 对象未定义');
          throw new Error('material object is undefined');
        }
        if (!project) {
          console.error('[EditorInit] ✗ project 对象未定义');
          throw new Error('project object is undefined');
        }
        if (!config) {
          console.error('[EditorInit] ✗ config 对象未定义');
          throw new Error('config object is undefined');
        }
        
        const scenarioName = options['scenarioName'];
        const scenarioDisplayName = options['displayName'] || scenarioName;
        const scenarioInfo = options['info'] || {};
        
        console.log('[EditorInit] 上下文对象验证通过');
        
        // 保存在 config 中用于引擎范围其他插件使用
        config.set('scenarioName', scenarioName);
        config.set('scenarioDisplayName', scenarioDisplayName);
        config.set('scenarioInfo', scenarioInfo);

        // 设置物料描述
        await material.setAssets(await injectAssets(assets));
        console.log('[EditorInit] ✓ 物料已加载');

        // 从 URL 参数检查是否需要加载特定产品
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('productId');

        let schema;
        
        if (productId) {
          console.log(`[EditorInit] 正在加载产品: ${productId}`);
          
          // 如果有 productId，按优先级加载：
          // 1. 首先尝试从后端 API 加载发布的产品数据
          // 2. 然后从本地 localStorage 加载
          // 3. 最后使用默认 schema
          
          try {
            // 从全局设置获取产品保存路径
            const globalSettings = useGlobalSettingsStore.getState();
            const productPath = globalSettings.settings.paths.productPath || './data/products';
            console.log(`[EditorInit] 使用产品路径: ${productPath}`);
            
            // 尝试从后端 API 获取发布的产品
            const response = await fetch(buildApiUrl(API_ENDPOINTS.products, { path: productPath }));
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                // 从产品列表中查找对应的产品
                const product = data.data.find((p: any) => p.id === productId);
                if (product && product.schema) {
                  // 产品对象的 schema 字段可能包含：
                  // 1. 完整的 ProjectSchema（有 componentsTree）
                  // 2. 产品对象（有 id, name, projectSchema 字段）
                  let productSchema = product.schema;
                  
                  // 恢复 schema 的默认值字段
                  productSchema = restoreProjectSchema(productSchema);
                  
                  console.log(`[EditorInit] 获取的产品 schema 结构:`, {
                    has_componentsTree: !!productSchema.componentsTree,
                    has_projectSchema: !!productSchema.projectSchema,
                    has_componentName: !!productSchema.componentName,
                    has_pages: !!productSchema.pages,
                    schema_keys: Object.keys(productSchema).slice(0, 10),
                  });
                  
                  // 检查是否是多页面格式
                  if (productSchema.pages && Array.isArray(productSchema.pages)) {
                    // 多页面格式，需要将所有页面加载到 editorStore
                    console.log(`[EditorInit] ✓ 检测到多页面格式（${productSchema.pages.length} 页），正在加载所有页面到 editorStore`);
                    
                    // 导入 editorStore（动态导入以避免循环依赖）
                    import('../../stores/editorStore').then(({ useEditorStore }) => {
                      // 清空 editorStore 现有页面
                      useEditorStore.setState({
                        document: {
                          id: productSchema.id || product.id,
                          title: product.name,
                          description: product.description || '',
                          version: productSchema.version || '1.0.0',
                          pages: [],
                          createdAt: new Date(product.createdAt),
                          updatedAt: new Date(product.updatedAt),
                          resources: { images: [], css: [], functions: [] },
                          templates: [],
                        },
                        currentPageId: '',
                      });
                      
                      // 为每个页面创建 editorStore 页面
                      const createdPageIds: string[] = [];
                      for (let i = 0; i < productSchema.pages.length; i++) {
                        const pageData = productSchema.pages[i];
                        
                        const newPageId = useEditorStore.getState().addPage({
                          name: pageData.fileName || pageData.settings?.name || `Page ${i + 1}`,
                        });
                        
                        createdPageIds.push(newPageId);
                        
                        // 更新页面内容和样式
                        const currentDocument = useEditorStore.getState().document;
                        const pageIndex = currentDocument.pages.findIndex(p => p.settings.id === newPageId);
                        
                        if (pageIndex >= 0) {
                          const updatedPages = [...currentDocument.pages];
                          updatedPages[pageIndex] = {
                            ...updatedPages[pageIndex],
                            components: pageData.children || [],
                            settings: {
                              ...updatedPages[pageIndex].settings,
                              pageStyle: pageData.settings?.pageStyle || { height: '100%' },
                            }
                          };
                          
                          useEditorStore.setState({
                            document: {
                              ...currentDocument,
                              pages: updatedPages,
                            },
                          });
                          
                          console.log(`[EditorInit] ✓ 已恢复页面 ${i + 1}/${productSchema.pages.length}: ${pageData.fileName}`);
                        }
                      }
                      
                      // 切换到第一个页面或保存的当前页面
                      const targetPageId = productSchema.currentPageId && createdPageIds.includes(productSchema.currentPageId)
                        ? productSchema.currentPageId
                        : createdPageIds[0];
                      
                      if (targetPageId) {
                        useEditorStore.getState().setCurrentPage(targetPageId);
                        console.log(`[EditorInit] ✓ 已切换到页面: ${targetPageId}`);
                      }
                      
                      console.log(`[EditorInit] ✓ 所有页面已加载到 editorStore，共 ${createdPageIds.length} 个页面`);
                    });
                    
                    // 同时构建第一个页面的 schema 用于画布显示
                    if (productSchema.pages.length > 0) {
                      const firstPage = productSchema.pages[0];
                      
                      schema = {
                        version: '1.0.0',
                        componentsTree: [{
                          componentName: 'Page',
                          fileName: firstPage.fileName || firstPage.settings?.name || 'Page 1',
                          id: `page_${Date.now()}`,
                          props: {
                            ref: `page_${Date.now()}`,
                            style: firstPage.settings?.pageStyle || { height: '100%' }
                          },
                          children: firstPage.children || [],
                        }],
                        componentsMap: material.componentsMap as any,
                        i18n: DefaultI18nSchema,
                      };
                      
                      console.log(`[EditorInit] ✓ 已准备第一个页面的 schema 用于画布显示:`, {
                        pageName: firstPage.fileName || firstPage.settings?.name,
                        childrenCount: firstPage.children?.length || 0,
                      });
                    } else {
                      console.warn(`[EditorInit] ⚠️ 多页面格式但没有页面，使用默认 schema`);
                      schema = await getProjectSchema(scenarioName);
                    }
                  }
                  // 检查是否是完整的 ProjectSchema
                  else if (productSchema.componentsTree && Array.isArray(productSchema.componentsTree)) {
                    // 已经是完整的 ProjectSchema
                    schema = productSchema;
                    console.log(`[EditorInit] ✓ 检测到 ProjectSchema 结构，直接使用`);
                  } else if (productSchema.projectSchema && productSchema.projectSchema.componentsTree) {
                    // projectSchema 字段包含实际的 schema
                    schema = productSchema.projectSchema;
                    console.log(`[EditorInit] ✓ 从 projectSchema 字段提取 schema`);
                  } else if (productSchema.componentName) {
                    // 是单个页面 schema，需要包装
                    schema = {
                      componentsTree: [productSchema],
                      componentsMap: material.componentsMap as any,
                      version: '1.0.0',
                      i18n: DefaultI18nSchema,
                    };
                    console.log(`[EditorInit] ✓ 检测到页面 schema，进行包装`);
                  } else {
                    // 其他情况，尝试作为 ProjectSchema 使用
                    schema = productSchema;
                    console.log(`[EditorInit] ✓ 使用原始 schema 对象`);
                  }
                  console.log(`[EditorInit] ✓ 已从后端加载发布的产品内容: "${product.name}"`);
                }
              }
            }
          } catch (err) {
            console.warn(`[EditorInit] ⚠️ 无法从后端加载产品，尝试本地加载:`, err);
          }

          // 如果后端没有加载到，尝试从本地 localStorage 加载
          if (!schema) {
            const lowcodeProjectKey = `${productId}_project_schema`;
            const savedProductSchema = localStorage.getItem(lowcodeProjectKey);
            
            if (savedProductSchema) {
              try {
                let parsedSchema = JSON.parse(savedProductSchema);
                
                // 恢复 schema 的默认值字段
                parsedSchema = restoreProjectSchema(parsedSchema);
                
                // 同样检查是否需要包装
                if (parsedSchema.componentsTree && Array.isArray(parsedSchema.componentsTree)) {
                  schema = parsedSchema;
                } else if (parsedSchema.projectSchema && parsedSchema.projectSchema.componentsTree) {
                  schema = parsedSchema.projectSchema;
                } else if (parsedSchema.componentName) {
                  schema = {
                    componentsTree: [parsedSchema],
                    componentsMap: material.componentsMap as any,
                    version: '1.0.0',
                    i18n: DefaultI18nSchema,
                  };
                } else {
                  schema = parsedSchema;
                }
                console.log(`[EditorInit] ✓ 已从本地加载产品设计: "${productId}"`);
              } catch (err) {
                console.warn(`[EditorInit] ⚠️ 无法解析保存的产品 schema，使用默认 schema`);
                schema = await getProjectSchema(scenarioName);
              }
            }
          }

          // 如果还是没有加载到，使用默认 schema
          if (!schema) {
            console.log(`[EditorInit] ⚠️ 产品 "${productId}" 暂无发布内容，使用默认 schema`);
            schema = await getProjectSchema(scenarioName);
          }
        } else {
          // 没有 productId，使用默认 schema
          console.log('[EditorInit] 未指定 productId，使用默认 schema');
          schema = await getProjectSchema(scenarioName);
        }

        // 验证 schema 对象 - 但允许 null（多页面格式会在 use-editor-load-product 中处理）
        if (!schema) {
          console.log('[EditorInit] schema 为空，可能是多页面格式，将由 use-editor-load-product 处理');
          return; // 提前返回，不执行导入
        }
        
        console.log('[EditorInit] ✓ Schema 已准备就绪，准备导入编辑器');
        
        // 同步 schema 的 state 字段到 dataStore 的 pageData
        try {
          const { useDataStore } = await import('../../stores/dataStore');
          
          if (schema.componentsTree && schema.componentsTree[0]) {
            const pageSchema = schema.componentsTree[0];
            
            if (pageSchema.state) {
              const pageData: Record<string, any> = {};
              
              // 解析 schema.state 中的 JSExpression
              Object.keys(pageSchema.state).forEach(key => {
                const stateValue = pageSchema.state[key];
                
                if (stateValue && typeof stateValue === 'object') {
                  if (stateValue.type === 'JSExpression') {
                    // 解析 JSExpression 的值
                    try {
                      // 移除引号并解析
                      const value = stateValue.value.replace(/^"|"$/g, '');
                      pageData[key] = JSON.parse(value);
                    } catch (err) {
                      // 如果解析失败，尝试直接使用字符串值
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
              console.log('[EditorInit] ✓ 已同步 schema.state 到 pageData:', Object.keys(pageData));
            } else {
              console.log('[EditorInit] Schema 中没有 state 字段，跳过同步');
            }
          }
        } catch (err) {
          console.warn('[EditorInit] 同步 schema.state 到 pageData 失败:', err);
        }

        // 加载 schema 到编辑器 - 使用异步等待策略
        const waitForProjectReady = async () => {
          console.log('[EditorInit] 等待 project 对象完全初始化...');
          
          let attempts = 0;
          const maxAttempts = 20;
          
          // 优化：先快速检查几次（不延迟），大多数情况下 project 对象已经准备好
          const quickCheck = () => {
            return (
              project &&
              project.importSchema &&
              project.open &&
              project.simulator &&
              project.designer &&
              project.document
            );
          };
          
          // 快速检查 3 次（立即执行，无延迟）
          for (let i = 0; i < 3; i++) {
            if (quickCheck()) {
              console.log(`[EditorInit] ✓ project 对象已就绪 (快速检查第 ${i + 1} 次)`);
              return true;
            }
            // 使用微任务等待，让事件循环有机会完成初始化
            await new Promise(resolve => Promise.resolve().then(resolve));
          }
          
          // 如果快速检查失败，进入正常轮询模式
          while (attempts < maxAttempts) {
            attempts++;
            
            // 检查 project 是否完全初始化
            if (quickCheck()) {
              console.log(`[EditorInit] ✓ project 对象已就绪 (轮询第 ${attempts} 次)`);
              return true;
            }
            
            if (attempts <= 3 || attempts % 5 === 0) {
              console.log(`[EditorInit] 检查 project 对象状态 (第 ${attempts} 次):`, {
                importSchema: !!project?.importSchema,
                open: !!project?.open,
                simulator: !!project?.simulator,
                designer: !!project?.designer,
                document: !!project?.document,
              });
            }
            
            // 优化：使用指数退避策略
            // 前几次快速检查（50ms），后面逐渐增加延迟
            const delay = attempts < 3 ? 50 : attempts < 6 ? 100 : 300;
            
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          console.warn('[EditorInit] ⚠️ 达到最大检查次数，project 仍未完全初始化');
          console.warn('[EditorInit] 最终 project 对象状态:', {
            importSchema: typeof project?.importSchema,
            open: typeof project?.open,
            simulator: !!project?.simulator,
            designer: !!project?.designer,
            document: !!project?.document,
          });
          
          return false;
        };
        
        // 异步加载 schema
        waitForProjectReady().then(() => {
          try {
            console.log('[EditorInit] 开始导入 schema...');
            project.importSchema(schema as any);
            console.log('[EditorInit] ✓ Schema 已成功导入编辑器');
          } catch (err) {
            console.error('[EditorInit] ✗ 导入 schema 时出错:', err);
            
            // 最后的手段：尝试延迟导入
            console.log('[EditorInit] 尝试使用延迟导入...');
            setTimeout(() => {
              try {
                project.importSchema(schema as any);
                console.log('[EditorInit] ✓ 延迟导入成功');
              } catch (delayedErr) {
                console.error('[EditorInit] ✗ 延迟导入也失败了:', delayedErr);
              }
            }, 2000);
          }
        });
      } catch (err) {
        console.error('[EditorInit] ✗ 初始化过程中出错:', err);
        throw err;
      }
    },
  };
};

EditorInitPlugin.pluginName = 'EditorInitPlugin';
EditorInitPlugin.meta = {
  preferenceDeclaration: {
    title: '保存插件配置',
    properties: [
      {
        key: 'scenarioName',
        type: 'string',
        description: '用于localstorage存储key',
      },
      {
        key: 'displayName',
        type: 'string',
        description: '用于显示的场景名',
      },
      {
        key: 'info',
        type: 'object',
        description: '用于扩展信息',
      }
    ],
  },
};

export default EditorInitPlugin;
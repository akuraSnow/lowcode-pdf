/**
 * 模板管理插件 - 保存和应用容器模板
 */

import { IPublicModelPluginContext, IPublicEnumTransformStage } from '@alilc/lowcode-types';
import { Button, Dialog, Input, Message, Card } from '@alifd/next';
import { useGlobalSettingsStore } from '../../stores/globalSettingsStore';
import { useEditorStore } from '../../stores/editorStore';
import { PageConfig } from '../../types';
import { API_ENDPOINTS } from '../../config/api';
import React from 'react';

interface Template {
  id: string;
  name: string;
  schema: any;
  thumbnail?: string;
  createdAt: string;
}

const TemplateManagerPlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      const { config, project, canvas } = ctx;
      
      // 从 Zustand store 读取全局设置
      const getGlobalSettings = () => {
        const store = useGlobalSettingsStore.getState();
        return store.settings;
      };
      
      // 从后端 API 获取模板列表
      const fetchTemplates = async (): Promise<Template[]> => {
        try {
          const globalSettings = getGlobalSettings();
          
          // 构建带路径参数的 API URL
          let apiUrl = API_ENDPOINTS.templates;
          if (globalSettings?.paths?.templatePath) {
            apiUrl = `${API_ENDPOINTS.templates}?path=${encodeURIComponent(globalSettings.paths.templatePath)}`;
          }
          
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
              return data.data;
            }
          }
        } catch (err) {
          console.warn('从 API 获取模板失败:', err);
        }
        return [];
      };
      
      // 从后端 API 获取模板
      const getTemplates = async (): Promise<Template[]> => {
        return await fetchTemplates();
      };
      
      // 保存模板到服务器文件系统
      const saveTemplateToServer = async (template: Template): Promise<boolean> => {
        try {
          const globalSettings = getGlobalSettings();
          
          // 安全检查：确保 paths 对象存在
          if (!globalSettings || !globalSettings.paths) {
            console.warn('全局设置缺失，使用默认路径');
            throw new Error('无法获取模板保存路径');
          }
          
          const templatePath = `${globalSettings.paths.templatePath}/${template.name}.json`;
          
          const response = await fetch(API_ENDPOINTS.publish, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: templatePath,
              schema: template, // 保存完整的模板对象，包含 id, name, schema, createdAt
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`保存失败: ${response.statusText} - ${errorData.message || ''}`);
          }
          
          return true;
        } catch (error) {
          console.error('保存模板到服务器失败:', error);
          throw error;
        }
      };
      
      // 保存选中的容器为模板
      const handleSaveAsTemplate = async () => {
        const selection = project.currentDocument?.selection;
        const selectedNode = selection?.getNodes()?.[0];
        
        if (!selectedNode) {
          Message.error('请先选择一个容器组件');
          return;
        }
        
        // 获取选中节点的schema - 使用正确的参数
        const nodeSchema = (selectedNode as any).exportSchema?.({});
        
        if (!nodeSchema) {
          Message.error('无法获取组件schema');
          return;
        }
        
        // 弹出对话框输入模板名称
        Dialog.show({
          title: '保存为模板',
          style: { width: '400px' },
          content: (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ marginBottom: '4px', fontWeight: 'bold', color: '#1890ff' }}>
                  ✓ 已选中组件: {selectedNode.componentName}
                </p>
                <p style={{ marginBottom: '0', fontSize: '12px', color: '#666' }}>
                  此组件及其子组件将被保存为模板
                </p>
              </div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                模板名称
              </label>
              <Input
                id="template-name-input"
                placeholder="输入模板名称，如：主卡片、顶部导航等"
                style={{ width: '100%' }}
              />
            </div>
          ),
          onOk: async () => {
            const input = document.getElementById('template-name-input') as HTMLInputElement;
            const templateName = input?.value?.trim();
            
            if (!templateName) {
              Message.error('模板名称不能为空');
              return false;
            }
            
            try {
              // 生成模板ID
              const templateId = `template_${Date.now()}`;
              
              // 创建模板对象
              const newTemplate: Template = {
                id: templateId,
                name: templateName,
                schema: nodeSchema,
                createdAt: new Date().toISOString(),
              };
              
              // 保存到服务器文件系统（保存完整的模板对象）
              await saveTemplateToServer(newTemplate);
              
              Message.success(`✓ 模板 "${templateName}" 已保存！`);
              Message.notice('可在"应用模板"中查看和应用此模板');
              return true;
            } catch (error) {
              console.error('保存模板失败:', error);
              const errorMsg = error instanceof Error ? error.message : '未知错误';
              Message.error(`保存模板失败: ${errorMsg}`);
              return false;
            }
          },
        });
      };
      
      // 显示模板库并应用模板
      const handleApplyTemplate = async () => {
        const templates = await getTemplates();
        
        if (templates.length === 0) {
          Message.warning('暂无可用模板，请先保存模板');
          return;
        }
        
        // 获取当前选中的容器
        const selection = project.currentDocument?.selection;
        const selectedNodes = selection?.getNodes() || [];
        const selectedNode = selectedNodes.length > 0 ? selectedNodes[0] : null;
        
        // 创建模板选择对话框
        let selectedTemplateId: string | null = null;
        type ApplyMode = 'toSelected' | 'toCurrentPageEnd' | 'toAllPages';
        type AllPagesPosition = 'start' | 'end';
        let applyMode: ApplyMode = (selectedNode ? 'toSelected' : 'toCurrentPageEnd') as ApplyMode;
        let allPagesPosition: AllPagesPosition = 'end';
        
        // 预览模板函数
        const previewTemplate = (template: Template) => {
          // 创建一个预览容器ID
          const previewContainerId = `template-preview-${Date.now()}`;
          
          // 显示对话框并保存引用以便关闭
          const dialogInstance = Dialog.show({
            title: `预览模板: ${template.name}`,
            style: { width: '80vw', maxWidth: '1200px' },
            footer: (
              <Button type="primary" onClick={() => dialogInstance.hide()}>
                关闭
              </Button>
            ),
            content: (
              <div style={{ 
                maxHeight: '70vh', 
                overflow: 'auto',
                display: 'flex',
                gap: '20px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
              }}>
                {/* 左侧：渲染预览 */}
                <div style={{ 
                  flex: '1',
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  minHeight: '400px'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                    🎨 视觉预览
                  </h4>
                  <div 
                    id={previewContainerId}
                    style={{ 
                      minHeight: '300px',
                      border: '1px solid #e8e8e8',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      overflow: 'auto'
                    }}
                  >
                    {/* 渲染加载提示 */}
                    <div style={{ 
                      padding: '40px', 
                      textAlign: 'center',
                      color: '#999',
                      fontSize: '14px'
                    }}>
                      正在渲染预览...
                    </div>
                  </div>
                </div>
                
                {/* 右侧：Schema 信息 */}
                <div style={{ 
                  flex: '1',
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  overflow: 'auto'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                    📋 组件信息
                  </h4>
                  
                  {/* 基本信息 */}
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#666' }}>模板名称:</strong>
                      <div style={{ marginTop: '4px', fontSize: '14px' }}>{template.name}</div>
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#666' }}>创建时间:</strong>
                      <div style={{ marginTop: '4px', fontSize: '14px' }}>
                        {new Date(template.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  
                  {/* 组件结构 */}
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                    <strong style={{ fontSize: '13px', color: '#666', marginBottom: '8px', display: 'block' }}>
                      组件结构:
                    </strong>
                    <div style={{ 
                      backgroundColor: '#fafafa',
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>类型:</strong> {template.schema?.componentName || '未知'}
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>ID:</strong> {template.schema?.id || '无'}
                      </div>
                      {template.schema?.children && (
                        <div>
                          <strong>子组件:</strong> {
                            Array.isArray(template.schema.children) 
                              ? template.schema.children.length 
                              : 1
                          } 个
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Schema JSON */}
                  <div>
                    <strong style={{ fontSize: '13px', color: '#666', marginBottom: '8px', display: 'block' }}>
                      Schema 代码:
                    </strong>
                    <pre style={{
                      backgroundColor: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '300px',
                      fontSize: '11px',
                      lineHeight: '1.5',
                      border: '1px solid #e0e0e0',
                      margin: 0,
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                    }}>
                      {JSON.stringify(template.schema, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ),
          });
          
          // 在 DOM 准备好后渲染模板
          setTimeout(() => {
            const container = document.getElementById(previewContainerId);
            if (!container) return;
            
            try {
              // 获取组件映射 - 尝试多种方式
              let componentsMap: any[] = [];
              
              // 从 ctx 获取 material
              if (ctx.material?.componentsMap) {
                if (Array.isArray(ctx.material.componentsMap)) {
                  componentsMap = ctx.material.componentsMap;
                } else if (typeof ctx.material.componentsMap === 'object') {
                  // 如果是对象，转换为数组
                  componentsMap = Object.values(ctx.material.componentsMap);
                }
              }
              
              // 尝试从 project 获取
              if (componentsMap.length === 0 && project?.currentDocument) {
                const docComponentsMap = project.currentDocument.getComponentsMap?.();
                if (Array.isArray(docComponentsMap)) {
                  componentsMap = docComponentsMap;
                }
              }
              
              // 清空容器
              container.innerHTML = '';
              
              // 创建渲染容器
              const renderContainer = document.createElement('div');
              renderContainer.style.padding = '20px';
              renderContainer.style.minHeight = '200px';
              container.appendChild(renderContainer);
              
              // 使用 React 渲染
              const React = (window as any).React;
              const ReactDOM = (window as any).ReactDOM;
              
              if (!React || !ReactDOM) {
                container.innerHTML = `
                  <div style="padding: 40px; text-align: center; color: #999;">
                    <p>⚠️ 渲染引擎未就绪</p>
                    <p style="font-size: 12px;">请在编辑器环境中打开预览</p>
                  </div>
                `;
                return;
              }
              
              // 递归渲染组件树
              const renderNode = (nodeSchema: any): any => {
                if (!nodeSchema) return null;
                
                const { componentName, props = {}, children, id } = nodeSchema;
                
                // 获取组件
                let Component: any = null;
                
                // 从 componentsMap 中查找组件
                if (componentsMap.length > 0) {
                  const componentMeta = componentsMap.find(
                    (comp: any) => comp.componentName === componentName
                  );
                  
                  if (componentMeta?.component) {
                    Component = componentMeta.component;
                  }
                }
                
                // 如果还没找到，尝试从全局获取
                if (!Component) {
                  // 尝试从全局获取
                  const globalLibs = (window as any);
                  if (componentName.startsWith('FD')) {
                    // Fusion Design 组件 - 尝试多个位置
                    const shortName = componentName.replace('FD', '');
                    Component = globalLibs.AlifdLayout?.[componentName] || 
                               globalLibs.AlifdLayout?.[shortName] ||
                               globalLibs.Next?.[componentName] ||
                               globalLibs.Next?.[shortName] ||
                               globalLibs[componentName];
                  } else if (componentName.startsWith('Next')) {
                    // Next 组件
                    const shortName = componentName.replace('Next', '');
                    Component = globalLibs.Next?.[componentName] ||
                               globalLibs.Next?.[shortName] ||
                               globalLibs[componentName];
                  } else {
                    // 其他组件，直接从全局查找
                    Component = globalLibs[componentName];
                  }
                }
                
                // 如果没有找到组件，使用 div 模拟并应用样式
                if (!Component) {
                  // 使用简单的 div 模拟组件，仅应用原有样式，不添加额外装饰
                  const extractTextContent = (content: any): string => {
                    if (typeof content === 'string') return content;
                    if (Array.isArray(content)) {
                      return content.map(extractTextContent).join('');
                    }
                    if (content?.componentName) {
                      return extractTextContent(content.props?.children || content.children);
                    }
                    return '';
                  };
                  
                  return React.createElement('div', {
                    key: id,
                    style: props.style || {}
                  }, (() => {
                    // 处理子元素
                    if (children) {
                      if (Array.isArray(children)) {
                        return children.map((child: any, index: number) => {
                          if (typeof child === 'string') {
                            return child;
                          }
                          return renderNode(child);
                        });
                      } else if (typeof children === 'object' && children.componentName) {
                        return renderNode(children);
                      } else {
                        return children;
                      }
                    }
                    // 如果没有 children，尝试从 props.children 提取文本
                    return extractTextContent(props.children);
                  })());
                }
                
                // 处理子元素
                let childElements = null;
                if (children) {
                  if (Array.isArray(children)) {
                    childElements = children.map((child: any, index: number) => {
                      if (typeof child === 'string') {
                        return child;
                      }
                      return renderNode(child);
                    });
                  } else if (typeof children === 'object' && children.componentName) {
                    childElements = renderNode(children);
                  } else {
                    childElements = children;
                  }
                }
                
                // 合并 props.children 和 children
                const finalProps = {
                  ...props,
                  key: id,
                  children: props.children || childElements
                };
                
                return React.createElement(Component, finalProps);
              };
              
              // 渲染模板
              const element = renderNode(template.schema);
              
              if (ReactDOM.render) {
                ReactDOM.render(element, renderContainer);
              } else if ((ReactDOM as any).createRoot) {
                // React 18+
                const root = (ReactDOM as any).createRoot(renderContainer);
                root.render(element);
              } else {
                container.innerHTML = `
                  <div style="padding: 40px; text-align: center; color: #999;">
                    <p>⚠️ ReactDOM 渲染方法不可用</p>
                  </div>
                `;
              }
              
            } catch (error) {
              console.error('预览渲染失败:', error);
              container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #ff4d4f;">
                  <p>❌ 渲染失败</p>
                  <p style="font-size: 12px; color: #999; margin-top: 8px;">${String(error)}</p>
                </div>
              `;
            }
          }, 100);
        };
        
        // 生成模板预览内容
        const generatePreview = (schema: any): string => {
          if (!schema) return '无预览';
          
          const componentName = schema.componentName || '未知组件';
          const childrenCount = schema.children ? (Array.isArray(schema.children) ? schema.children.length : 1) : 0;
          
          let preview = `📦 ${componentName}`;
          if (childrenCount > 0) {
            preview += ` (${childrenCount} 个子组件)`;
          }
          
          return preview;
        };
        
        Dialog.show({
          title: '选择模板',
          style: { width: '900px', maxWidth: '90vw' },
          content: (
            <div>
              {/* 克隆选项区域 */}
              <div style={{ 
                marginBottom: '16px', 
                padding: '16px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '8px',
                border: '1px solid #d9d9d9'
              }}>
                <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                  📍 选择应用位置
                </div>
                
                {/* 选项1: 克隆到选中的容器 */}
                {selectedNode && (
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '12px', 
                    cursor: 'pointer',
                    padding: '8px',
                    backgroundColor: applyMode === 'toSelected' ? '#e6f7ff' : '#fff',
                    borderRadius: '4px',
                    border: applyMode === 'toSelected' ? '2px solid #1890ff' : '2px solid transparent'
                  }}>
                    <input
                      type="radio"
                      name="applyMode"
                      value="toSelected"
                      defaultChecked={applyMode === 'toSelected'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          applyMode = 'toSelected' as ApplyMode;
                          // 更新UI
                          e.target.closest('div')?.querySelectorAll('label').forEach(label => {
                            (label as HTMLElement).style.backgroundColor = '#fff';
                            (label as HTMLElement).style.border = '2px solid transparent';
                          });
                          const currentLabel = e.target.closest('label') as HTMLElement;
                          currentLabel.style.backgroundColor = '#e6f7ff';
                          currentLabel.style.border = '2px solid #1890ff';
                          // 隐藏位置选项
                          const positionContainer = document.getElementById('allPagesPositionContainer');
                          if (positionContainer) {
                            positionContainer.style.display = 'none';
                          }
                        }
                      }}
                      style={{ marginRight: '8px', marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        1️⃣ 克隆到选中的容器里
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        已选中: <span style={{ color: '#1890ff' }}>{selectedNode.componentName}</span>
                      </div>
                    </div>
                  </label>
                )}
                
                {/* 选项2: 克隆到当前页最后 */}
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  marginBottom: '12px', 
                  cursor: 'pointer',
                  padding: '8px',
                  backgroundColor: applyMode === 'toCurrentPageEnd' ? '#e6f7ff' : '#fff',
                  borderRadius: '4px',
                  border: applyMode === 'toCurrentPageEnd' ? '2px solid #1890ff' : '2px solid transparent'
                }}>
                  <input
                    type="radio"
                    name="applyMode"
                    value="toCurrentPageEnd"
                    defaultChecked={applyMode === 'toCurrentPageEnd'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        applyMode = 'toCurrentPageEnd';
                        // 更新UI
                        e.target.closest('div')?.querySelectorAll('label').forEach(label => {
                          (label as HTMLElement).style.backgroundColor = '#fff';
                          (label as HTMLElement).style.border = '2px solid transparent';
                        });
                        const currentLabel = e.target.closest('label') as HTMLElement;
                        currentLabel.style.backgroundColor = '#e6f7ff';
                        currentLabel.style.border = '2px solid #1890ff';
                        // 隐藏位置选项
                        const positionContainer = document.getElementById('allPagesPositionContainer');
                        if (positionContainer) {
                          positionContainer.style.display = 'none';
                        }
                      }
                    }}
                    style={{ marginRight: '8px', marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      2️⃣ 克隆到当前页最后
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      将模板添加到当前页面的末尾
                    </div>
                  </div>
                </label>
                
                {/* 选项3: 克隆到每一页 */}
                <label 
                  id="toAllPagesLabel"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    cursor: 'pointer',
                    padding: '8px',
                    backgroundColor: applyMode === 'toAllPages' ? '#e6f7ff' : '#fff',
                    borderRadius: '4px',
                    border: applyMode === 'toAllPages' ? '2px solid #1890ff' : '2px solid transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="applyMode"
                    value="toAllPages"
                    defaultChecked={applyMode === 'toAllPages'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        applyMode = 'toAllPages';
                        // 更新UI
                        e.target.closest('div')?.querySelectorAll('label').forEach(label => {
                          if (label.id !== 'toAllPagesLabel') {
                            (label as HTMLElement).style.backgroundColor = '#fff';
                            (label as HTMLElement).style.border = '2px solid transparent';
                          }
                        });
                        const currentLabel = e.target.closest('label') as HTMLElement;
                        currentLabel.style.backgroundColor = '#e6f7ff';
                        currentLabel.style.border = '2px solid #1890ff';
                        // 显示位置选项
                        const positionContainer = document.getElementById('allPagesPositionContainer');
                        if (positionContainer) {
                          positionContainer.style.display = 'block';
                        }
                      }
                    }}
                    style={{ marginRight: '8px', marginTop: '3px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      3️⃣ 克隆到每一页
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      将模板复制到项目中的所有页面
                    </div>
                    
                    {/* 子选项：克隆位置 */}
                    <div 
                      id="allPagesPositionContainer"
                      style={{ 
                        marginLeft: '16px', 
                        paddingLeft: '12px', 
                        borderLeft: '2px solid #d9d9d9',
                        display: applyMode === 'toAllPages' ? 'block' : 'none',
                        backgroundColor: '#fff9e6',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        marginTop: '4px'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#fa8c16' }}>
                        📍 选择位置:
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="allPagesPosition"
                          value="start"
                          onChange={(e) => {
                            if (e.target.checked) {
                              allPagesPosition = 'start';
                            }
                          }}
                          style={{ marginRight: '6px' }}
                        />
                        <span style={{ fontSize: '13px', color: '#333' }}>⬆️ 每一页的最前面</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="allPagesPosition"
                          value="end"
                          defaultChecked={true}
                          onChange={(e) => {
                            if (e.target.checked) {
                              allPagesPosition = 'end';
                            }
                          }}
                          style={{ marginRight: '6px' }}
                        />
                        <span style={{ fontSize: '13px', color: '#333' }}>⬇️ 每一页的最后面</span>
                      </label>
                    </div>
                  </div>
                </label>
              </div>
              
              {/* 模板列表标题 */}
              <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                📑 选择模板
              </div>
              
              <div style={{ 
                maxHeight: '500px', 
                overflow: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '12px',
                padding: '4px'
              }}>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    id={`template-${template.id}`}
                    className="template-card"
                    onClick={() => {
                      selectedTemplateId = template.id;
                      // 高亮选中的卡片
                      document.querySelectorAll('.template-card').forEach((el) => {
                        (el as HTMLElement).style.border = '2px solid #e6e6e6';
                        (el as HTMLElement).style.backgroundColor = '#fff';
                      });
                      const selectedCard = document.getElementById(`template-${template.id}`);
                      if (selectedCard) {
                        selectedCard.style.border = '2px solid #1890ff';
                        selectedCard.style.backgroundColor = '#f0f7ff';
                      }
                    }}
                    style={{
                      border: '2px solid #e6e6e6',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '160px'
                    }}
                    onMouseEnter={(e) => {
                      if (!(e.currentTarget as HTMLElement).style.backgroundColor.includes('#f0f7ff')) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#fafafa';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(e.currentTarget as HTMLElement).style.backgroundColor.includes('#f0f7ff')) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#fff';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* 模板图标区域 */}
                    <div style={{
                      flex: 1,
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      color: '#1890ff'
                    }}>
                      📄
                    </div>
                    
                    {/* 模板信息 */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '14px', 
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {template.name}
                      </div>
                      <div style={{ color: '#999', fontSize: '11px' }}>
                        {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    
                    {/* 操作按钮组 */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        type="primary"
                        size="small"
                        style={{ flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          previewTemplate(template);
                        }}
                      >
                        预览
                      </Button>
                      <Button
                        type="secondary"
                        size="small"
                        warning
                        style={{ flex: 1 }}
                        onClick={(e) => {
                        e.stopPropagation();
                        Dialog.confirm({
                          title: '确认删除',
                          content: `确定要删除模板 "${template.name}" 吗？`,
                          onOk: async () => {
                            try {
                              const globalSettings = getGlobalSettings();
                              
                              // 构建带路径参数的删除 API URL
                              let deleteUrl = API_ENDPOINTS.templateById(template.id);
                              if (globalSettings?.paths?.templatePath) {
                                deleteUrl = `${deleteUrl}?path=${encodeURIComponent(globalSettings.paths.templatePath)}`;
                              }
                              
                              // 调用后端 API 删除模板
                              const response = await fetch(deleteUrl, { method: 'DELETE' });
                              
                              if (response.ok) {
                                Message.success('模板已删除');
                                // 重新打开对话框
                                setTimeout(() => handleApplyTemplate(), 100);
                              } else {
                                Message.error('删除失败，请重试');
                              }
                            } catch (err) {
                              console.warn('删除模板失败:', err);
                              Message.warning('无法连接服务器，删除失败');
                            }
                          },
                        });
                      }}
                    >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
          onOk: () => {
            if (!selectedTemplateId) {
              Message.warning('请选择一个模板');
              return false;
            }
            
            const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
            if (!selectedTemplate) {
              Message.error('模板不存在');
              return false;
            }
            
            try {
              // 根据选择的模式应用模板
              switch (applyMode) {
                case 'toSelected':
                  // 克隆到选中的容器
                  if (!selectedNode) {
                    Message.error('未选中容器');
                    return false;
                  }
                  const children = selectedNode.children;
                  if (children) {
                    children.importSchema(selectedTemplate.schema);
                    Message.success(`✓ 模板 "${selectedTemplate.name}" 已克隆到容器 "${selectedNode.componentName}" 中！`);
                  } else {
                    Message.error('所选容器不支持子组件');
                    return false;
                  }
                  break;
                  
                case 'toCurrentPageEnd':
                  // 克隆到当前页最后
                  const rootNode = project.currentDocument?.root;
                  if (rootNode) {
                    rootNode.children?.importSchema(selectedTemplate.schema);
                    Message.success(`✓ 模板 "${selectedTemplate.name}" 已添加到当前页面末尾！`);
                  } else {
                    Message.error('无法获取当前页面根节点');
                    return false;
                  }
                  break;
                  
                case 'toAllPages':
                  // 克隆到每一页
                  try {
                    const editorStore = useEditorStore.getState();
                    const allPages = editorStore.document.pages;
                    
                    if (!allPages || allPages.length === 0) {
                      Message.error('项目中没有页面');
                      return false;
                    }
                    
                    let successCount = 0;
                    let errorPages: string[] = [];
                    const currentPageId = editorStore.currentPageId;
                    
                    // 保存当前页面的更改到 editorStore
                    const currentPageSchema = project.exportSchema(IPublicEnumTransformStage.Save);
                    if (currentPageSchema && currentPageSchema.componentsTree && currentPageSchema.componentsTree[0]) {
                      const currentPageIndex = allPages.findIndex((p: PageConfig) => p.settings.id === currentPageId);
                      if (currentPageIndex >= 0) {
                        const componentsToSave = JSON.parse(JSON.stringify(
                          currentPageSchema.componentsTree[0].children || []
                        ));
                        
                        // 创建新的页面数组和页面对象，避免修改只读属性
                        const newPages = allPages.map((p: PageConfig) => {
                          if (p.settings.id === currentPageId) {
                            return {
                              ...p,
                              components: componentsToSave
                            };
                          }
                          return p;
                        });
                        
                        // 更新整个 document
                        useEditorStore.setState((state: any) => ({
                          ...state,
                          document: {
                            ...state.document,
                            pages: newPages,
                            updatedAt: new Date()
                          }
                        }));
                      }
                    }
                    
                    // 获取最新的页面数据
                    const updatedPages = useEditorStore.getState().document.pages;
                    
                    // 遍历所有页面，添加模板
                    const pagesWithTemplate = updatedPages.map((page: PageConfig, index: number) => {
                      try {
                        // 创建模板副本
                        const templateCopy = JSON.parse(JSON.stringify(selectedTemplate.schema));
                        
                        // 根据选择的位置添加组件
                        let newComponents;
                        if (allPagesPosition === 'start') {
                          // 添加到最前面
                          newComponents = [templateCopy, ...(page.components || [])];
                        } else {
                          // 添加到最后面
                          newComponents = [...(page.components || []), templateCopy];
                        }
                        
                        successCount++;
                        
                        // 返回新的页面对象
                        return {
                          ...page,
                          components: newComponents
                        };
                      } catch (error) {
                        console.error(`应用到页面 "${page.settings.name}" 失败:`, error);
                        errorPages.push(page.settings.name || `第${index + 1}页`);
                        return page;
                      }
                    });
                    
                    // 一次性更新所有页面
                    useEditorStore.setState((state: any) => ({
                      ...state,
                      document: {
                        ...state.document,
                        pages: pagesWithTemplate,
                        updatedAt: new Date()
                      }
                    }));
                    
                    // 刷新当前页面显示
                    const finalStore = useEditorStore.getState();
                    const currentPage = finalStore.document.pages.find((p: PageConfig) => p.settings.id === currentPageId);
                    if (currentPage) {
                      const schema = {
                        componentsTree: [{
                          componentName: 'Page',
                          id: 'page_root',
                          children: currentPage.components || []
                        }]
                      };
                      project.importSchema(schema as any);
                    }
                    
                    const positionText = allPagesPosition === 'start' ? '最前面' : '最后面';
                    if (errorPages.length === 0) {
                      Message.success(`✓ 模板 "${selectedTemplate.name}" 已成功克隆到所有 ${successCount} 个页面的${positionText}！`);
                    } else {
                      Message.warning(`模板已克隆到 ${successCount} 个页面的${positionText}，${errorPages.join('、')} 应用失败`);
                    }
                  } catch (error) {
                    console.error('应用模板到所有页面失败:', error);
                    Message.error('应用模板失败，请查看控制台');
                    return false;
                  }
                  break;
                  
                default:
                  Message.error('未知的应用模式');
                  return false;
              }
            } catch (error) {
              console.error('应用模板失败:', error);
              Message.error('应用模板失败，请查看控制台');
              return false;
            }
            
            return true;
          },
        });
      };

      // 将功能函数暴露到 config 中供统一操作插件使用
      config.set('saveTemplateAction', handleSaveAsTemplate);
      config.set('applyTemplateAction', handleApplyTemplate);
    },
  };
};

TemplateManagerPlugin.pluginName = 'TemplateManagerPlugin';
TemplateManagerPlugin.meta = {
  preferenceDeclaration: {
    title: '模板管理插件配置',
    properties: [],
  },
};

export default TemplateManagerPlugin;

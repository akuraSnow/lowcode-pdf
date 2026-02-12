/**
 * 模板管理插件 - 保存和应用容器模板
 */

import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { Button, Dialog, Input, Message, Card } from '@alifd/next';
import { useGlobalSettingsStore } from '../../stores/globalSettingsStore';

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
      const { skeleton, project, canvas } = ctx;
      
      // 从 Zustand store 读取全局设置
      const getGlobalSettings = () => {
        const store = useGlobalSettingsStore.getState();
        return store.settings;
      };
      
      // 获取本地存储的模板
      const getTemplates = (): Template[] => {
        const templates = localStorage.getItem('lowcode_templates');
        return templates ? JSON.parse(templates) : [];
      };
      
      // 保存模板到本地存储
      const saveTemplates = (templates: Template[]) => {
        localStorage.setItem('lowcode_templates', JSON.stringify(templates));
      };
      
      // 保存模板到服务器文件系统
      const saveTemplateToServer = async (templateName: string, schema: any): Promise<boolean> => {
        try {
          const globalSettings = getGlobalSettings();
          
          // 安全检查：确保 paths 对象存在
          if (!globalSettings || !globalSettings.paths) {
            console.warn('全局设置缺失，使用默认路径');
            throw new Error('无法获取模板保存路径');
          }
          
          const templatePath = `${globalSettings.paths.templatePath}/${templateName}.json`;
          
          const response = await fetch('http://localhost:3001/api/publish', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              savePath: templatePath,
              schema: schema,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`保存失败: ${response.statusText}`);
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
            
            // 生成模板ID
            const templateId = `template_${Date.now()}`;
            
            // 创建模板对象
            const newTemplate: Template = {
              id: templateId,
              name: templateName,
              schema: nodeSchema,
              createdAt: new Date().toISOString(),
            };
            
            try {
              // 1. 保存到本地存储（用于UI展示和快速访问）
              const templates = getTemplates();
              templates.push(newTemplate);
              saveTemplates(templates);
              
              // 2. 保存到服务器文件系统（持久化存储）
              await saveTemplateToServer(templateName, nodeSchema);
              
              Message.success(`✓ 模板 "${templateName}" 已保存！`);
              Message.notice('可在"应用模板"中查看和应用此模板');
              return true;
            } catch (error) {
              console.error('保存模板失败:', error);
              const errorMsg = error instanceof Error ? error.message : '未知错误';
              Message.error(`保存模板失败: ${errorMsg}`);
              
              // 如果保存到服务器失败，提示但仍保留本地副本
              Message.warning('模板已保存到本地，但保存到服务器失败');
              return true;
            }
          },
        });
      };
      
      // 显示模板库并应用模板
      const handleApplyTemplate = () => {
        const templates = getTemplates();
        
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
        let applyToSelected = selectedNode ? true : false;
        
        Dialog.show({
          title: '选择模板',
          style: { width: '600px' },
          content: (
            <div>
              {selectedNode && (
                <div style={{ 
                  marginBottom: '16px', 
                  padding: '12px', 
                  backgroundColor: '#e6f7ff', 
                  borderRadius: '4px',
                  borderLeft: '4px solid #1890ff'
                }}>
                  <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                    ✓ 已选中容器: <span style={{ color: '#1890ff' }}>{selectedNode.componentName}</span>
                  </p>
                  <p style={{ marginBottom: '0', fontSize: '12px', color: '#666' }}>
                    模板将克隆到此容器中，或取消勾选以添加到画布末尾
                  </p>
                  <label style={{ marginTop: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      defaultChecked={applyToSelected}
                      onChange={(e) => {
                        applyToSelected = e.target.checked;
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <span>克隆到选中的容器</span>
                  </label>
                </div>
              )}
              
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    style={{ marginBottom: '12px', cursor: 'pointer' }}
                    onClick={() => {
                      selectedTemplateId = template.id;
                      // 高亮选中的卡片
                      document.querySelectorAll('.template-card').forEach((el) => {
                        (el as HTMLElement).style.border = '1px solid #e6e6e6';
                        (el as HTMLElement).style.backgroundColor = 'transparent';
                      });
                      const selectedCard = document.getElementById(`template-${template.id}`);
                      if (selectedCard) {
                        selectedCard.style.border = '2px solid #1890ff';
                        selectedCard.style.backgroundColor = '#f0f7ff';
                      }
                    }}
                    id={`template-${template.id}`}
                    className="template-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                          {template.name}
                        </div>
                        <div style={{ color: '#999', fontSize: '12px' }}>
                          创建时间: {new Date(template.createdAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <Button
                        type="secondary"
                        size="small"
                        warning
                        onClick={(e) => {
                          e.stopPropagation();
                          Dialog.confirm({
                            title: '确认删除',
                            content: `确定要删除模板 "${template.name}" 吗？`,
                            onOk: () => {
                              const updatedTemplates = templates.filter(t => t.id !== template.id);
                              saveTemplates(updatedTemplates);
                              Message.success('模板已删除');
                              // 重新打开对话框
                              setTimeout(() => handleApplyTemplate(), 100);
                            },
                          });
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  </Card>
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
              // 根据是否选中容器，决定应用位置
              if (selectedNode && applyToSelected) {
                // 克隆到选中的容器
                const children = selectedNode.children;
                if (children) {
                  children.importSchema(selectedTemplate.schema);
                  Message.success(`模板 "${selectedTemplate.name}" 已克隆到容器中！`);
                } else {
                  Message.error('所选容器不支持子组件');
                  return false;
                }
              } else {
                // 添加到画布末尾
                const rootNode = project.currentDocument?.root;
                if (rootNode) {
                  rootNode.children?.importSchema(selectedTemplate.schema);
                  Message.success(`模板 "${selectedTemplate.name}" 已添加到画布！`);
                } else {
                  Message.error('无法获取根节点');
                  return false;
                }
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
      
      // 添加保存为模板按钮
      skeleton.add({
        area: 'topArea',
        type: 'Widget',
        name: 'saveTemplateButton',
        content: Button,
        contentProps: {
          children: '💾 保存为模板',
          onClick: handleSaveAsTemplate,
          style: {
            marginRight: '8px',
          },
        },
        props: {
          align: 'right',
          width: 120,
        },
      });
      
      // 添加应用模板按钮
      skeleton.add({
        area: 'topArea',
        type: 'Widget',
        name: 'applyTemplateButton',
        content: Button,
        contentProps: {
          children: '📚 应用模板',
          onClick: handleApplyTemplate,
          style: {
            marginRight: '8px',
          },
        },
        props: {
          align: 'right',
          width: 100,
        },
      });
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

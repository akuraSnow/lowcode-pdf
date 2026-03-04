import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { Button, Balloon, Upload, Message, Dialog } from '@alifd/next';
import { 
  HomeOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import React from 'react';
import ReactDOM from 'react-dom';
import { FloatingActionButton } from '../../components/FloatingActionButton';

/**
 * 统一操作面板插件
 * - 左上角：返回主页按钮
 * - 右下角：浮动操作按钮（导出、导入、保存模板、应用模板、上传文档等）
 */
const UnifiedActionsPlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      const { skeleton, project, material, config } = ctx;

      // 获取其他插件注册的功能函数
      // 这些函数会在各个插件初始化时注入到 config 中
      const getPluginAction = (actionName: string) => {
        return config.get(actionName);
      };

      // 添加返回主页按钮到左上角
      skeleton.add({
        area: 'topArea',
        type: 'Widget',
        name: 'backHomeButton',
        content: Button,
        contentProps: {
          type: 'primary',
          children: (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HomeOutlined style={{ fontSize: '16px' }} />
              <span>返回主页</span>
            </span>
          ),
          onClick: () => {
            window.location.href = '/';
          },
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
          align: 'left',
          width: 140,
        },
      });

      // 准备浮动按钮的操作列表
      const createFABActions = () => {
        const actions = [];

        // 导出 Schema
        actions.push({
          key: 'exportSchema',
          icon: <DownloadOutlined />,
          label: '导出Schema',
          onClick: () => {
            const schema = (project as any).exportSchema();
            const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `schema_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Message.success('Schema 导出成功');
          },
        });

        // 导出 PDF
        actions.push({
          key: 'exportPDF',
          icon: <FilePdfOutlined />,
          label: '导出PDF',
          onClick: () => {
            const exportPDFAction = getPluginAction('exportPDFAction');
            if (exportPDFAction && typeof exportPDFAction === 'function') {
              exportPDFAction();
            } else {
              Message.warning('PDF 导出功能暂未启用');
            }
          },
        });

        // 导入 Schema
        actions.push({
          key: 'importSchema',
          icon: <FileTextOutlined />,
          label: '导入Schema',
          onClick: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e: any) => {
              const file = e.target.files[0];
              if (!file) return;

              try {
                const text = await file.text();
                const schema = JSON.parse(text);
                project.importSchema(schema);
                Message.success('Schema 导入成功');
              } catch (err) {
                console.error('导入 Schema 失败:', err);
                Message.error('导入 Schema 失败');
              }
            };
            input.click();
          },
        });

        // 保存为模板
        actions.push({
          key: 'saveTemplate',
          icon: <SaveOutlined />,
          label: '保存为模板',
          onClick: () => {
            const saveTemplateAction = getPluginAction('saveTemplateAction');
            if (saveTemplateAction && typeof saveTemplateAction === 'function') {
              saveTemplateAction();
            } else {
              Message.warning('保存模板功能需要先加载模板管理插件');
            }
          },
        });

        // 应用模板
        actions.push({
          key: 'applyTemplate',
          icon: <FolderOpenOutlined />,
          label: '应用模板',
          onClick: () => {
            const applyTemplateAction = getPluginAction('applyTemplateAction');
            if (applyTemplateAction && typeof applyTemplateAction === 'function') {
              applyTemplateAction();
            } else {
              Message.warning('应用模板功能需要先加载模板管理插件');
            }
          },
        });

        // 上传文档
        actions.push({
          key: 'uploadDocument',
          icon: <CloudUploadOutlined />,
          label: '上传文档',
          onClick: () => {
            const uploadDocAction = getPluginAction('uploadDocumentAction');
            if (uploadDocAction && typeof uploadDocAction === 'function') {
              uploadDocAction();
            } else {
              Message.warning('上传文档功能需要先加载文档解析插件');
            }
          },
        });

        return actions;
      };

      // 在页面中添加浮动按钮
      const mountFloatingButton = () => {
        // 等待 DOM 准备好
        setTimeout(() => {
          const container = document.createElement('div');
          container.id = 'floating-action-button-container';
          document.body.appendChild(container);

          const actions = createFABActions();
          ReactDOM.render(
            <FloatingActionButton actions={actions} />,
            container
          );
        }, 1000);
      };

      mountFloatingButton();
    },
  };
};

UnifiedActionsPlugin.pluginName = 'UnifiedActionsPlugin';
UnifiedActionsPlugin.meta = {
  preferenceDeclaration: {
    title: '统一操作面板插件配置',
    properties: [],
  },
};

export default UnifiedActionsPlugin;

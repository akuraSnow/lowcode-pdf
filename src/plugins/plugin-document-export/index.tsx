/**
 * 文档导出插件
 * 提供Schema导出和PDF导出功能
 */

import React from 'react';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { Button, message, Modal, Space, Tooltip } from 'antd';
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  HomeOutlined,
} from '@ant-design/icons';

export interface IPluginExportOptions {
  // 插件配置选项
}

const PluginDocumentExport = (
  ctx: IPublicModelPluginContext,
  options: IPluginExportOptions
) => {
  return {
    async init() {
      const { skeleton, project } = ctx;

      // 注册顶部区域的导出按钮
      skeleton.add({
        area: 'topArea',
        type: 'Widget',
        name: 'exportButtons',
        content: ExportButtons as any,
        props: {
          align: 'right',
        },
        contentProps: {
          project,
        },
      });
    },
  };
};

PluginDocumentExport.pluginName = 'PluginDocumentExport';
PluginDocumentExport.meta = {
  preferenceDeclaration: {
    title: '文档导出插件配置',
    properties: [],
  },
};

// 导出按钮组件
const ExportButtons: React.FC<{ project: any }> = ({ project }) => {
  const handleExportSchema = () => {
    try {
      const schema = project.exportSchema();
      const schemaStr = JSON.stringify(schema, null, 2);

      // 下载文件
      const blob = new Blob([schemaStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lowcode-schema-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('Schema导出成功');
    } catch (error) {
      console.error('Export schema error:', error);
      message.error('Schema导出失败');
    }
  };

  const handleExportPDF = () => {
    Modal.info({
      title: 'PDF导出功能',
      content: (
        <div>
          <p>PDF导出功能需要以下步骤：</p>
          <ol>
            <li>切换到预览模式</li>
            <li>等待页面完全渲染</li>
            <li>使用浏览器打印功能（Ctrl/Cmd + P）</li>
            <li>选择"另存为PDF"</li>
          </ol>
          <p>或者可以集成专门的PDF导出库（如jsPDF、html2pdf等）</p>
        </div>
      ),
      okText: '知道了',
    });
  };

  const handleImportSchema = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const schema = JSON.parse(text);
          project.importSchema(schema);
          message.success('Schema导入成功');
        } catch (error) {
          console.error('Import schema error:', error);
          message.error('Schema导入失败');
        }
      }
    };
    input.click();
  };

  const handleGoHome = () => {
    // 返回主页
    window.location.href = './home.html';
  };

  return (
    <Space style={{ marginRight: '16px', display: 'flex', alignItems: 'center' }}>
      <Tooltip title="导出Schema">
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExportSchema}
          type="text"
          size="small"
        />
      </Tooltip>
      <Tooltip title="导出PDF">
        <Button
          icon={<FilePdfOutlined />}
          onClick={handleExportPDF}
          type="text"
          size="small"
        />
      </Tooltip>
      <Tooltip title="导入Schema">
        <Button
          icon={<FileTextOutlined />}
          onClick={handleImportSchema}
          type="text"
          size="small"
        />
      </Tooltip>
      <Tooltip title="返回主页">
        <Button
          icon={<HomeOutlined />}
          onClick={handleGoHome}
          type="text"
          size="small"
        />
      </Tooltip>
    </Space>
  );
};

export default PluginDocumentExport;

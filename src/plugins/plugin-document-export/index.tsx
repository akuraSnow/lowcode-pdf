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
      const { config } = ctx;

      // 导出 PDF 功能函数，供统一操作插件使用
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

      // 将功能函数暴露到 config 中
      config.set('exportPDFAction', handleExportPDF);
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



export default PluginDocumentExport;

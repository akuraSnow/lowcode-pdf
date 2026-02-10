/**
 * 资源管理插件
 * 集成图片、CSS、JavaScript函数资源管理
 */

import React from 'react';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { ResourceManager } from '../../components/ResourceManager';

export interface IPluginResourceManagementOptions {
  // 插件配置选项
}

const PluginResourceManagement = (
  ctx: IPublicModelPluginContext,
  options: IPluginResourceManagementOptions
) => {
  return {
    async init() {
      const { skeleton } = ctx;

      // 注册资源管理面板到右侧
      skeleton.add({
        area: 'rightArea',
        type: 'PanelDock',
        name: 'resourceManagerPane',
        content: ResourceManager as any,
        contentProps: {
          ctx,
        },
        props: {
          title: '资源管理',
          icon: 'folder',
        },
      });
    },
  };
};

PluginResourceManagement.pluginName = 'PluginResourceManagement';
PluginResourceManagement.meta = {
  preferenceDeclaration: {
    title: '资源管理插件配置',
    properties: [],
  },
};

export default PluginResourceManagement;

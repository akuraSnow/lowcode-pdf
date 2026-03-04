/**
 * 页面管理插件
 * 集成页面管理和页面配置功能
 */

import React from 'react';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { PageManager } from '../../components/PageManager';
import { FloatingAddButton } from '../../components/PageManager/FloatingAddButton';
import { EnhancedPageSettingsPanel } from '../../components/PageSettingsPanel/enhanced';

export interface IPluginPageManagementOptions {
  // 插件配置选项
}

const PluginPageManagement = (
  ctx: IPublicModelPluginContext,
  options: IPluginPageManagementOptions
) => {
  return {
    async init() {
      const { skeleton } = ctx;

      // 注册页面标签栏到主区域，悬浮在底部
      skeleton.add({
        area: 'mainArea',
        type: 'Widget',
        name: 'pageManagerTabs',
        content: () => <PageManager />,
        contentProps: {},
        props: {
          align: 'bottom',
        },
      });

      // 浮动添加按钮已移除，改为使用底部标签栏的添加按钮（类似 Excel）
      // skeleton.add({
      //   area: 'mainArea',
      //   type: 'Widget',
      //   name: 'floatingAddButton',
      //   content: FloatingAddButton as any,
      //   contentProps: {
      //     ctx,
      //   },
      // });

      // 注册页面配置面板到右侧
      skeleton.add({
        area: 'rightArea',
        type: 'PanelDock',
        name: 'pageSettingsPane',
        content: EnhancedPageSettingsPanel as any,
        contentProps: {
          ctx,
        },
        props: {
          title: '页面配置',
          icon: 'setting',
        },
      });
    },
  };
};

PluginPageManagement.pluginName = 'PluginPageManagement';
PluginPageManagement.meta = {
  preferenceDeclaration: {
    title: '页面管理插件配置',
    properties: [],
  },
};

export default PluginPageManagement;

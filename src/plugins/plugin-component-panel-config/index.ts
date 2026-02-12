import { IPublicModelPluginContext } from '@alilc/lowcode-types';

/**
 * 组件面板配置插件
 * 用于自定义和配置组件面板的展示和行为
 */
const ComponentPanelConfigPlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      // 组件面板配置初始化逻辑
      const { componentsPane } = ctx;
      
      if (componentsPane) {
        // 组件分类配置
        // 可以在这里添加自定义的组件分类和配置
      }
    },
  };
};

ComponentPanelConfigPlugin.pluginName = 'ComponentPanelConfigPlugin';
export default ComponentPanelConfigPlugin;

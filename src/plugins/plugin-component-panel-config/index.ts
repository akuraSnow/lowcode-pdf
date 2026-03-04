import { IPublicModelPluginContext } from '@alilc/lowcode-types';

/**
 * 组件面板配置插件
 * 用于自定义和配置组件面板的展示和行为
 */
const ComponentPanelConfigPlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      // 组件面板配置初始化逻辑
      const { skeleton, project, event } = ctx;
      
      // 等待编辑器初始化完成后，默认打开组件面板并设置画布尺寸
      setTimeout(() => {
        try {
          // 设置画布为平板模式（F4 纸尺寸）
          // F4: 210mm × 330mm，按 96dpi 转换为像素约为 794px × 1247px
          const simulatorHost = project?.simulatorHost;
          if (simulatorHost) {
            // 设置设备类型和尺寸
            simulatorHost.set('device', 'tablet');
            
            // 设置视口尺寸
            simulatorHost.set('viewport', {
              width: 794,
              height: 1247,
            });
            
            // 设置设备样式（强制固定尺寸）
            simulatorHost.set('deviceStyle', {
              width: 794,
              height: 1247,
            });
            
            // 禁用响应式模式，强制使用固定尺寸
            simulatorHost.set('responsive', false);
            
            console.log('[ComponentPanelConfig] ✓ 画布已设置为平板模式 (794px × 1247px)');
          } else {
            console.warn('[ComponentPanelConfig] simulatorHost 未找到');
          }
          
          // 查找左侧区域面板
          const leftArea = skeleton.leftArea;
          if (leftArea) {
            // 显示左侧面板（如果被隐藏）
            if (leftArea.container) {
              leftArea.container.style.display = 'block';
            }
          }
          
          // 初始化时默认打开组件面板
          skeleton.showPanel('componentsPane');
          console.log('[ComponentPanelConfig] ✓ 组件面板已默认打开');
        } catch (err) {
          console.warn('[ComponentPanelConfig] 配置过程中出现警告:', err);
        }
      }, 800);
      
      console.log('[ComponentPanelConfig] ✓ 配置完成，组件面板默认打开');
    },
  };
};

ComponentPanelConfigPlugin.pluginName = 'ComponentPanelConfigPlugin';
export default ComponentPanelConfigPlugin;

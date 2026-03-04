import { IPublicModelPluginContext } from '@alilc/lowcode-types';

/**
 * 容器组件类名配置插件
 * 为容器组件（FDCell、FDBlock等）的 className 属性提供运行时支持
 * 并修复 FDCell 的对齐属性映射到 CSS
 */
const ContainerClassNamePlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      const { event } = ctx;
      
      console.log('[ContainerClassName] 初始化容器组件 className 支持...');
      
      try {
        // 监听节点变化，确保对齐属性应用到样式
        event.on('node.prop.change', (data: any) => {
          try {
            const { node, key, newValue } = data;
            if (!node || !key) return;
            
            const componentName = node.componentName;
            
            // 处理 FDCell 的对齐属性
            if (componentName === 'FDCell' && (key === 'align' || key === 'verAlign')) {
              const currentStyle = node.getPropValue('style') || {};
              
              if (key === 'align') {
                const alignMap: Record<string, string> = {
                  'left': 'flex-start',
                  'center': 'center',
                  'right': 'flex-end',
                };
                const justifyContent = alignMap[newValue] || 'flex-start';
                
                node.setPropValue('style', {
                  ...currentStyle,
                  display: 'flex',
                  justifyContent: justifyContent,
                });
                
                console.log(`[ContainerClassName] 应用水平对齐: ${newValue} -> ${justifyContent}`);
              } else if (key === 'verAlign') {
                const verAlignMap: Record<string, string> = {
                  'top': 'flex-start',
                  'middle': 'center',
                  'bottom': 'flex-end',
                };
                const alignItems = verAlignMap[newValue] || 'flex-start';
                
                node.setPropValue('style', {
                  ...currentStyle,
                  display: 'flex',
                  alignItems: alignItems,
                });
                
                console.log(`[ContainerClassName] 应用垂直对齐: ${newValue} -> ${alignItems}`);
              }
            }
          } catch (error) {
            console.error('[ContainerClassName] 处理属性变化失败:', error);
          }
        });
        
        console.log('[ContainerClassName] ✓ 容器组件配置完成');
      } catch (error) {
        console.error('[ContainerClassName] 配置失败:', error);
      }
    },
  };
};

ContainerClassNamePlugin.pluginName = 'ContainerClassNamePlugin';
ContainerClassNamePlugin.meta = {
  preferenceDeclaration: {
    title: '容器类名配置插件',
    properties: []
  }
};

export default ContainerClassNamePlugin;

import React, { useState } from 'react';
import { Drawer } from '@alifd/next';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { JsonTransformPanel } from './components/JsonTransformPanel';

export interface IPluginJsonTransformOptions {
  title?: string;
}

/**
 * Widget 组件：渲染在左侧图标栏，点击图标直接打开 Drawer
 */
function JsonTransformWidget({ ctx }: { ctx: IPublicModelPluginContext }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* 左侧图标按钮 */}
      <div
        title="JSON 转换工具"
        onClick={() => setVisible(true)}
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: 4,
          fontSize: 18,
          color: '#555',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = '#e6f4ff';
          (e.currentTarget as HTMLDivElement).style.color = '#1677ff';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
          (e.currentTarget as HTMLDivElement).style.color = '#555';
        }}
      >
        {'{ }'}
      </div>

      {/* Drawer：点击图标直接弹出，无中间面板 */}
      <Drawer
        title="JSON 转换工具"
        placement="right"
        visible={visible}
        onClose={() => setVisible(false)}
        width="80%"
        style={{ maxWidth: '100vw' }}
        bodyStyle={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', overflow: 'auto', height: '100%' }}
      >
        {visible && <JsonTransformPanel ctx={ctx} />}
      </Drawer>
    </>
  );
}

const PluginJsonTransform = (
  ctx: IPublicModelPluginContext,
  options: IPluginJsonTransformOptions
) => {
  return {
    async init() {
      const { skeleton } = ctx;

      skeleton.add({
        area: 'leftArea',
        type: 'Widget',
        name: 'jsonTransformWidget',
        content: JsonTransformWidget as any,
        contentProps: {
          ctx,
        },
        props: {
          title: options?.title || 'JSON转换',
          icon: 'code',
        },
      });
    },
  };
};

PluginJsonTransform.pluginName = 'PluginJsonTransform';
PluginJsonTransform.meta = {
  preferenceDeclaration: {
    title: 'JSON转换插件配置',
    properties: [],
  },
};

export default PluginJsonTransform;


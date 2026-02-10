/**
 * 页面配置面板
 */

import React from 'react';
import {
  Form,
  Select,
  InputNumber,
  Input,
  Switch,
  Divider,
  Space,
  Typography,
  Card,
} from 'antd';
import { useEditorStore } from '../../stores/editorStore';
import type { PageSize, PageOrientation, PageMargin } from '../../types';

const { Title } = Typography;

export const PageSettingsPanel: React.FC = () => {
  const currentPage = useEditorStore((state) => state.getCurrentPage());
  const updatePageSettings = useEditorStore((state) => state.updatePageSettings);
  const currentPageId = useEditorStore((state) => state.currentPageId);

  if (!currentPage) {
    return <div style={{ padding: '16px' }}>未选择页面</div>;
  }

  const settings = currentPage.settings;

  const handleUpdate = (field: string, value: any) => {
    updatePageSettings(currentPageId, { [field]: value });
  };

  const handleMarginUpdate = (side: keyof PageMargin, value: number) => {
    const newMargin = { ...settings.margin, [side]: value };
    updatePageSettings(currentPageId, { margin: newMargin });
  };

  return (
    <div style={{ 
      padding: '12px', 
      height: '100%', 
      overflow: 'auto',
      background: '#fafafa'
    }}>
      <div style={{
        background: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}>
        <Title level={4} style={{ 
          margin: 0, 
          fontSize: '16px',
          fontWeight: 600,
          color: '#1890ff'
        }}>
          📄 页面设置
        </Title>
      </div>

      <Card 
        size="small" 
        title={
          <span style={{ fontWeight: 600 }}>📏 页面尺寸</span>
        }
        style={{ 
          marginBottom: '12px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}
        headStyle={{
          background: '#f5f5f5',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <Form layout="vertical" size="small">
          <Form.Item label="纸张大小">
            <Select
              value={settings.size}
              onChange={(value) => handleUpdate('size', value)}
              options={[
                { label: 'A4 (210×297mm)', value: 'A4' },
                { label: 'A3 (297×420mm)', value: 'A3' },
                { label: 'Letter (216×279mm)', value: 'Letter' },
                { label: 'Legal (216×356mm)', value: 'Legal' },
                { label: '自定义', value: 'Custom' },
              ]}
            />
          </Form.Item>

          {settings.size === 'Custom' && (
            <>
              <Form.Item label="宽度 (mm)">
                <InputNumber
                  value={settings.customWidth}
                  onChange={(value) => handleUpdate('customWidth', value)}
                  min={100}
                  max={1000}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="高度 (mm)">
                <InputNumber
                  value={settings.customHeight}
                  onChange={(value) => handleUpdate('customHeight', value)}
                  min={100}
                  max={1500}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}

          <Form.Item label="页面方向">
            <Select
              value={settings.orientation}
              onChange={(value) => handleUpdate('orientation', value)}
              options={[
                { label: '纵向', value: 'portrait' },
                { label: '横向', value: 'landscape' },
              ]}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card 
        size="small" 
        title={
          <span style={{ fontWeight: 600 }}>📐 页面边距 (mm)</span>
        }
        style={{ 
          marginBottom: '12px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}
        headStyle={{
          background: '#f5f5f5',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item label="上边距" style={{ marginBottom: '8px' }}>
            <InputNumber
              value={settings.margin.top}
              onChange={(value) => handleMarginUpdate('top', value || 0)}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="右边距" style={{ marginBottom: '8px' }}>
            <InputNumber
              value={settings.margin.right}
              onChange={(value) => handleMarginUpdate('right', value || 0)}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="下边距" style={{ marginBottom: '8px' }}>
            <InputNumber
              value={settings.margin.bottom}
              onChange={(value) => handleMarginUpdate('bottom', value || 0)}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="左边距" style={{ marginBottom: '8px' }}>
            <InputNumber
              value={settings.margin.left}
              onChange={(value) => handleMarginUpdate('left', value || 0)}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space>
      </Card>

      <Card 
        size="small" 
        title={
          <span style={{ fontWeight: 600 }}>🎨 默认样式</span>
        }
        style={{ 
          marginBottom: '12px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}
        headStyle={{
          background: '#f5f5f5',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <Form layout="vertical" size="small">
          <Form.Item label="背景颜色">
            <Input
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="默认字号 (px)">
            <InputNumber
              value={settings.defaultFontSize}
              onChange={(value) => handleUpdate('defaultFontSize', value)}
              min={12}
              max={72}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="默认字体颜色">
            <Input
              type="color"
              value={settings.defaultFontColor}
              onChange={(e) => handleUpdate('defaultFontColor', e.target.value)}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="默认字体">
            <Select
              value={settings.defaultFontFamily}
              onChange={(value) => handleUpdate('defaultFontFamily', value)}
              options={[
                { label: 'Arial', value: 'Arial' },
                { label: '微软雅黑', value: 'Microsoft YaHei' },
                { label: '宋体', value: 'SimSun' },
                { label: '黑体', value: 'SimHei' },
                { label: 'Times New Roman', value: 'Times New Roman' },
              ]}
            />
          </Form.Item>

          <Form.Item label="组件间距 (px)">
            <InputNumber
              value={settings.componentGap}
              onChange={(value) => handleUpdate('componentGap', value)}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card size="small" title="页眉设置" style={{ marginBottom: '16px' }}>
        <Form layout="vertical" size="small">
          <Form.Item label="启用页眉">
            <Switch
              checked={settings.header?.enabled}
              onChange={(checked) =>
                handleUpdate('header', {
                  ...settings.header,
                  enabled: checked,
                  height: settings.header?.height || 60,
                  content: settings.header?.content || '',
                  backgroundColor: settings.header?.backgroundColor || '#ffffff',
                })
              }
            />
          </Form.Item>

          {settings.header?.enabled && (
            <>
              <Form.Item label="高度 (px)">
                <InputNumber
                  value={settings.header.height}
                  onChange={(value) =>
                    handleUpdate('header', {
                      ...settings.header,
                      height: value || 60,
                    })
                  }
                  min={30}
                  max={200}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="背景颜色">
                <Input
                  type="color"
                  value={settings.header.backgroundColor}
                  onChange={(e) =>
                    handleUpdate('header', {
                      ...settings.header,
                      backgroundColor: e.target.value,
                    })
                  }
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Card>

      <Card size="small" title="页脚设置" style={{ marginBottom: '16px' }}>
        <Form layout="vertical" size="small">
          <Form.Item label="启用页脚">
            <Switch
              checked={settings.footer?.enabled}
              onChange={(checked) =>
                handleUpdate('footer', {
                  ...settings.footer,
                  enabled: checked,
                  height: settings.footer?.height || 40,
                  content: settings.footer?.content || '',
                  backgroundColor: settings.footer?.backgroundColor || '#ffffff',
                })
              }
            />
          </Form.Item>

          {settings.footer?.enabled && (
            <>
              <Form.Item label="高度 (px)">
                <InputNumber
                  value={settings.footer.height}
                  onChange={(value) =>
                    handleUpdate('footer', {
                      ...settings.footer,
                      height: value || 40,
                    })
                  }
                  min={20}
                  max={150}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="背景颜色">
                <Input
                  type="color"
                  value={settings.footer.backgroundColor}
                  onChange={(e) =>
                    handleUpdate('footer', {
                      ...settings.footer,
                      backgroundColor: e.target.value,
                    })
                  }
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

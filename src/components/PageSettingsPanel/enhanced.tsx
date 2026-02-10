/**
 * 增强版页面配置面板 - 添加生命周期和初始化数据配置
 */

import React, { useState } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Input,
  Switch,
  Typography,
  Tabs,
  Button,
  Space,
  message,
} from 'antd';
import { CodeOutlined, FileTextOutlined, ApiOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import type { PageSize, PageOrientation, PageMargin } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface LifecycleConfig {
  onLoad?: string;
  onUnload?: string;
  onResize?: string;
}

interface InitialDataConfig {
  dataSource?: string; // JSON文件路径
  fetchOnLoad?: boolean;
  transformFunction?: string; // 数据转换函数
}

export const EnhancedPageSettingsPanel: React.FC = () => {
  const currentPage = useEditorStore((state) => state.getCurrentPage());
  const updatePageSettings = useEditorStore((state) => state.updatePageSettings);
  const currentPageId = useEditorStore((state) => state.currentPageId);

  const [activeTab, setActiveTab] = useState('style');
  const [lifecycle, setLifecycle] = useState<LifecycleConfig>({});
  const [initialData, setInitialData] = useState<InitialDataConfig>({});

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

  const handleLifecycleUpdate = (field: keyof LifecycleConfig, value: string) => {
    const newLifecycle = { ...lifecycle, [field]: value };
    setLifecycle(newLifecycle);
    updatePageSettings(currentPageId, { lifecycle: newLifecycle });
    message.success('生命周期配置已更新');
  };

  const handleInitialDataUpdate = (field: keyof InitialDataConfig, value: any) => {
    const newInitialData = { ...initialData, [field]: value };
    setInitialData(newInitialData);
    updatePageSettings(currentPageId, { initialData: newInitialData });
    message.success('初始化数据配置已更新');
  };

  const handleLoadDataFromPath = async () => {
    if (!initialData.dataSource) {
      message.warning('请先设置数据源路径');
      return;
    }

    try {
      // 获取当前产品ID
      const productId = sessionStorage.getItem('currentProductId');
      if (!productId) {
        message.error('未找到产品信息');
        return;
      }

      // 从localStorage获取产品信息
      const products = JSON.parse(localStorage.getItem('lowcode_products') || '[]');
      const product = products.find((p: any) => p.id === productId);

      if (!product) {
        message.error('产品不存在');
        return;
      }

      // 模拟从指定路径加载数据
      // 实际应该调用后端API: await fetch(initialData.dataSource)
      console.log('Loading data from:', initialData.dataSource);
      
      // 这里可以添加实际的数据加载逻辑
      message.info('数据加载功能需要后端API支持');
      
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('数据加载失败');
    }
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
          📄 页面配置
        </Title>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 样式配置 Tab */}
        <Tabs.TabPane 
          tab={
            <span>
              <FileTextOutlined />
              样式配置
            </span>
          } 
          key="style"
        >
          <Card 
            size="small" 
            title={<span style={{ fontWeight: 600 }}>📏 页面尺寸</span>}
            style={{ marginBottom: '12px' }}
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
                    { label: '自定义', value: 'Custom' },
                  ]}
                />
              </Form.Item>

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
            title={<span style={{ fontWeight: 600 }}>🎨 默认样式</span>}
            style={{ marginBottom: '12px' }}
          >
            <Form layout="vertical" size="small">
              <Form.Item label="背景颜色">
                <Input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
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
            </Form>
          </Card>
        </Tabs.TabPane>

        {/* 生命周期配置 Tab */}
        <Tabs.TabPane 
          tab={
            <span>
              <CodeOutlined />
              生命周期
            </span>
          } 
          key="lifecycle"
        >
          <Card 
            size="small" 
            title={<span style={{ fontWeight: 600 }}>⚡ 页面生命周期</span>}
            style={{ marginBottom: '12px' }}
            extra={
              <Text type="secondary" style={{ fontSize: '12px' }}>
                支持JavaScript代码
              </Text>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  onLoad - 页面加载时执行
                </Text>
                <TextArea
                  rows={4}
                  placeholder="// 页面加载时执行的代码&#10;console.log('Page loaded');"
                  value={lifecycle.onLoad}
                  onChange={(e) => handleLifecycleUpdate('onLoad', e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  onUnload - 页面卸载时执行
                </Text>
                <TextArea
                  rows={4}
                  placeholder="// 页面卸载时执行的代码&#10;console.log('Page unloaded');"
                  value={lifecycle.onUnload}
                  onChange={(e) => handleLifecycleUpdate('onUnload', e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  onResize - 页面尺寸变化时执行
                </Text>
                <TextArea
                  rows={4}
                  placeholder="// 页面尺寸变化时执行的代码&#10;console.log('Page resized');"
                  value={lifecycle.onResize}
                  onChange={(e) => handleLifecycleUpdate('onResize', e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </Space>
          </Card>
        </Tabs.TabPane>

        {/* 初始化数据配置 Tab */}
        <Tabs.TabPane 
          tab={
            <span>
              <ApiOutlined />
              初始化数据
            </span>
          } 
          key="initialData"
        >
          <Card 
            size="small" 
            title={<span style={{ fontWeight: 600 }}>📊 数据源配置</span>}
            style={{ marginBottom: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  数据源路径
                </Text>
                <Input
                  placeholder="/data/products/my-data.json"
                  value={initialData.dataSource}
                  onChange={(e) => handleInitialDataUpdate('dataSource', e.target.value)}
                  addonBefore="路径"
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  设置产品保存路径下的JSON文件路径
                </Text>
              </div>

              <div>
                <Form.Item label="页面加载时自动获取数据" style={{ marginBottom: 0 }}>
                  <Switch
                    checked={initialData.fetchOnLoad}
                    onChange={(checked) => handleInitialDataUpdate('fetchOnLoad', checked)}
                  />
                </Form.Item>
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  数据转换函数
                </Text>
                <TextArea
                  rows={6}
                  placeholder="// 数据转换函数，接收原始数据，返回转换后的数据&#10;// function transform(data) {&#10;//   return data.map(item => ({&#10;//     ...item,&#10;//     displayName: item.name.toUpperCase()&#10;//   }));&#10;// }"
                  value={initialData.transformFunction}
                  onChange={(e) => handleInitialDataUpdate('transformFunction', e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  可选：定义一个函数来转换加载的数据
                </Text>
              </div>

              <div>
                <Button 
                  type="primary" 
                  icon={<ApiOutlined />}
                  onClick={handleLoadDataFromPath}
                  block
                >
                  测试加载数据
                </Button>
              </div>
            </Space>
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

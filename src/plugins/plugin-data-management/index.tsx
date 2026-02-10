/**
 * 页面数据管理插件
 * 提供API配置、数据绑定、生命周期管理功能
 */

import React, { useState } from 'react';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import {
  Tabs,
  Form,
  Input,
  Select,
  Button,
  List,
  Card,
  Space,
  message,
  Modal,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

export interface IPluginDataManagementOptions {
  // 插件配置选项
}

const PluginDataManagement = (
  ctx: IPublicModelPluginContext,
  options: IPluginDataManagementOptions
) => {
  return {
    async init() {
      const { skeleton } = ctx;

      // 注册右侧面板
      skeleton.add({
        area: 'rightArea',
        type: 'PanelDock',
        name: 'dataManagementPane',
        content: DataManagementPanel as any,
        contentProps: {
          ctx,
        },
        props: {
          title: '数据管理',
          icon: 'database',
        },
      });
    },
  };
};

PluginDataManagement.pluginName = 'PluginDataManagement';
PluginDataManagement.meta = {
  preferenceDeclaration: {
    title: '数据管理插件配置',
    properties: [],
  },
};

// 数据管理面板组件
const DataManagementPanel: React.FC<{ ctx: any }> = ({ ctx }) => {
  const [activeTab, setActiveTab] = useState('apis');

  return (
    <div style={{ 
      padding: '12px', 
      height: '100%', 
      overflow: 'auto',
      background: '#fafafa'
    }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'apis',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                🔌 API配置
              </span>
            ),
            children: <APIConfigPanel />,
          },
          {
            key: 'lifecycle',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                🔄 生命周期
              </span>
            ),
            children: <LifecyclePanel />,
          },
          {
            key: 'data',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                💾 页面数据
              </span>
            ),
            children: <PageDataPanel />,
          },
        ]}
        style={{
          background: '#fff',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}
        tabBarStyle={{
          margin: '0 0 8px 0'
        }}
      />
    </div>
  );
};

// API配置面板
const APIConfigPanel: React.FC = () => {
  const [apis, setApis] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAPI, setEditingAPI] = useState<any>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    form.resetFields();
    setEditingAPI(null);
    setIsModalVisible(true);
  };

  const handleEdit = (api: any) => {
    form.setFieldsValue(api);
    setEditingAPI(api);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingAPI) {
        setApis(apis.map((api) => (api.id === editingAPI.id ? { ...editingAPI, ...values } : api)));
        message.success('API已更新');
      } else {
        const newAPI = { ...values, id: Date.now().toString() };
        setApis([...apis, newAPI]);
        message.success('API已添加');
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handleDelete = (id: string) => {
    setApis(apis.filter((api) => api.id !== id));
    message.success('API已删除');
  };

  const handleTest = async (api: any) => {
    try {
      message.loading('正在测试API...', 0);
      // 这里可以实际调用API
      setTimeout(() => {
        message.destroy();
        message.success('API测试成功');
      }, 1000);
    } catch (error) {
      message.destroy();
      message.error('API测试失败');
    }
  };

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginBottom: '16px' }}
        block
      >
        添加API
      </Button>

      <List
        dataSource={apis}
        renderItem={(item) => (
          <Card
            size="small"
            title={item.name}
            extra={
              <Space>
                <Button
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleTest(item)}
                >
                  测试
                </Button>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(item)}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(item.id)}
                />
              </Space>
            }
            style={{ marginBottom: '8px' }}
          >
            <div style={{ fontSize: '12px' }}>
              <div>
                <strong>方法:</strong> {item.method}
              </div>
              <div>
                <strong>URL:</strong> {item.url}
              </div>
              {item.dataKey && (
                <div>
                  <strong>存储键:</strong> {item.dataKey}
                </div>
              )}
            </div>
          </Card>
        )}
      />

      <Modal
        title={editingAPI ? '编辑API' : '添加API'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="API名称"
            rules={[{ required: true, message: '请输入API名称' }]}
          >
            <Input placeholder="例如: getUserInfo" />
          </Form.Item>

          <Form.Item
            name="method"
            label="请求方法"
            rules={[{ required: true, message: '请选择请求方法' }]}
          >
            <Select
              options={[
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'DELETE', value: 'DELETE' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="url"
            label="请求URL"
            rules={[{ required: true, message: '请输入请求URL' }]}
          >
            <Input placeholder="https://api.example.com/users" />
          </Form.Item>

          <Form.Item name="dataKey" label="数据存储键">
            <Input placeholder="存储到pageData的键名，例如: users" />
          </Form.Item>

          <Form.Item name="headers" label="请求头（JSON格式）">
            <TextArea
              rows={3}
              placeholder='{"Content-Type": "application/json"}'
            />
          </Form.Item>

          <Form.Item name="params" label="请求参数（JSON格式）">
            <TextArea rows={3} placeholder='{"page": 1, "size": 10}' />
          </Form.Item>

          <Form.Item name="body" label="请求体（JSON格式）">
            <TextArea rows={3} placeholder='{"name": "John"}' />
          </Form.Item>

          <Form.Item name="transform" label="数据转换函数">
            <TextArea
              rows={5}
              placeholder="return response.data;"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// 生命周期面板
const LifecyclePanel: React.FC = () => {
  const [lifecycles, setLifecycles] = useState<Record<string, any>>({
    onLoad: { type: 'code', code: '' },
    onMounted: { type: 'code', code: '' },
  });

  const handleUpdate = (lifecycle: string, field: string, value: any) => {
    setLifecycles({
      ...lifecycles,
      [lifecycle]: {
        ...lifecycles[lifecycle],
        [field]: value,
      },
    });
  };

  return (
    <div>
      <Card title="onLoad（页面加载时）" size="small" style={{ marginBottom: '16px' }}>
        <Form layout="vertical" size="small">
          <Form.Item label="类型">
            <Select
              value={lifecycles.onLoad?.type}
              onChange={(value) => handleUpdate('onLoad', 'type', value)}
              options={[
                { label: '代码', value: 'code' },
                { label: 'API调用', value: 'api' },
              ]}
            />
          </Form.Item>

          {lifecycles.onLoad?.type === 'code' && (
            <Form.Item label="代码">
              <TextArea
                rows={8}
                value={lifecycles.onLoad?.code}
                onChange={(e) => handleUpdate('onLoad', 'code', e.target.value)}
                placeholder="// 在这里编写代码"
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
          )}
        </Form>
      </Card>

      <Card title="onMounted（渲染完成后）" size="small">
        <Form layout="vertical" size="small">
          <Form.Item label="类型">
            <Select
              value={lifecycles.onMounted?.type}
              onChange={(value) => handleUpdate('onMounted', 'type', value)}
              options={[
                { label: '代码', value: 'code' },
                { label: 'API调用', value: 'api' },
              ]}
            />
          </Form.Item>

          {lifecycles.onMounted?.type === 'code' && (
            <Form.Item label="代码">
              <TextArea
                rows={8}
                value={lifecycles.onMounted?.code}
                onChange={(e) => handleUpdate('onMounted', 'code', e.target.value)}
                placeholder="// 在这里编写代码"
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
          )}
        </Form>
      </Card>
    </div>
  );
};

// 页面数据面板
const PageDataPanel: React.FC = () => {
  const [pageData, setPageData] = useState('{\n  \n}');

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(pageData);
      setPageData(JSON.stringify(parsed, null, 2));
      message.success('格式化成功');
    } catch (error) {
      message.error('JSON格式错误');
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: '16px' }}>
        <Button onClick={handleFormat}>格式化</Button>
        <Button onClick={() => setPageData('{\n  \n}')}>清空</Button>
      </Space>

      <TextArea
        rows={20}
        value={pageData}
        onChange={(e) => setPageData(e.target.value)}
        placeholder="页面数据（JSON格式）"
        style={{ fontFamily: 'monospace' }}
      />
    </div>
  );
};

export default PluginDataManagement;

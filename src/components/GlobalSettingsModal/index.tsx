/**
 * 全局路径设置组件
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  Divider,
  Typography,
  Alert,
} from 'antd';
import {
  FolderOpenOutlined,
  SettingOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useGlobalSettingsStore } from '../../stores/globalSettingsStore';

const { Text, Title } = Typography;

interface GlobalSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const settings = useGlobalSettingsStore((state) => state.settings);
  const updatePaths = useGlobalSettingsStore((state) => state.updatePaths);
  const resetToDefaults = useGlobalSettingsStore((state) => state.resetToDefaults);

  const [form] = Form.useForm();

  // 当Modal打开时，设置表单初始值
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(settings.paths);
    }
  }, [visible, settings.paths, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      updatePaths(values);
      message.success('全局路径设置已保存');
      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要恢复为默认路径设置吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        resetToDefaults();
        form.setFieldsValue({
          productPath: './data/products',
          templatePath: './data/templates',
          methodPath: './data/methods',
          filePath: './data/files',
          initialJsonPath: '',
        });
        message.success('已恢复默认设置');
      },
    });
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined style={{ color: '#1890ff' }} />
          <span>全局路径设置</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
          恢复默认
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
        >
          保存设置
        </Button>,
      ]}
    >
      <Alert
        message="提示"
        description="这些路径将用于保存不同类型的文件。修改后将影响所有产品的文件保存位置。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={settings.paths}
      >
        <Title level={5}>
          <FolderOpenOutlined style={{ marginRight: 8 }} />
          路径配置
        </Title>

        <Form.Item
          label="产品JSON保存路径"
          name="productPath"
          rules={[
            { required: true, message: '请输入产品JSON保存路径' },
            {
              pattern: /^(\.\/|\/)([\w\-\/]+)?$/,
              message: '相对路径(./data/products)或绝对路径(/Users/data/products)',
            },
          ]}
          tooltip="产品的低代码schema JSON文件保存位置，支持相对路径和绝对路径"
        >
          <Input
            placeholder="相对路径: ./data/products 或 绝对路径: /Users/data/products"
            prefix={<FolderOpenOutlined />}
            addonBefore="路径"
          />
        </Form.Item>

        <Form.Item
          label="模板保存路径"
          name="templatePath"
          rules={[
            { required: true, message: '请输入模板保存路径' },
            {
              pattern: /^(\.\/|\/)([\w\-\/]+)?$/,
              message: '相对路径(./data/templates)或绝对路径(/Users/data/templates)',
            },
          ]}
          tooltip="页面模板和组件模板的保存位置，支持相对路径和绝对路径"
        >
          <Input
            placeholder="相对路径: ./data/templates 或 绝对路径: /Users/data/templates"
            prefix={<FolderOpenOutlined />}
            addonBefore="路径"
          />
        </Form.Item>

        <Form.Item
          label="方法/组件保存路径"
          name="methodPath"
          rules={[
            { required: true, message: '请输入方法保存路径' },
            {
              pattern: /^(\.\/|\/)([\w\-\/]+)?$/,
              message: '相对路径(./data/methods)或绝对路径(/Users/data/methods)',
            },
          ]}
          tooltip="自定义方法和组件代码的保存位置，支持相对路径和绝对路径"
        >
          <Input
            placeholder="相对路径: ./data/methods 或 绝对路径: /Users/data/methods"
            prefix={<FolderOpenOutlined />}
            addonBefore="路径"
          />
        </Form.Item>

        <Form.Item
          label="通用文件保存路径"
          name="filePath"
          rules={[
            { required: true, message: '请输入文件保存路径' },
            {
              pattern: /^(\.\/|\/)([\w\-\/]+)?$/,
              message: '相对路径(./data/files)或绝对路径(/Users/data/files)',
            },
          ]}
          tooltip="其他类型文件的保存位置，支持相对路径和绝对路径"
        >
          <Input
            placeholder="相对路径: ./data/files 或 绝对路径: /Users/data/files"
            prefix={<FolderOpenOutlined />}
            addonBefore="路径"
          />
        </Form.Item>
        <Form.Item
          label="JSON转换工具 — 初始 JSON 路径"
          name="initialJsonPath"
          tooltip="打开JSON转换工具时若没有已导入的JSON，会自动从此路径加载文件。留空则不自动加载。"
        >
          <Input
            placeholder="如: /absolute/path/to/data.json 或 ./data/source.json"
            prefix={<FolderOpenOutlined />}
            addonBefore="路径"
            allowClear
          />
        </Form.Item>      </Form>

      <Divider />

      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          最后更新: {new Date(settings.updatedAt).toLocaleString('zh-CN')}
        </Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          💡 提示: 路径必须以 ./ 开头，表示相对于项目根目录
        </Text>
      </Space>
    </Modal>
  );
};

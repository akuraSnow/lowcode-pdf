/**
 * 产品主页 - 展示产品列表并支持CRUD操作
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreAddOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useProductStore } from '../../stores/productStore';
import { GlobalSettingsModal } from '../GlobalSettingsModal';
import type { Product, ProductFormData } from '../../types/product';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ProductHomePage: React.FC = () => {
  const products = useProductStore((state) => state.products);
  const addProduct = useProductStore((state) => state.addProduct);
  const updateProduct = useProductStore((state) => state.updateProduct);
  const deleteProduct = useProductStore((state) => state.deleteProduct);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const isLoading = useProductStore((state) => state.isLoading);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // 从 API 加载产品列表
    fetchProducts();
  }, [fetchProducts]);

  const handleAddNew = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      description: product.description,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    message.success('产品已删除');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingProduct) {
        // 编辑模式 - 跳转到低代码平台编辑
        await updateProduct(editingProduct.id, values);
        message.success('产品信息已更新，准备进入编辑器...');
        
        // 跳转到低代码平台
        setTimeout(() => {
          window.location.href = `/editor?productId=${editingProduct.id}`;
        }, 500);
      } else {
        // 新增模式 - 创建产品并跳转到低代码平台
        const newProduct = await addProduct(values);
        message.success('产品已创建，准备进入编辑器...');
        
        // 跳转到低代码平台
        setTimeout(() => {
          window.location.href = `/editor?productId=${newProduct.id}`;
        }, 500);
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
  };

  const handleOpenInEditor = (productId: string) => {
    window.location.href = `/edit?productId=${productId}`;
  };

  const columns: ColumnsType<Product> = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Text strong style={{ fontSize: '14px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || <Text type="secondary">暂无描述</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record: Product) => (
        <Tag color={record.schema ? 'success' : 'default'}>
          {record.schema ? '已编辑' : '待编辑'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record: Product) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<AppstoreAddOutlined />}
            onClick={() => handleOpenInEditor(record.id)}
          >
            编辑设计
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            修改
          </Button>
          <Popconfirm
            title="确定删除此产品吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <Space>
            <AppstoreAddOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>
              产品管理
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button
              size="large"
              icon={<SettingOutlined />}
              onClick={() => setIsSettingsVisible(true)}
            >
              全局设置
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
            >
              新建产品
            </Button>
          </Space>
        }
        bordered={false}
        style={{
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)',
        }}
      >
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个产品`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingProduct ? <EditOutlined /> : <PlusOutlined />}
            <span>{editingProduct ? '编辑产品信息' : '新建产品'}</span>
          </Space>
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingProduct ? '保存并编辑设计' : '创建并编辑设计'}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            label="产品名称"
            name="name"
            rules={[
              { required: true, message: '请输入产品名称' },
              { max: 50, message: '产品名称不能超过50个字符' },
            ]}
          >
            <Input
              placeholder="请输入产品名称"
              prefix={<AppstoreAddOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="产品描述"
            name="description"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入产品描述（可选）"
              showCount
              maxLength={200}
            />
          </Form.Item>
        </Form>
      </Modal>

      <GlobalSettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />
    </div>
  );
};

/**
 * 资源管理器组件
 */

import React, { useState } from 'react';
import {
  Tabs,
  Upload,
  Image,
  Button,
  List,
  Card,
  message,
  Modal,
  Input,
  Space,
  Typography,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CopyOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useResourceStore } from '../../stores/resourceStore';
import { readImageFile, readFileAsText } from '../../utils';
import type { UploadFile } from 'antd';

const { TextArea } = Input;
const { Text } = Typography;

export const ResourceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('images');

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#fafafa',
      padding: '8px'
    }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'images',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                📷 图片资源
              </span>
            ),
            children: <ImageResourcePanel />,
          },
          {
            key: 'css',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                🎨 CSS样式
              </span>
            ),
            children: <CSSResourcePanel />,
          },
          {
            key: 'functions',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚡ JavaScript
              </span>
            ),
            children: <FunctionResourcePanel />,
          },
        ]}
        style={{ 
          height: '100%',
          background: '#fff',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}
        tabBarStyle={{
          margin: '0 0 8px 0'
        }}
      />
    </div>
  );
};

// ==================== 图片资源面板 ====================
const ImageResourcePanel: React.FC = () => {
  const images = useResourceStore((state) => state.images);
  const addImage = useResourceStore((state) => state.addImage);
  const deleteImage = useResourceStore((state) => state.deleteImage);

  const handleUpload = async (file: File) => {
    try {
      const { url, width, height } = await readImageFile(file);
      addImage({
        name: file.name,
        url,
        size: file.size,
        width,
        height,
      });
      message.success('图片上传成功');
    } catch (error) {
      message.error('图片上传失败');
    }
    return false; // 阻止默认上传行为
  };

  const handleDelete = (imageId: string) => {
    deleteImage(imageId);
    message.success('图片已删除');
  };

  return (
    <div style={{ 
      padding: '12px', 
      height: '100%', 
      overflow: 'auto',
      background: '#fafafa'
    }}>
      <Upload
        listType="picture-card"
        showUploadList={false}
        beforeUpload={handleUpload}
        accept="image/*"
        multiple
        style={{
          marginBottom: '16px'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <PlusOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <div style={{ 
            fontSize: '12px',
            color: '#666'
          }}>上传图片</div>
        </div>
      </Upload>

      <div style={{ marginTop: '12px' }}>
        <Image.PreviewGroup>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
            }}
          >
            {images.map((image) => (
              <Card
                key={image.id}
                size="small"
                hoverable
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s',
                }}
                bodyStyle={{ padding: '8px' }}
                cover={
                  <Image
                    src={image.url}
                    alt={image.name}
                    style={{ 
                      height: '140px', 
                      objectFit: 'cover',
                      background: '#f5f5f5'
                    }}
                  />
                }
                actions={[
                  <CopyOutlined
                    key="copy"
                    onClick={() => {
                      navigator.clipboard.writeText(image.url);
                      message.success('URL已复制');
                    }}
                    style={{ color: '#1890ff' }}
                  />,
                  <Popconfirm
                    key="delete"
                    title="确定删除此图片吗?"
                    onConfirm={() => handleDelete(image.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <DeleteOutlined style={{ color: '#ff4d4f' }} />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={
                    <Text ellipsis style={{ 
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {image.name}
                    </Text>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {image.width}×{image.height}
                    </Text>
                  }
                />
              </Card>
            ))}
          </div>
        </Image.PreviewGroup>
      </div>
    </div>
  );
};

// ==================== CSS资源面板 ====================
const CSSResourcePanel: React.FC = () => {
  const cssResources = useResourceStore((state) => state.cssResources);
  const addCSS = useResourceStore((state) => state.addCSS);
  const deleteCSS = useResourceStore((state) => state.deleteCSS);
  const updateCSS = useResourceStore((state) => state.updateCSS);
  const toggleCSS = useResourceStore((state) => state.toggleCSS);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCSS, setEditingCSS] = useState<any>(null);
  const [cssName, setCSSName] = useState('');
  const [cssContent, setCSSContent] = useState('');

  const handleAdd = () => {
    setEditingCSS(null);
    setCSSName('');
    setCSSContent('');
    setIsModalVisible(true);
  };

  const handleEdit = (css: any) => {
    setEditingCSS(css);
    setCSSName(css.name);
    setCSSContent(css.content);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!cssName.trim()) {
      message.warning('请输入CSS名称');
      return;
    }

    if (editingCSS) {
      updateCSS(editingCSS.id, {
        name: cssName,
        content: cssContent,
      });
      message.success('CSS已更新');
    } else {
      addCSS({
        name: cssName,
        content: cssContent,
        size: cssContent.length,
        enabled: true,
      });
      message.success('CSS已添加');
    }

    setIsModalVisible(false);
  };

  const handleUploadFile = async (file: File) => {
    try {
      const content = await readFileAsText(file);
      addCSS({
        name: file.name,
        content,
        size: file.size,
        enabled: true,
      });
      message.success('CSS文件已上传');
    } catch (error) {
      message.error('文件上传失败');
    }
    return false;
  };

  return (
    <div style={{ 
      padding: '12px', 
      height: '100%', 
      overflow: 'auto',
      background: '#fafafa'
    }}>
      <Space style={{ marginBottom: '16px' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          style={{
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(24,144,255,0.2)'
          }}
        >
          新建CSS
        </Button>
        <Upload beforeUpload={handleUploadFile} showUploadList={false} accept=".css">
          <Button 
            icon={<DownloadOutlined />}
            style={{
              borderRadius: '4px'
            }}
          >
            上传CSS文件
          </Button>
        </Upload>
      </Space>

      <List
        dataSource={cssResources}
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '8px'
        }}
        renderItem={(item) => (
          <List.Item
            style={{
              background: item.enabled ? '#fff' : '#f5f5f5',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '8px',
              border: '1px solid #e8e8e8',
              transition: 'all 0.3s'
            }}
            actions={[
              <Button
                key="toggle"
                type={item.enabled ? 'primary' : 'default'}
                size="small"
                onClick={() => toggleCSS(item.id)}
                style={{
                  borderRadius: '4px'
                }}
              >
                {item.enabled ? '✓ 已启用' : '启用'}
              </Button>,
              <Button
                key="edit"
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(item)}
                style={{ color: '#1890ff' }}
              />,
              <Popconfirm
                key="delete"
                title="确定删除此CSS吗?"
                onConfirm={() => {
                  deleteCSS(item.id);
                  message.success('CSS已删除');
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={item.name}
              description={`大小: ${(item.size / 1024).toFixed(2)} KB | ${
                item.enabled ? '已启用' : '已禁用'
              }`}
            />
          </List.Item>
        )}
      />

      <Modal
        title={editingCSS ? '编辑CSS' : '新建CSS'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="CSS名称"
            value={cssName}
            onChange={(e) => setCSSName(e.target.value)}
          />
          <TextArea
            placeholder="CSS内容"
            value={cssContent}
            onChange={(e) => setCSSContent(e.target.value)}
            rows={15}
            style={{ fontFamily: 'monospace' }}
          />
        </Space>
      </Modal>
    </div>
  );
};

// ==================== JavaScript函数面板 ====================
const FunctionResourcePanel: React.FC = () => {
  const functions = useResourceStore((state) => state.functions);
  const addFunction = useResourceStore((state) => state.addFunction);
  const deleteFunction = useResourceStore((state) => state.deleteFunction);
  const updateFunction = useResourceStore((state) => state.updateFunction);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFunction, setEditingFunction] = useState<any>(null);
  const [funcName, setFuncName] = useState('');
  const [funcCode, setFuncCode] = useState('');
  const [funcDescription, setFuncDescription] = useState('');

  const handleAdd = () => {
    setEditingFunction(null);
    setFuncName('');
    setFuncCode('');
    setFuncDescription('');
    setIsModalVisible(true);
  };

  const handleEdit = (func: any) => {
    setEditingFunction(func);
    setFuncName(func.name);
    setFuncCode(func.code);
    setFuncDescription(func.description || '');
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!funcName.trim()) {
      message.warning('请输入函数名称');
      return;
    }

    if (editingFunction) {
      updateFunction(editingFunction.id, {
        name: funcName,
        code: funcCode,
        description: funcDescription,
      });
      message.success('函数已更新');
    } else {
      addFunction({
        name: funcName,
        code: funcCode,
        description: funcDescription,
      });
      message.success('函数已添加');
    }

    setIsModalVisible(false);
  };

  return (
    <div style={{ 
      padding: '12px', 
      height: '100%', 
      overflow: 'auto',
      background: '#fafafa'
    }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ 
          marginBottom: '16px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(24,144,255,0.2)'
        }}
      >
        新建函数
      </Button>

      <List
        dataSource={functions}
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '8px'
        }}
        renderItem={(item) => (
          <List.Item
            style={{
              background: '#fff',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '8px',
              border: '1px solid #e8e8e8',
              transition: 'all 0.3s'
            }}
            actions={[
              <Button
                key="edit"
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(item)}
                style={{ color: '#1890ff' }}
              />,
              <Popconfirm
                key="delete"
                title="确定删除此函数吗?"
                onConfirm={() => {
                  deleteFunction(item.id);
                  message.success('函数已删除');
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={item.name}
              description={item.description || '无描述'}
            />
          </List.Item>
        )}
      />

      <Modal
        title={editingFunction ? '编辑函数' : '新建函数'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="函数名称"
            value={funcName}
            onChange={(e) => setFuncName(e.target.value)}
          />
          <Input
            placeholder="函数描述"
            value={funcDescription}
            onChange={(e) => setFuncDescription(e.target.value)}
          />
          <TextArea
            placeholder="函数代码"
            value={funcCode}
            onChange={(e) => setFuncCode(e.target.value)}
            rows={15}
            style={{ fontFamily: 'monospace' }}
          />
        </Space>
      </Modal>
    </div>
  );
};

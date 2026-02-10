/**
 * 数据同步管理组件
 * 
 * 提供浏览器数据库数据与服务器文件系统的同步功能
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, message, Space, Tag, List, Modal, Input } from 'antd';
import {
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SyncOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  syncIndexedDBToServer,
  checkServerHealth,
  listFromServer,
  loadFromServer,
  deleteFromServer,
  type StorageType,
} from '@/utils/storageSync';

interface DataItem {
  key: string;
  fileName: string;
  path: string;
  size: number;
  modifiedTime: string;
}

export function StorageSyncManager() {
  const [serverOnline, setServerOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<StorageType>('projectSchema');
  const [dataList, setDataList] = useState<DataItem[]>([]);
  const [customPath, setCustomPath] = useState('');

  // 检查服务器状态
  const checkHealth = async () => {
    try {
      const isHealthy = await checkServerHealth();
      setServerOnline(isHealthy);
      if (isHealthy) {
        message.success('服务器连接正常');
      } else {
        message.error('服务器无法连接');
      }
    } catch (error) {
      setServerOnline(false);
      message.error('服务器健康检查失败');
    }
  };

  // 同步所有数据到服务器
  const handleSyncToServer = async () => {
    if (!serverOnline) {
      message.error('请先确保服务器在线');
      return;
    }

    setSyncing(true);
    try {
      await syncIndexedDBToServer(customPath || undefined);
      message.success('数据同步成功！');
      // 刷新列表
      await loadDataList();
    } catch (error) {
      console.error('同步失败:', error);
      message.error('数据同步失败');
    } finally {
      setSyncing(false);
    }
  };

  // 加载数据列表
  const loadDataList = async () => {
    if (!serverOnline) return;

    setLoading(true);
    try {
      const list = await listFromServer({
        type: selectedType,
        customPath: customPath || undefined,
      });
      setDataList(list);
    } catch (error) {
      console.error('加载列表失败:', error);
      message.error('加载数据列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看数据详情
  const handleViewData = async (key: string) => {
    try {
      const data = await loadFromServer({
        type: selectedType,
        key,
        customPath: customPath || undefined,
      });
      
      Modal.info({
        title: `数据详情: ${key}`,
        width: 800,
        content: (
          <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        ),
      });
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  // 删除数据
  const handleDeleteData = async (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除数据 "${key}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteFromServer({
            type: selectedType,
            key,
            customPath: customPath || undefined,
          });
          message.success('删除成功');
          await loadDataList();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 初始化时检查服务器状态
  useEffect(() => {
    checkHealth();
  }, []);

  // 切换类型时加载数据
  useEffect(() => {
    if (serverOnline) {
      loadDataList();
    }
  }, [selectedType, serverOnline]);

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="数据同步管理"
        extra={
          <Space>
            <Tag color={serverOnline ? 'green' : 'red'}>
              {serverOnline ? (
                <>
                  <CheckCircleOutlined /> 服务器在线
                </>
              ) : (
                <>
                  <ExclamationCircleOutlined /> 服务器离线
                </>
              )}
            </Tag>
            <Button size="small" onClick={checkHealth}>
              检查连接
            </Button>
          </Space>
        }
      >
        {/* 自定义路径设置 */}
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <div>
            <span style={{ marginRight: 8 }}>自定义保存路径 (可选):</span>
            <Input
              placeholder="留空使用服务器默认路径"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              style={{ width: 400 }}
            />
          </div>
        </Space>

        {/* 同步操作 */}
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handleSyncToServer}
            loading={syncing}
            disabled={!serverOnline}
          >
            同步所有数据到服务器
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={loadDataList}
            loading={loading}
            disabled={!serverOnline}
          >
            刷新列表
          </Button>
        </Space>

        {/* 数据类型切换 */}
        <Space style={{ marginBottom: 16 }}>
          <span>数据类型:</span>
          <Button
            type={selectedType === 'projectSchema' ? 'primary' : 'default'}
            onClick={() => setSelectedType('projectSchema')}
          >
            项目 Schema
          </Button>
          <Button
            type={selectedType === 'products' ? 'primary' : 'default'}
            onClick={() => setSelectedType('products')}
          >
            产品列表
          </Button>
          <Button
            type={selectedType === 'templates' ? 'primary' : 'default'}
            onClick={() => setSelectedType('templates')}
          >
            模板列表
          </Button>
        </Space>

        {/* 数据列表 */}
        <List
          loading={loading}
          dataSource={dataList}
          locale={{ emptyText: serverOnline ? '暂无数据' : '请先连接服务器' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  icon={<CloudDownloadOutlined />}
                  onClick={() => handleViewData(item.key)}
                >
                  查看
                </Button>,
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteData(item.key)}
                >
                  删除
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={item.key}
                description={
                  <Space>
                    <span>文件: {item.fileName}</span>
                    <span>大小: {formatSize(item.size)}</span>
                    <span>
                      修改时间: {new Date(item.modifiedTime).toLocaleString()}
                    </span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

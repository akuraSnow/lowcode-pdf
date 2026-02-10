/**
 * 页面管理组件 - 页签和页面操作
 */

import React from 'react';
import { Tabs, Button, Dropdown, Modal, Input, message } from 'antd';
import {
  PlusOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import type { MenuProps } from 'antd';

export const PageManager: React.FC = () => {
  const document = useEditorStore((state) => state.document);
  const currentPageId = useEditorStore((state) => state.currentPageId);
  const setCurrentPage = useEditorStore((state) => state.setCurrentPage);
  const addPage = useEditorStore((state) => state.addPage);
  const deletePage = useEditorStore((state) => state.deletePage);
  const duplicatePage = useEditorStore((state) => state.duplicatePage);
  const updatePageSettings = useEditorStore((state) => state.updatePageSettings);

  const [isRenameModalVisible, setIsRenameModalVisible] = React.useState(false);
  const [renamingPageId, setRenamingPageId] = React.useState<string>('');
  const [newPageName, setNewPageName] = React.useState('');

  const handleTabChange = (activeKey: string) => {
    setCurrentPage(activeKey);
  };

  const handleAddPage = () => {
    addPage();
    message.success('新页面已创建');
  };

  const handleDuplicatePage = (pageId: string) => {
    duplicatePage(pageId);
    message.success('页面已复制');
  };

  const handleDeletePage = (pageId: string) => {
    if (document.pages.length <= 1) {
      message.warning('至少需要保留一个页面');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此页面吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deletePage(pageId);
        message.success('页面已删除');
      },
    });
  };

  const handleRenamePage = (pageId: string, currentName: string) => {
    setRenamingPageId(pageId);
    setNewPageName(currentName);
    setIsRenameModalVisible(true);
  };

  const handleRenameConfirm = () => {
    if (!newPageName.trim()) {
      message.warning('页面名称不能为空');
      return;
    }

    updatePageSettings(renamingPageId, { name: newPageName.trim() });
    setIsRenameModalVisible(false);
    message.success('页面已重命名');
  };

  const getPageMenu = (pageId: string, pageName: string): MenuProps => ({
    items: [
      {
        key: 'rename',
        label: '重命名',
        icon: <EditOutlined />,
        onClick: () => handleRenamePage(pageId, pageName),
      },
      {
        key: 'duplicate',
        label: '复制页面',
        icon: <CopyOutlined />,
        onClick: () => handleDuplicatePage(pageId),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        label: '删除页面',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeletePage(pageId),
        disabled: document.pages.length <= 1,
      },
    ],
  });

  const tabItems = document.pages.map((page, index) => ({
    key: page.settings.id,
    label: (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '0 4px'
      }}>
        <span style={{ fontWeight: 500 }}>{page.settings.name || `页面 ${index + 1}`}</span>
        <Dropdown
          menu={getPageMenu(page.settings.id, page.settings.name)}
          trigger={['click']}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              padding: '0 4px',
              opacity: 0.6,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          />
        </Dropdown>
      </div>
    ),
  }));

  return (
    <div style={{ 
      padding: '12px 16px', 
      background: '#fff',
      borderBottom: '1px solid #e8e8e8',
      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
    }}>
      <Tabs
        type="card"
        activeKey={currentPageId}
        onChange={handleTabChange}
        items={tabItems}
        addIcon={
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '0 8px',
            color: '#1890ff',
            fontWeight: 500
          }}>
            <PlusOutlined /> 新建
          </span>
        }
        onEdit={(targetKey, action) => {
          if (action === 'add') {
            handleAddPage();
          }
        }}
        tabBarStyle={{ marginBottom: 0 }}
      />

      <Modal
        title="重命名页面"
        open={isRenameModalVisible}
        onOk={handleRenameConfirm}
        onCancel={() => setIsRenameModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Input
          value={newPageName}
          onChange={(e) => setNewPageName(e.target.value)}
          placeholder="请输入页面名称"
          onPressEnter={handleRenameConfirm}
        />
      </Modal>
    </div>
  );
};

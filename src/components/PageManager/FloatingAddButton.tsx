/**
 * 浮动添加页面按钮 - 显示在画布区域右下角
 */

import React from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { project } from '@alilc/lowcode-engine';

export const FloatingAddButton: React.FC = () => {
  const addPage = useEditorStore((state) => state.addPage);

  const handleAddPage = () => {
    const newPageId = addPage();
    message.success('新页面已创建，正在切换...');
    
    // 使用短暂延迟确保状态已更新
    setTimeout(() => {
      // 通知引擎刷新以显示新页面
      try {
        if (project.simulatorHost) {
          project.simulatorHost.rerender();
        }
        message.success('已切换到新页面');
      } catch (error) {
        console.error('刷新画布失败:', error);
      }
    }, 150);
  };

  return (
    <div
      className="floating-add-page-button"
      style={{
        position: 'fixed',
        right: '32px',
        bottom: '32px',
        zIndex: 999,
      }}
    >
      <Button
        type="primary"
        size="large"
        shape="circle"
        icon={<PlusOutlined style={{ fontSize: '24px' }} />}
        onClick={handleAddPage}
        style={{
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(24, 144, 255, 0.5)',
          border: 'none',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(24, 144, 255, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(24, 144, 255, 0.5)';
        }}
        title="添加新页面"
      />
    </div>
  );
};

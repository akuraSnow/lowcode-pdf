/**
 * 页面管理器 - 在编辑区上方显示tabs
 */

import React from 'react';
import { PageManager } from './index';
import './PageManagerWithCanvas.scss';

export const PageManagerWithCanvas: React.FC = () => {
  return (
    <div className="page-manager-tabs-wrapper">
      <PageManager />
    </div>
  );
};

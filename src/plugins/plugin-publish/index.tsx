/**
 * 发布功能插件 - 保存低代码平台JSON到指定路径
 */

import React from 'react';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { Button, message, Modal, Space } from 'antd';
import { CloudUploadOutlined, HomeOutlined } from '@ant-design/icons';

const PublishPlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      const { skeleton, project } = ctx;

      // 注册顶部区域的按钮组
      skeleton.add({
        area: 'topArea',
        type: 'Widget',
        name: 'publishButtons',
        content: PublishButtons as any,
        props: {
          align: 'right',
        },
        contentProps: {
          project,
        },
      });
    },
  };
};

// 发布按钮组件
const PublishButtons: React.FC<{ project: any }> = ({ project }) => {
  // 获取当前产品ID
  const getCurrentProductId = () => {
    return sessionStorage.getItem('currentProductId');
  };

  // 获取全局路径设置
  const getGlobalSettings = () => {
    try {
      const stored = localStorage.getItem('global-settings-storage');
      if (stored) {
        const settings = JSON.parse(stored);
        return settings.state?.settings || null;
      }
    } catch (error) {
      console.error('Failed to load global settings:', error);
    }
    return null;
  };

  // 发布函数
  const handlePublish = async () => {
    const productId = getCurrentProductId();
    
    if (!productId) {
      message.error('未找到产品信息，请从产品列表进入编辑器');
      return;
    }

    try {
      // 获取产品信息
      const products = JSON.parse(localStorage.getItem('lowcode_products') || '[]');
      const product = products.find((p: any) => p.id === productId);
      
      if (!product) {
        message.error('产品不存在');
        return;
      }

      // 获取全局路径设置
      const globalSettings = getGlobalSettings();
      if (!globalSettings || !globalSettings.paths) {
        message.error('未找到全局路径设置，请先在主页配置保存路径');
        return;
      }

      // 使用全局路径 + 产品名称生成保存路径
      const savePath = `${globalSettings.paths.productPath}/${product.name}.json`;

      // 获取当前项目schema
      const schema = project.exportSchema();
      
      Modal.confirm({
        title: '确认发布',
        content: `将要发布产品 "${product.name}" 到路径: ${savePath}`,
        onOk: async () => {
          try {
            // 更新产品的schema
            const updatedProducts = products.map((p: any) =>
              p.id === productId
                ? {
                    ...p,
                    schema,
                    updatedAt: new Date().toISOString(),
                  }
                : p
            );
            
            localStorage.setItem('lowcode_products', JSON.stringify(updatedProducts));
            
            // 调用后端API保存JSON到文件系统
            try {
              // API 服务运行在端口 3001，编辑器在 5556
              const apiUrl = `http://localhost:3001/api/publish`;
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  path: savePath,
                  schema: schema,
                  productId: productId,
                  productName: product.name,
                }),
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const result = await response.json();
              
              if (result.success) {
                message.success(`发布成功！文件已保存到: ${savePath}`);
              } else {
                throw new Error(result.message || '发布失败');
              }
            } catch (apiError: any) {
              console.error('API调用失败:', apiError);
              
              // 如果后端API不可用，降级为本地保存
              if (apiError.message.includes('Failed to fetch') || apiError.message.includes('HTTP error')) {
                console.warn('后端API不可用，使用本地保存模式');
                
                // 创建JSON文件并触发下载
                const jsonStr = JSON.stringify(schema, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${product.name}_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                message.warning('后端服务未启动，已下载JSON文件。请手动保存到: ' + savePath);
              } else {
                throw apiError;
              }
            }
            
          } catch (error) {
            console.error('Publish failed:', error);
            message.error('发布失败: ' + (error as Error).message);
          }
        },
      });
    } catch (error) {
      console.error('Error during publish:', error);
      message.error('获取产品信息失败');
    }
  };

  // 返回主页
  const handleBackHome = () => {
    window.location.href = '/';
  };

  return (
    <Space style={{ marginRight: '16px' }}>
      <Button
        type="primary"
        icon={<CloudUploadOutlined />}
        onClick={handlePublish}
        title="发布到文件系统"
      >
        发布
      </Button>
      <Button
        icon={<HomeOutlined />}
        onClick={handleBackHome}
        title="返回产品列表"
      >
        返回主页
      </Button>
    </Space>
  );
};

PublishPlugin.pluginName = 'PublishPlugin';
PublishPlugin.meta = {
  preferenceDeclaration: {
    title: '发布插件配置',
    properties: [],
  },
};

export default PublishPlugin;

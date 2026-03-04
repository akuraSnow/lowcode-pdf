/**
 * 页面管理组件 - 页签和页面操作
 */

import React, { useRef, useEffect } from 'react';
import { Tabs, Button, Dropdown, Modal, Input, message, Checkbox } from 'antd';
import {
  PlusOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  LeftOutlined,
  RightOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { project } from '@alilc/lowcode-engine';
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
  
  // 合并页面相关状态
  const [isMergeModalVisible, setIsMergeModalVisible] = React.useState(false);
  const [mergeTargetPageId, setMergeTargetPageId] = React.useState<string>('');
  const [selectedMergePages, setSelectedMergePages] = React.useState<string[]>([]);
  
  // 清空所有画布状态
  const [isClearAllModalVisible, setIsClearAllModalVisible] = React.useState(false);
  
  // 滚动容器引用
  const tabScrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 标记是否已初始化
  const hasInitialized = useRef(false);
  
  // 初始化：组件挂载时加载第一个页面到画布
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    
    // 延迟一点以确保 project 已初始化
    const timer = setTimeout(() => {
      const currentDocument = useEditorStore.getState().document;
      const currentPageId = useEditorStore.getState().currentPageId;
      
      // 确保有页面数据才执行初始化
      if (currentDocument && currentDocument.pages.length > 0 && currentPageId) {
        const currentPage = currentDocument.pages.find(p => p.settings.id === currentPageId);
        
        if (currentPage && project.currentDocument) {
          // 检查画布是否已经有内容（避免重复加载）
          let hasContent = false;
          try {
            if (typeof project.currentDocument.getRoot === 'function') {
              const rootNode = project.currentDocument.getRoot();
              hasContent = rootNode && rootNode.children && rootNode.children.size > 0;
            }
          } catch (e) {
            console.warn('[PageManager] 检查画布内容时出错:', e);
          }
          
          if (hasContent) {
            console.log('[PageManager] 初始化：画布已有内容，跳过');
            hasInitialized.current = true;
            return;
          }
          
          console.log('[PageManager] 初始化：加载当前页面到画布', currentPage.settings.name);
          
          try {
            // 检查页面是否已有样式（避免覆盖原有样式）
            const pageStyle = currentPage.settings?.pageStyle || { height: '100%' };
            
            // 构建页面 schema
            const pageSchema = {
              version: '1.0.0',
              componentsTree: [{
                componentName: 'Page',
                fileName: currentPage.settings.name || 'Page',
                id: `${currentPage.settings.id}_${Date.now()}`,
                props: {
                  ref: `page_${currentPage.settings.id}`,
                  style: pageStyle
                },
                children: currentPage.components || [],
              }],
            };
            
            // 导入到画布
            try {
              project.importSchema(pageSchema as any);
              console.log('[PageManager] ✓ 初始化完成，已加载页面:', currentPage.settings.name);
              hasInitialized.current = true;
            } catch (importError) {
              console.error('[PageManager] Schema导入失败:', importError);
              // 如果导入失败，尝试导入空页面
              const emptyPageSchema = {
                version: '1.0.0',
                componentsTree: [{
                  componentName: 'Page',
                  fileName: currentPage.settings.name || 'Page',
                  id: `${currentPage.settings.id}_${Date.now()}`,
                  props: { ref: `page_${currentPage.settings.id}`, style: pageStyle },
                  children: [],
                }],
              };
              project.importSchema(emptyPageSchema as any);
              console.warn('[PageManager] 已加载空页面作为降级方案');
              hasInitialized.current = true;
            }
          } catch (error) {
            console.error('[PageManager] 初始化加载页面失败:', error);
          }
        }
      }
    }, 500); // 延迟500ms等待project和use-editor-load-product初始化
    
    return () => clearTimeout(timer);
  }, [document, currentPageId]); // 监听document和currentPageId的变化
  
  // 滚动标签栏
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabScrollContainerRef.current) {
      const scrollAmount = 200; // 每次滚动的像素
      const currentScroll = tabScrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      tabScrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };
  
  // 鼠标滚轮滚动
  const handleWheel = (e: React.WheelEvent) => {
    if (tabScrollContainerRef.current) {
      e.preventDefault();
      tabScrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleTabChange = (activeKey: string) => {
    if (activeKey === '__add__') {
      handleAddPage();
      return;
    }
    
    // 在切换前保存当前页面的内容到 store
    try {
      const currentStorePageId = useEditorStore.getState().currentPageId;
      
      if (currentStorePageId && project.currentDocument) {
        console.log('[PageManager] 保存当前页面内容:', currentStorePageId);
        
        // 导出当前页面的 schema
        const currentPageSchema = project.exportSchema();
        
        if (currentPageSchema && currentPageSchema.componentsTree && currentPageSchema.componentsTree[0]) {
          const currentDocument = useEditorStore.getState().document;
          const currentPageIndex = currentDocument.pages.findIndex(p => p.settings.id === currentStorePageId);
          
          if (currentPageIndex >= 0) {
            // 深度复制移除MobX observables,避免immer freeze错误
            const componentsToSave = JSON.parse(JSON.stringify(
              currentPageSchema.componentsTree[0].children || []
            ));
            
            // 更新当前页面的内容到 store
            const updatedPages = [...currentDocument.pages];
            updatedPages[currentPageIndex] = {
              ...updatedPages[currentPageIndex],
              components: componentsToSave,
            };
            
            useEditorStore.setState({
              document: {
                ...currentDocument,
                pages: updatedPages,
                updatedAt: new Date(),
              },
            });
            
            console.log('[PageManager] ✓ 已保存当前页面内容:', currentDocument.pages[currentPageIndex].settings.name);
          }
        }
      }
    } catch (error) {
      console.error('[PageManager] 保存当前页面内容时出错:', error);
    }
    
    setCurrentPage(activeKey);
    
    console.log('[PageManager] 开始切换页面,目标ID:', activeKey);
    
    setTimeout(() => {
      try {
        // 从 store 获取目标页面的数据
        const currentDocument = useEditorStore.getState().document;
        console.log('[PageManager] 获取到document,页面总数:', currentDocument.pages.length);
        
        const targetPageIndex = currentDocument.pages.findIndex(p => p.settings.id === activeKey);
        console.log('[PageManager] 目标页面索引:', targetPageIndex);
        
        if (targetPageIndex >= 0) {
          const targetPage = currentDocument.pages[targetPageIndex];
          
          console.log('[PageManager] 准备切换到页面:', targetPage.settings.name, '组件数量:', targetPage.components.length);
          
          // 验证store中前5页的内容是否真的不同
          console.log('[PageManager] === 验证store中前5页的差异 ===');
          for (let i = 0; i < Math.min(5, currentDocument.pages.length); i++) {
            const page = currentDocument.pages[i];
            const comp0 = page.components[0];
            const comp1 = page.components[1];
            
            // 简单提取文本
            const getText = (c: any) => {
              if (!c) return 'null';
              if (c.props?.children) {
                if (typeof c.props.children === 'string') {
                  return c.props.children.substring(0, 30);
                }
                if (Array.isArray(c.props.children) && c.props.children[0]) {
                  if (typeof c.props.children[0] === 'string') {
                    return c.props.children[0].substring(0, 30);
                  }
                  return getText(c.props.children[0]);
                }
              }
              return 'no-text';
            };
            
            console.log(`  [${i + 1}] ${page.settings.name}: comp数=${page.components.length}, comp0文本="${getText(comp0)}", comp1文本="${getText(comp1)}"`);
          }
          console.log('[PageManager] === 验证完毕 ===');
          
          // 强制清空画布 - 使用 currentDocument API
          try {
            if (project.currentDocument && typeof project.currentDocument.getRoot === 'function') {
              const rootNode = project.currentDocument.getRoot();
              if (rootNode) {
                // 删除所有子节点
                const children = rootNode.children?.toArray() || [];
                children.forEach((child: any) => {
                  try {
                    child.remove();
                  } catch (e) {
                    console.warn('[PageManager] 删除子节点失败:', e);
                  }
                });
                console.log('[PageManager] 已清空画布，删除了', children.length, '个节点');
              }
            }
          } catch (clearError) {
            console.warn('[PageManager] 清空画布时出错:', clearError);
          }
          
          // 延迟导入目标页面内容
          setTimeout(() => {
            try {
              // 为每个页面生成唯一的 ID 和 ref，避免缓存问题
              const uniquePageId = `${targetPage.settings.id}_${Date.now()}`;
              
              // 检查页面是否已有样式（避免覆盖原有样式）
              // 只有Word导入的新页面才添加默认边距
              const pageStyle = targetPage.settings?.pageStyle || { height: '100%' };
              
              // 构建目标页面的 schema（单页面）
              const targetPageSchema = {
                version: '1.0.0',
                componentsTree: [{
                  componentName: 'Page',
                  fileName: targetPage.settings.name || 'Page',
                  id: uniquePageId,
                  props: {
                    ref: `page_${uniquePageId}`,
                    style: pageStyle
                  },
                  children: targetPage.components || [],
                }],
              };
              
              // 导入目标页面的 schema 到画布
              try {
                project.importSchema(targetPageSchema as any);
                console.log('[PageManager] ✓ 已切换到页面:', targetPage.settings.name, '组件数量:', targetPage.components.length);
              } catch (schemaError) {
                console.error('[PageManager] Schema导入失败，尝试加载空页面:', schemaError);
                // 如果导入失败，尝试导入空页面
                const emptyPageSchema = {
                  version: '1.0.0',
                  componentsTree: [{
                    componentName: 'Page',
                    fileName: targetPage.settings.name || 'Page',
                    id: `${targetPage.settings.id}_${Date.now()}`,
                    props: { ref: `page_${uniquePageId}`, style: pageStyle },
                    children: [],
                  }],
                };
                project.importSchema(emptyPageSchema as any);
                console.warn('[PageManager] 已加载空页面作为降级方案');
              }
            } catch (importError) {
              console.error('[PageManager] 导入页面内容失败:', importError);
            }
          }, 100);
        } else {
          console.error('[PageManager] 未找到目标页面:', activeKey);
        }
      } catch (error) {
        console.error('[PageManager] 切换页面失败:', error);
      }
    }, 100);
  };

  const handleAddPage = () => {
    // 在创建新页面前，先保存当前页面的内容到 store
    try {
      const currentStorePageId = useEditorStore.getState().currentPageId;
      
      if (currentStorePageId && project.currentDocument) {
        // 导出当前页面的 schema（单页面）
        const currentPageSchema = project.exportSchema();
        
        if (currentPageSchema && currentPageSchema.componentsTree && currentPageSchema.componentsTree[0]) {
          const currentDocument = useEditorStore.getState().document;
          const currentPageIndex = currentDocument.pages.findIndex(p => p.settings.id === currentStorePageId);
          
          if (currentPageIndex >= 0) {
            // 只更新当前页面的内容，不影响其他页面
            const updatedPages = [...currentDocument.pages];
            updatedPages[currentPageIndex] = {
              ...updatedPages[currentPageIndex],
              components: currentPageSchema.componentsTree[0].children || [],
            };
            
            useEditorStore.setState({
              document: {
                ...currentDocument,
                pages: updatedPages,
                updatedAt: new Date(),
              },
            });
            
            console.log('[PageManager] 创建新页面前已保存当前页面内容:', currentDocument.pages[currentPageIndex].settings.name);
          }
        }
      }
    } catch (error) {
      console.warn('[PageManager] 保存当前页面内容时出错:', error);
    }
    
    const newPageId = addPage();
    message.success('新页面已创建');
    
    setCurrentPage(newPageId);
    
    setTimeout(() => {
      try {
        // 从 store 获取新页面的数据
        const currentDocument = useEditorStore.getState().document;
        const newPageData = currentDocument.pages.find(p => p.settings.id === newPageId);
        
        if (!newPageData) {
          console.error('[PageManager] 未找到新页面数据', {
            newPageId,
            pagesCount: currentDocument.pages.length,
            pageIds: currentDocument.pages.map(p => p.settings.id),
          });
          return;
        }

        // 构建新页面的 schema（单页面）
        const newPageSchema = {
          version: '1.0.0',
          componentsTree: [{
            componentName: 'Page',
            fileName: newPageData.settings.name || 'Page',
            id: newPageData.settings.id,
            props: {
              ref: `page_${newPageData.settings.id}`,
              style: {
                height: '100%',
                paddingLeft: '83px',
                paddingRight: '83px',
                paddingTop: '10px',
                paddingBottom: '22px'
              }
            },
            state: {},
            methods: {},
            lifeCycles: {},
            children: [
              // 默认添加一个 add section 组件
              {
                componentName: 'NextText',
                id: `add_section_text_${Date.now()}`,
                props: {
                  children: '点击此处添加内容...',
                  style: {
                    fontSize: '16px',
                    color: '#999',
                    textAlign: 'center',
                    padding: '40px 20px',
                    border: '2px dashed #d9d9d9',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }
                }
              }
            ],
          }],
        };
        
        // 导入新页面的 schema 到画布
        project.importSchema(newPageSchema as any);
        
        console.log('[PageManager] 已创建并切换到新页面:', newPageData.settings.name, '组件数量:', newPageData.components.length);
      } catch (error) {
        console.error('[PageManager] 加载新页面失败:', error);
      }
    }, 100);
  };

  const handleDuplicatePage = (pageId: string) => {
    duplicatePage(pageId);
    message.success('页面已复制');
  };

  const handleDeletePage = (pageId: string) => {
    console.log('[PageManager] handleDeletePage 被调用，pageId:', pageId);
    console.log('[PageManager] 当前页面ID:', currentPageId);
    console.log('[PageManager] 所有页面:', document.pages.map(p => ({ id: p.settings.id, name: p.settings.name })));
    
    if (document.pages.length <= 1) {
      message.warning('至少需要保留一个页面');
      return;
    }

    const pageToDelete = document.pages.find(p => p.settings.id === pageId);
    const isDeletingCurrentPage = pageId === currentPageId;
    console.log('[PageManager] 要删除的页面:', pageToDelete?.settings.name);
    console.log('[PageManager] 是否删除当前页:', isDeletingCurrentPage);

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除页面 "${pageToDelete?.settings.name}" 吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        console.log('[PageManager] 用户确认删除，pageId:', pageId);
        
        // 删除页面
        deletePage(pageId);
        
        // 如果删除的是当前页，需要手动触发页面切换以刷新编辑器内容
        if (isDeletingCurrentPage) {
          // 等待state更新
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 获取删除后的新currentPageId
          const newCurrentPageId = useEditorStore.getState().currentPageId;
          const newCurrentPage = useEditorStore.getState().document.pages.find(
            p => p.settings.id === newCurrentPageId
          );
          
          console.log('[PageManager] 删除当前页后，新的当前页ID:', newCurrentPageId);
          console.log('[PageManager] 新的当前页名称:', newCurrentPage?.settings.name);
          
          // 触发页面切换逻辑，加载新页面的schema
          if (newCurrentPage) {
            try {
              console.log('[PageManager] 加载新的当前页schema...');
              
              // 为页面生成唯一的 ID，避免缓存问题
              const uniquePageId = `${newCurrentPage.settings.id}_${Date.now()}`;
              
              // 检查页面是否已有样式（避免覆盖原有样式）
              const pageStyle = newCurrentPage.settings?.pageStyle || { height: '100%' };
              
              // 构建目标页面的 schema（单页面）
              const targetPageSchema = {
                version: '1.0.0',
                componentsTree: [{
                  componentName: 'Page',
                  fileName: newCurrentPage.settings.name || 'Page',
                  id: uniquePageId,
                  props: {
                    ref: `page_${uniquePageId}`,
                    style: pageStyle
                  },
                  children: newCurrentPage.components || [],
                }],
              };
              
              await project.importSchema(targetPageSchema as any);
              console.log('[PageManager] ✓ 已加载新的当前页schema');
            } catch (error) {
              console.error('[PageManager] ✗ 加载新页面schema失败:', error);
              // 如果加载失败，加载空页面
              try {
                await project.importSchema({
                  componentsTree: [{ componentName: 'Page', id: 'root', props: {} }],
                  componentsMap: {},
                });
                console.log('[PageManager] ✓ 已加载空白页面');
              } catch (fallbackError) {
                console.error('[PageManager] ✗ 加载空白页面也失败:', fallbackError);
              }
            }
          }
        }
        
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
  
  // 打开合并页面对话框
  const handleMergePages = (targetPageId: string) => {
    setMergeTargetPageId(targetPageId);
    setSelectedMergePages([]);
    setIsMergeModalVisible(true);
  };
  
  // 显示清空所有画布的确认对话框
  const handleClearAllPages = () => {
    setIsClearAllModalVisible(true);
  };
  
  // 确认清空所有画布
  const handleClearAllConfirm = async () => {
    try {
      const currentDocument = useEditorStore.getState().document;
      
      // 创建一个新的默认页面
      const defaultPageId = `page_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const defaultPage = {
        settings: {
          id: defaultPageId,
          name: '页面 1',
          path: '/page1',
          isHomePage: true,
          pageStyle: {
            height: '100%',
            paddingLeft: '83px',
            paddingRight: '83px',
            paddingTop: '10px',
            paddingBottom: '22px'
          }
        },
        components: [
          {
            componentName: 'NextText',
            id: `add_section_text_${Date.now()}`,
            props: {
              children: '点击此处添加内容...',
              style: {
                fontSize: '16px',
                color: '#999',
                textAlign: 'center',
                padding: '40px 20px',
                border: '2px dashed #d9d9d9',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }
            }
          }
        ]
      };
      
      // 更新文档，只保留一个默认页面
      useEditorStore.setState({
        document: {
          ...currentDocument,
          pages: [defaultPage],
          updatedAt: new Date(),
        },
        currentPageId: defaultPageId,
      });
      
      // 延迟一下再导入到画布
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 导入新页面到画布
      const newPageSchema = {
        version: '1.0.0',
        componentsTree: [{
          componentName: 'Page',
          fileName: defaultPage.settings.name,
          id: defaultPageId,
          props: {
            ref: `page_${defaultPageId}`,
            style: defaultPage.settings.pageStyle
          },
          state: {},
          methods: {},
          lifeCycles: {},
          children: defaultPage.components,
        }],
      };
      
      project.importSchema(newPageSchema as any);
      
      setIsClearAllModalVisible(false);
      message.success('已清空所有页面，创建了一个新的默认页面');
      
      console.log('[PageManager] 清空所有页面完成');
    } catch (error) {
      console.error('[PageManager] 清空所有页面失败:', error);
      message.error('清空失败');
    }
  };
  
  // 确认合并页面
  const handleMergeConfirm = async () => {
    if (selectedMergePages.length === 0) {
      message.warning('请至少选择一个要合并的页面');
      return;
    }
    
    try {
      const currentDocument = useEditorStore.getState().document;
      const targetPageIndex = currentDocument.pages.findIndex(p => p.settings.id === mergeTargetPageId);
      
      if (targetPageIndex < 0) {
        message.error('目标页面不存在');
        return;
      }
      
      // 获取目标页面和要合并的页面
      const targetPage = currentDocument.pages[targetPageIndex];
      const pagesToMerge = selectedMergePages.map(pageId => 
        currentDocument.pages.find(p => p.settings.id === pageId)
      ).filter(Boolean);
      
      // 深拷贝并重新生成组件ID的辅助函数
      const cloneComponentWithNewId = (component: any): any => {
        const cloned = JSON.parse(JSON.stringify(component));
        
        // 为组件生成新的ID
        const generateNewId = (comp: any) => {
          if (comp.id) {
            comp.id = `${comp.id}_merged_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          }
          if (comp.children && Array.isArray(comp.children)) {
            comp.children.forEach((child: any) => generateNewId(child));
          }
        };
        
        generateNewId(cloned);
        return cloned;
      };
      
      // 合并组件：将选中页面的组件深拷贝后添加到目标页面下面
      const targetComponents = targetPage.components.map(comp => cloneComponentWithNewId(comp));
      const mergeComponents = pagesToMerge.flatMap(page => 
        page!.components.map(comp => cloneComponentWithNewId(comp))
      );
      const mergedComponents = [...targetComponents, ...mergeComponents];
      
      // 更新目标页面
      const updatedPages = currentDocument.pages.filter(
        p => p.settings.id === mergeTargetPageId || !selectedMergePages.includes(p.settings.id)
      );
      
      const updatedTargetPageIndex = updatedPages.findIndex(p => p.settings.id === mergeTargetPageId);
      updatedPages[updatedTargetPageIndex] = {
        ...updatedPages[updatedTargetPageIndex],
        components: mergedComponents,
      };
      
      // 更新 store
      useEditorStore.setState({
        document: {
          ...currentDocument,
          pages: updatedPages,
          updatedAt: new Date(),
        },
      });
      
      // 如果当前页是被合并的页面之一，切换到目标页面
      if (selectedMergePages.includes(currentPageId)) {
        setCurrentPage(mergeTargetPageId);
        
        // 重新加载目标页面到画布
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const targetPageAfterMerge = updatedPages[updatedTargetPageIndex];
        const uniquePageId = `${targetPageAfterMerge.settings.id}_${Date.now()}`;
        const pageStyle = targetPageAfterMerge.settings?.pageStyle || { height: '100%' };
        
        const targetPageSchema = {
          version: '1.0.0',
          componentsTree: [{
            componentName: 'Page',
            fileName: targetPageAfterMerge.settings.name || 'Page',
            id: uniquePageId,
            props: {
              ref: `page_${uniquePageId}`,
              style: pageStyle
            },
            children: targetPageAfterMerge.components || [],
          }],
        };
        
        await project.importSchema(targetPageSchema as any);
      } else if (mergeTargetPageId === currentPageId) {
        // 如果目标页面是当前页，刷新画布
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const targetPageAfterMerge = updatedPages[updatedTargetPageIndex];
        const uniquePageId = `${targetPageAfterMerge.settings.id}_${Date.now()}`;
        const pageStyle = targetPageAfterMerge.settings?.pageStyle || { height: '100%' };
        
        const targetPageSchema = {
          version: '1.0.0',
          componentsTree: [{
            componentName: 'Page',
            fileName: targetPageAfterMerge.settings.name || 'Page',
            id: uniquePageId,
            props: {
              ref: `page_${uniquePageId}`,
              style: pageStyle
            },
            children: targetPageAfterMerge.components || [],
          }],
        };
        
        await project.importSchema(targetPageSchema as any);
      }
      
      setIsMergeModalVisible(false);
      message.success(`已将 ${selectedMergePages.length} 个页面合并到 "${targetPage.settings.name}"`);
      
      console.log('[PageManager] 页面合并完成', {
        targetPage: targetPage.settings.name,
        mergedPages: pagesToMerge.map(p => p?.settings.name),
        totalComponents: mergedComponents.length,
      });
    } catch (error) {
      console.error('[PageManager] 合并页面失败:', error);
      message.error('合并页面失败');
    }
  };

  const getPageMenu = (pageId: string, pageName: string): MenuProps => {
    console.log('[PageManager] 生成页面菜单，pageId:', pageId, 'pageName:', pageName);
    return {
      items: [
        {
          key: 'rename',
          label: '重命名',
          icon: <EditOutlined />,
          onClick: () => {
            console.log('[PageManager] 重命名页面，pageId:', pageId);
            handleRenamePage(pageId, pageName);
          },
        },
        {
          key: 'duplicate',
          label: '复制页面',
          icon: <CopyOutlined />,
          onClick: () => {
            console.log('[PageManager] 复制页面，pageId:', pageId);
            handleDuplicatePage(pageId);
          },
        },
        {
          key: 'merge',
          label: '合并页面',
          icon: <MergeCellsOutlined />,
          onClick: () => {
            console.log('[PageManager] 合并页面，pageId:', pageId);
            handleMergePages(pageId);
          },
          disabled: document.pages.length <= 1,
        },
        {
          type: 'divider',
        },
        {
          key: 'delete',
          label: '删除页面',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => {
            console.log('[PageManager] 删除页面，pageId:', pageId, 'pageName:', pageName);
            console.log('[PageManager] 当前所有页面:', document.pages.map(p => ({ id: p.settings.id, name: p.settings.name })));
            handleDeletePage(pageId);
          },
          disabled: document.pages.length <= 1,
        },
      ],
    };
  };

  const tabItems = [
    ...document.pages.map((page, index) => ({
      key: page.settings.id,
      label: (
        <Dropdown
          menu={getPageMenu(page.settings.id, page.settings.name)}
          trigger={['contextMenu']}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '0 8px',
            cursor: 'pointer'
          }}>
            <span style={{ fontWeight: 500 }}>{page.settings.name}</span>
          </div>
        </Dropdown>
      ),
    })),
    {
      key: '__add__',
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          padding: '0 8px',
          color: '#1890ff'
        }}>
          <PlusOutlined style={{ fontSize: '14px' }} />
          <span style={{ fontSize: '14px' }}>新建页面</span>
        </div>
      ),
    },
    {
      key: '__clear_all__',
      label: (
        <div 
          onClick={handleClearAllPages}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            padding: '0 8px',
            color: '#ff4d4f',
            cursor: 'pointer'
          }}
        >
          <DeleteOutlined style={{ fontSize: '14px' }} />
          <span style={{ fontSize: '14px' }}>清空所有</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '32px',
        background: '#fff',
        borderTop: '1px solid #e8e8e8',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* 左箭头 */}
        <Button
          type="text"
          size="small"
          icon={<LeftOutlined />}
          onClick={() => scrollTabs('left')}
          style={{
            height: '32px',
            width: '32px',
            borderRight: '1px solid #e8e8e8',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        
        {/* 标签滚动容器 */}
        <div
          ref={tabScrollContainerRef}
          onWheel={handleWheel}
          style={{
            flex: 1,
            height: '32px',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
            display: 'flex',
            alignItems: 'center',
          }}
          className="tab-scroll-container"
        >
          <style>{`
            .tab-scroll-container::-webkit-scrollbar {
              display: none; /* Chrome/Safari/Opera */
            }
            .tab-scroll-container .ant-tabs {
              flex: 1;
              min-width: max-content;
            }
            .tab-scroll-container .ant-tabs-nav {
              margin-bottom: 0 !important;
            }
            .tab-scroll-container .ant-tabs-tab {
              margin: 0 !important;
              padding: 4px 12px !important;
              height: 28px !important;
              line-height: 20px !important;
              transition: all 0.2s ease;
            }
            /* 选中标签样式：背景变深，字体变白 */
            .tab-scroll-container .ant-tabs-tab-active {
              background-color: #1890ff !important;
            }
            .tab-scroll-container .ant-tabs-tab-active .ant-tabs-tab-btn {
              color: #ffffff !important;
            }
            .tab-scroll-container .ant-tabs-tab-active .ant-tabs-tab-btn span {
              color: #ffffff !important;
            }
            /* 悬停效果 */
            .tab-scroll-container .ant-tabs-tab:not(.ant-tabs-tab-active):hover {
              background-color: #f0f0f0 !important;
            }
          `}</style>
          <Tabs
            type="card"
            activeKey={currentPageId}
            onChange={handleTabChange}
            items={tabItems}
            size="small"
            tabBarStyle={{ 
              marginBottom: 0,
              height: '28px',
              fontSize: '12px',
              border: 'none',
            }}
          />
        </div>
        
        {/* 右箭头 */}
        <Button
          type="text"
          size="small"
          icon={<RightOutlined />}
          onClick={() => scrollTabs('right')}
          style={{
            height: '32px',
            width: '32px',
            borderLeft: '1px solid #e8e8e8',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </div>

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
      
      <Modal
        title="合并页面"
        open={isMergeModalVisible}
        onOk={handleMergeConfirm}
        onCancel={() => setIsMergeModalVisible(false)}
        okText="确定合并"
        cancelText="取消"
        width={500}
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#666', marginBottom: '12px' }}>
            将选中的页面合并到 <strong>"{document.pages.find(p => p.settings.id === mergeTargetPageId)?.settings.name}"</strong> 的底部
          </p>
          <p style={{ color: '#ff4d4f', fontSize: '12px', marginBottom: '16px' }}>
            ⚠️ 被合并的页面将会被删除，此操作不可撤销
          </p>
        </div>
        
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          padding: '8px'
        }}>
          {document.pages
            .filter(page => page.settings.id !== mergeTargetPageId)
            .map(page => (
              <div 
                key={page.settings.id}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Checkbox
                  checked={selectedMergePages.includes(page.settings.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMergePages([...selectedMergePages, page.settings.id]);
                    } else {
                      setSelectedMergePages(selectedMergePages.filter(id => id !== page.settings.id));
                    }
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{page.settings.name}</span>
                  <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                    ({page.components.length} 个组件)
                  </span>
                </Checkbox>
              </div>
            ))
          }
        </div>
        
        {selectedMergePages.length > 0 && (
          <div style={{ marginTop: '12px', color: '#1890ff', fontSize: '12px' }}>
            已选择 {selectedMergePages.length} 个页面
          </div>
        )}
      </Modal>
      
      {/* 清空所有页面确认对话框 */}
      <Modal
        title="清空所有页面"
        open={isClearAllModalVisible}
        onOk={handleClearAllConfirm}
        onCancel={() => setIsClearAllModalVisible(false)}
        okText="确认清空"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '16px', marginBottom: '16px' }}>
            ⚠️ <strong>警告：此操作不可恢复！</strong>
          </p>
          <p style={{ color: '#666', marginBottom: '8px' }}>
            此操作将：
          </p>
          <ul style={{ color: '#666', paddingLeft: '20px' }}>
            <li>删除所有现有页面（共 {document.pages.length} 个）</li>
            <li>清空所有画布内容</li>
            <li>创建一个新的默认空白页面</li>
          </ul>
          <p style={{ color: '#ff4d4f', marginTop: '16px' }}>
            确认要执行此操作吗？
          </p>
        </div>
      </Modal>
    </>
  );
};

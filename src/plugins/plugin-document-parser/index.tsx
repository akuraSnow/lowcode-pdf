/**
 * 文档解析插件 - 上传文档/图片并智能解析为低代码Schema
 * 支持: HTML、图片、PDF、Word等格式，提取样式并转换为可用的组件
 */

import React from 'react';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { Button, Dialog, Upload, Message, Loading } from '@alifd/next';
import { useEditorStore } from '../../stores/editorStore';

// 从 CDN 加载 PDF.js (避免 Webpack 编译问题)
let pdfjsLib: any = null;
let mammoth: any = null;

// 从 CDN 加载 PDF.js
const loadPDFJS = async () => {
  if (!pdfjsLib) {
    try {
      if (typeof window === 'undefined') {
        throw new Error('PDF.js 只能在浏览器环境中使用');
      }

      // 检查全局对象中是否已加载
      if (!(window as any).pdfjsLib) {
        // 创建脚本元素加载 PDF.js
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = false; // 同步加载
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
          document.head.appendChild(script);
        });
      }

      pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib || !pdfjsLib.getDocument) {
        throw new Error('PDF.js 未能正确加载');
      }

      // 配置 worker
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    } catch (error) {
      console.error('Failed to load PDF.js:', error);
      throw new Error(`PDF解析库加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  return pdfjsLib;
};

// 异步加载 Mammoth
const loadMammoth = async () => {
  if (!mammoth) {
    try {
      mammoth = await import('mammoth');
    } catch (error) {
      console.error('Failed to load mammoth:', error);
      throw new Error('Word解析库加载失败');
    }
  }
  return mammoth;
};

/**
 * 工具函数：展平嵌套的数组结构为单维数组
 * 处理 elementToSchema 返回的数组、对象和字符串
 */
const flattenSchema = (content: any): any[] => {
  if (!content) return [];
  
  if (Array.isArray(content)) {
    return content
      .flatMap((item: any) => flattenSchema(item))
      .filter(Boolean);
  }
  
  // 处理字符串（纯文本）- 转换为 FDP 组件（段落）
  if (typeof content === 'string') {
    return [{
      componentName: 'FDP',
      props: {
        children: content,
      },
    }];
  }
  
  // 处理组件对象
  if (typeof content === 'object' && content.componentName) {
    return [content];
  }
  
  return [];
};

// HTML转Schema的转换器
const HtmlToSchemaConverter = {
  /**
   * 生成唯一的节点 ID
   */
  generateId(): string {
    return 'node_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },
  
  /**
   * 获取当前文档 ID
   */
  getDocId(): string {
    try {
      const docId = project?.currentDocument?.id;
      if (docId) return docId;
    } catch (e) {
      // 忽略错误
    }
    return 'doc_' + Math.random().toString(36).substr(2, 9);
  },
  
  /**
   * 提取HTML元素的样式
   */
  extractStyles(element: HTMLElement): Record<string, any> {
    const styles: Record<string, any> = {};
    const computedStyle = window.getComputedStyle(element);
    
    // 提取关键样式属性
    const styleProps = [
      'color', 'backgroundColor', 'fontSize', 'fontWeight', 'fontFamily',
      'padding', 'margin', 'border', 'borderRadius', 'width', 'height',
      'display', 'flexDirection', 'justifyContent', 'alignItems',
      'textAlign', 'lineHeight', 'letterSpacing', 'textDecoration'
    ];
    
    styleProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'auto' && value !== 'normal') {
        // 转换为camelCase
        const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[camelProp] = value;
      }
    });
    
    return styles;
  },
  
  /**
   * 生成完整的 Lowcode Schema 格式
   * 将组件树包装为符合 Lowcode Engine 标准的完整 schema 结构
   */
  generateLowcodeSchema(components: any[], fileName: string = 'document'): any {
    const docId = this.getDocId();
    const pageId = this.generateId();
    
    // 确保 components 是数组
    const childrenArray = Array.isArray(components) ? components : [components];
    
    return {
      version: '1.0.0',
      componentsMap: [
        {
          devMode: 'lowCode',
          componentName: 'Page'
        },
        {
          package: '@alilc/lowcode-materials',
          version: '1.0.7',
          exportName: 'NextText',
          main: 'lib/index.js',
          destructuring: true,
          subName: '',
          componentName: 'NextText'
        },
        {
          package: '@alifd/layout',
          version: '2.4.1',
          exportName: 'P',
          main: 'lib/index.js',
          destructuring: true,
          subName: '',
          componentName: 'FDP'
        },
        {
          package: '@alifd/layout',
          version: '2.4.1',
          exportName: 'Cell',
          main: 'lib/index.js',
          destructuring: true,
          subName: '',
          componentName: 'FDCell'
        },
        {
          package: '@alifd/layout',
          version: '2.4.1',
          exportName: 'Block',
          main: 'lib/index.js',
          destructuring: true,
          subName: '',
          componentName: 'FDBlock'
        },
        {
          package: '@alifd/next',
          version: '1.25.23',
          exportName: 'Button',
          main: '',
          destructuring: true,
          subName: '',
          componentName: 'Button'
        },
        {
          package: '@alifd/layout',
          version: '2.4.1',
          exportName: 'Row',
          main: 'lib/index.js',
          destructuring: true,
          subName: '',
          componentName: 'FDRow'
        },
        {
          package: '@alifd/layout',
          version: '2.4.1',
          exportName: 'Section',
          main: 'lib/index.js',
          destructuring: true,
          subName: '',
          componentName: 'FDSection'
        },
        {
          package: '@alifd/layout',
          version: '2.4.1',
          exportName: 'Page',
          main: 'lib/index.js',
          destructuring: true,
          componentName: 'FDPage'
        },
        // 原生 HTML table 组件
        {
          componentName: 'table',
          package: 'html-components',
          version: '1.0.0',
          exportName: 'table',
          main: '',
          destructuring: true,
          subName: ''
        },
        {
          componentName: 'thead',
          package: 'html-components',
          version: '1.0.0',
          exportName: 'thead',
          main: '',
          destructuring: true,
          subName: ''
        },
        {
          componentName: 'tbody',
          package: 'html-components',
          version: '1.0.0',
          exportName: 'tbody',
          main: '',
          destructuring: true,
          subName: ''
        },
        {
          componentName: 'tfoot',
          package: 'html-components',
          version: '1.0.0',
          exportName: 'tfoot',
          main: '',
          destructuring: true,
          subName: ''
        },
        {
          componentName: 'tr',
          package: 'html-components',
          version: '1.0.0',
          exportName: 'tr',
          main: '',
          destructuring: true,
          subName: ''
        },
        {
          componentName: 'td',
          package: 'html-components',
          version: '1.0.0',
          exportName: 'td',
          main: '',
          destructuring: true,
          subName: ''
        },
        {
          componentName: 'th',
          package: 'html-components',
          version: '1.0.0',
          exportName: 'th',
          main: '',
          destructuring: true,
          subName: ''
        }
      ],
      componentsTree: [
        {
          componentName: 'Page',
          id: pageId,
          docId,
          props: {
            ref: 'outerView',
            style: {
              height: '100%',
              paddingLeft: '83px',
              paddingRight: '83px',
              paddingTop: '10px',
              paddingBottom: '22px'
            }
          },
          fileName: fileName || '/',
          hidden: false,
          title: '',
          isLocked: false,
          condition: true,
          conditionGroup: '',
          children: [
            {
              componentName: 'FDPage',
              id: this.generateId(),
              docId,
              props: {
                contentProps: {
                  style: {
                    background: 'rgba(255,255,255,0)'
                  }
                },
                style: {},
                ref: 'fdpage-' + Math.random().toString(36).substr(2, 9)
              },
              title: '页面',
              hidden: false,
              isLocked: false,
              condition: true,
              conditionGroup: '',
              children: [
                {
                  componentName: 'FDSection',
                  id: this.generateId(),
                  docId,
                  props: {
                    style: {
                      backgroundColor: 'rgba(255,255,255,1)',
                      minHeight: ''
                    }
                  },
                  title: '区域',
                  hidden: false,
                  isLocked: false,
                  condition: true,
                  conditionGroup: '',
                  children: [
                    {
                      componentName: 'FDBlock',
                      id: this.generateId(),
                      docId,
                      props: {
                        mode: 'transparent',
                        span: 12
                      },
                      title: '区块',
                      hidden: false,
                      isLocked: false,
                      condition: true,
                      conditionGroup: '',
                      children: childrenArray
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      i18n: {
        'zh-CN': {},
        'en-US': {}
      }
    };
  },
  
  /**
   * 递归转换HTML元素为Schema - 符合 Lowcode Engine 标准格式
   */
  elementToSchema(element: HTMLElement, parentTag?: string, isInTable: boolean = false): any {
    const tag = element.tagName.toLowerCase();
    const text = element.innerText?.trim();
    const styles = this.extractStyles(element);
    const docId = this.getDocId();
    
    console.log(`[elementToSchema] 处理 <${tag}> 元素，文本长度: ${text?.length || 0}，子元素数: ${element.children.length}`);
    
    // 处理子元素
    const childrenSchemas: any[] = [];
    if (element.children.length > 0) {
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i] as HTMLElement;
        const childSchema = this.elementToSchema(child, tag, isInTable);
        if (childSchema) {
          // 如果返回的是数组（tbody/tr 等扁平化的情况），则展开数组
          if (Array.isArray(childSchema)) {
            childrenSchemas.push(...childSchema);
          } else {
            childrenSchemas.push(childSchema);
          }
        }
      }
    }
    
    // 选择合适的组件名称和属性 - 使用引擎可识别的组件
    let componentName = 'FDCell';
    let props: Record<string, any> = {};
    let title = '';
    let children: any[] = [];
    
    // 根据 HTML 标签类型选择对应的低代码组件
    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        // 标题使用 FDP 包装 NextText
        const headingLevel = parseInt(tag[1]);
        const fontSize = `${32 - headingLevel * 4}px`;
        
        return {
          componentName: 'FDP',
          id: this.generateId(),
          docId,
          props: {
            style: {
              fontSize,
              fontWeight: 'bold',
              marginBottom: '16px',
              marginTop: '16px',
              ...styles,
            }
          },
          children: [{
            componentName: 'NextText',
            id: this.generateId(),
            docId,
            props: {
              type: 'inherit',
              children: text || '',
              mark: false,
              code: false,
              delete: false,
              underline: false,
              strong: true,
              prefix: '',
              classname: '',
              style: {
                margin: '0'
              }
            },
            hidden: false,
            title: '文本',
            isLocked: false,
            condition: true,
            conditionGroup: ''
          }],
          title: `标题 H${headingLevel}`,
          hidden: false,
          isLocked: false,
          condition: true,
          conditionGroup: ''
        };
      }
      
      case 'p': {
        // 段落使用 FDP 包装 NextText
        if (childrenSchemas.length > 0) {
          // 有子元素（如嵌套的 span, strong 等）
          children = childrenSchemas;
        } else if (text) {
          // 纯文本使用 NextText 组件
          children = [{
            componentName: 'NextText',
            id: this.generateId(),
            docId,
            props: {
              type: 'inherit',
              children: text,
              mark: false,
              code: false,
              delete: false,
              underline: false,
              strong: false,
              prefix: '',
              classname: '',
              style: {
                margin: '0'
              }
            },
            hidden: false,
            title: '文本',
            isLocked: false,
            condition: true,
            conditionGroup: ''
          }];
        }
        
        return {
          componentName: 'FDP',
          id: this.generateId(),
          docId,
          props: {
            style: {
              ...(isInTable ? {} : { marginBottom: '1em' }),
              ...styles
            }
          },
          children,
          title: '段落',
          hidden: false,
          isLocked: false,
          condition: true,
          conditionGroup: ''
        };
      }
      
      case 'strong':
      case 'b': {
        // 粗体文本使用 NextText
        return {
          componentName: 'NextText',
          id: this.generateId(),
          docId,
          props: {
            type: 'inherit',
            children: text || '',
            strong: true,
            mark: false,
            code: false,
            delete: false,
            underline: false,
            prefix: '',
            classname: '',
            style: styles
          },
          hidden: false,
          title: '粗体',
          isLocked: false,
          condition: true,
          conditionGroup: ''
        };
      }
      
      case 'em':
      case 'i': {
        // 斜体使用 NextText 配合样式
        return {
          componentName: 'NextText',
          id: this.generateId(),
          docId,
          props: {
            type: 'inherit',
            children: text || '',
            mark: false,
            code: false,
            delete: false,
            underline: false,
            strong: false,
            prefix: '',
            classname: '',
            style: {
              fontStyle: 'italic',
              ...styles
            }
          },
          hidden: false,
          title: '斜体',
          isLocked: false,
          condition: true,
          conditionGroup: ''
        };
      }
      
      case 'u': {
        // 下划线使用 NextText
        return {
          componentName: 'NextText',
          id: this.generateId(),
          docId,
          props: {
            type: 'inherit',
            children: text || '',
            underline: true,
            mark: false,
            code: false,
            delete: false,
            strong: false,
            prefix: '',
            classname: '',
            style: styles
          },
          hidden: false,
          title: '下划线',
          isLocked: false,
          condition: true,
          conditionGroup: ''
        };
      }
      
      case 'ul':
      case 'ol': {
        // 列表使用 FDCell 容器
        componentName = 'FDCell';
        props = {
          align: 'left',
          verAlign: 'top',
          style: {
            paddingLeft: '24px',
            marginBottom: '12px',
            display: 'block',
            listStyle: tag === 'ul' ? 'disc' : 'decimal',
            ...styles
          }
        };
        children = childrenSchemas;
        title = tag === 'ul' ? '无序列表' : '有序列表';
        break;
      }
      
      case 'li': {
        // 列表项使用 FDCell 包装 NextText
        componentName = 'FDCell';
        props = {
          align: 'left',
          verAlign: 'top',
          style: {
            marginBottom: '8px',
            marginLeft: '8px',
            display: 'list-item',
            ...styles
          }
        };
        
        if (childrenSchemas.length > 0) {
          children = childrenSchemas;
        } else if (text) {
          // 列表项文本使用 NextText
          children = [{
            componentName: 'NextText',
            id: this.generateId(),
            docId,
            props: {
              type: 'inherit',
              children: text,
              mark: false,
              code: false,
              delete: false,
              underline: false,
              strong: false,
              prefix: '',
              classname: '',
              style: {}
            },
            hidden: false,
            title: '文本',
            isLocked: false,
            condition: true,
            conditionGroup: ''
          }];
        }
        title = '列表项';
        break;
      }
      
      case 'table': {
        // 使用原生 table 元素
        componentName = 'table';
        props = {
          className: 'parsed-table',
          style: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '16px',
            border: 'none',
            ...styles
          }
        };
        // 处理 table 子元素时传递 isInTable=true
        const tableChildren: any[] = [];
        for (let i = 0; i < element.children.length; i++) {
          const child = element.children[i] as HTMLElement;
          const childSchema = this.elementToSchema(child, tag, true);
          if (childSchema) {
            if (Array.isArray(childSchema)) {
              tableChildren.push(...childSchema);
            } else {
              tableChildren.push(childSchema);
            }
          }
        }
        children = tableChildren;
        title = '表格';
        break;
      }
      
      case 'tbody': {
        componentName = 'tbody';
        props = {};
        children = childrenSchemas;
        title = '表格主体';
        break;
      }
      
      case 'thead': {
        componentName = 'thead';
        props = {
          style: {
            backgroundColor: '#fafafa',
            ...styles
          }
        };
        children = childrenSchemas;
        title = '表头';
        break;
      }
      
      case 'tfoot': {
        componentName = 'tfoot';
        props = {
          style: {
            backgroundColor: '#fafafa',
            ...styles
          }
        };
        children = childrenSchemas;
        title = '表尾';
        break;
      }
      
      case 'tr': {
        // 使用原生 tr 元素
        componentName = 'tr';
        props = {
          className: 'parsed-table-row',
          style: styles
        };
        children = childrenSchemas;
        title = '表格行';
        break;
      }
      
      case 'td':
      case 'th': {
        const isTh = tag === 'th';
        
        // 获取 colspan 和 rowspan 属性
        const colspanAttr = element.getAttribute('colspan');
        const rowspanAttr = element.getAttribute('rowspan');
        const colspan = colspanAttr ? parseInt(colspanAttr, 10) : 1;
        const rowspan = rowspanAttr ? parseInt(rowspanAttr, 10) : 1;
        
        // 使用原生 td/th 元素
        componentName = isTh ? 'th' : 'td';
        props = {
          className: isTh ? 'parsed-table-th' : 'parsed-table-td',
          // 原生 colspan 和 rowspan 属性
          ...(colspan > 1 ? { colspan } : {}),
          ...(rowspan > 1 ? { rowspan } : {}),
          style: {
            padding: '2px',
            border: 'none',
            textAlign: isTh ? 'center' : 'left',
            verticalAlign: 'middle',
            ...(isTh ? {
              fontWeight: 'bold'
            } : {}),
            ...styles
          }
        };
        
        // 处理表格单元格的子元素，扁平化 FDP 段落层
        if (childrenSchemas.length > 0) {
          // 扁平化处理：如果子元素是 FDP（段落），则提取其中的文本组件
          const flattenedChildren: any[] = [];
          childrenSchemas.forEach((childSchema) => {
            if (childSchema.componentName === 'FDP' && childSchema.children) {
              // 提取 FDP 中的子元素（通常是 NextText）
              flattenedChildren.push(...childSchema.children);
            } else {
              // 非 FDP 元素，直接使用
              flattenedChildren.push(childSchema);
            }
          });
          children = flattenedChildren;
        } else if (text) {
          // 单元格文本使用 NextText
          children = [{
            componentName: 'NextText',
            id: this.generateId(),
            docId,
            props: {
              type: 'inherit',
              children: text,
              mark: false,
              code: false,
              delete: false,
              underline: false,
              strong: isTh,
              prefix: '',
              classname: '',
              style: {
                lineHeight: '1.5',
                margin: '0',
                marginBottom: '0',
                padding: '0',
                fontSize: 'inherit'
              }
            },
            hidden: false,
            title: '文本',
            isLocked: false,
            condition: true,
            conditionGroup: ''
          }];
        }
        title = isTh ? '表头' : '表格单元格';
        break;
      }
      
      case 'a': {
        // 链接使用 NextText
        const href = element.getAttribute('href');
        return {
          componentName: 'NextText',
          id: this.generateId(),
          docId,
          props: {
            type: 'inherit',
            children: text || href || '',
            mark: false,
            code: false,
            delete: false,
            underline: true,
            strong: false,
            prefix: '',
            classname: '',
            style: {
              color: '#1890ff',
              cursor: 'pointer',
              ...styles
            },
            ...(href && { href })
          },
          hidden: false,
          title: '链接',
          isLocked: false,
          condition: true,
          conditionGroup: ''
        };
      }
      
      case 'img': {
        // 图片暂时使用 FDCell 包装
        componentName = 'FDCell';
        const src = element.getAttribute('src');
        const alt = element.getAttribute('alt');
        props = {
          align: 'left',
          verAlign: 'top',
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            maxWidth: '100%',
            ...styles
          },
          ...(src && { src }),
          ...(alt && { alt })
        };
        title = '图像';
        break;
      }
      
      case 'blockquote': {
        // 引用块使用 FDCell 包装 NextText
        componentName = 'FDCell';
        props = {
          align: 'left',
          verAlign: 'top',
          style: {
            borderLeft: '4px solid #1890ff',
            paddingLeft: '12px',
            marginLeft: '0',
            marginBottom: '12px',
            marginTop: '12px',
            fontStyle: 'italic',
            color: '#666',
            backgroundColor: '#f9f9f9',
            padding: '12px',
            display: 'block',
            ...styles
          }
        };
        children = childrenSchemas.length > 0 ? childrenSchemas : (text ? [{
          componentName: 'NextText',
          id: this.generateId(),
          docId,
          props: {
            type: 'inherit',
            children: text,
            mark: false,
            code: false,
            delete: false,
            underline: false,
            strong: false,
            prefix: '',
            classname: '',
            style: {
              fontStyle: 'italic',
              color: '#666'
            }
          },
          hidden: false,
          title: '文本',
          isLocked: false,
          condition: true,
          conditionGroup: ''
        }] : []);
        title = '引用';
        break;
      }
      
      case 'code': {
        // 行内代码使用 NextText
        return {
          componentName: 'NextText',
          id: this.generateId(),
          docId,
          props: {
            type: 'inherit',
            children: text || '',
            code: true,
            mark: false,
            delete: false,
            underline: false,
            strong: false,
            prefix: '',
            classname: '',
            style: {
              backgroundColor: '#f5f5f5',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '12px',
              ...styles
            }
          },
          hidden: false,
          title: '代码',
          isLocked: false,
          condition: true,
          conditionGroup: ''
        };
      }
      
      case 'pre': {
        // 代码块使用 FDCell 包装 NextText
        componentName = 'FDCell';
        props = {
          align: 'left',
          verAlign: 'top',
          style: {
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            marginBottom: '12px',
            fontFamily: 'monospace',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            display: 'block',
            ...styles
          }
        };
        children = childrenSchemas.length > 0 ? childrenSchemas : (text ? [{
          componentName: 'NextText',
          id: this.generateId(),
          docId,
          props: {
            type: 'inherit',
            children: text,
            code: true,
            mark: false,
            delete: false,
            underline: false,
            strong: false,
            prefix: '',
            classname: '',
            style: {
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap'
            }
          },
          hidden: false,
          title: '文本',
          isLocked: false,
          condition: true,
          conditionGroup: ''
        }] : []);
        title = '代码块';
        break;
      }
      
      case 'hr': {
        // 分隔线使用 FDCell
        componentName = 'FDCell';
        props = {
          align: 'left',
          verAlign: 'top',
          style: {
            height: '1px',
            backgroundColor: '#d9d9d9',
            border: 'none',
            marginTop: '12px',
            marginBottom: '12px',
            display: 'block',
            ...styles
          }
        };
        title = '分隔线';
        break;
      }
      
      case 'span':
      case 'div':
      default: {
        // 通用容器使用 FDCell 包装 NextText
        componentName = 'FDCell';
        props = {
          align: 'left',
          verAlign: 'top',
          style: {
            display: 'block',
            backgroundColor: 'rgba(255,255,255,1)',
            ...styles
          }
        };
        
        if (childrenSchemas.length > 0) {
          children = childrenSchemas;
        } else if (text) {
          // 纯文本使用 NextText
          children = [{
            componentName: 'NextText',
            id: this.generateId(),
            docId,
            props: {
              type: 'inherit',
              children: text,
              mark: false,
              code: false,
              delete: false,
              underline: false,
              strong: false,
              prefix: '',
              classname: '',
              style: {}
            },
            hidden: false,
            title: '文本',
            isLocked: false,
            condition: true,
            conditionGroup: ''
          }];
        }
        title = tag.charAt(0).toUpperCase() + tag.slice(1);
        break;
      }
    }
    
    // 返回完整的 Schema 对象（符合 Lowcode Engine 标准格式）
    // children作为组件的直接属性，不放在props中
    const schema: any = {
      componentName,
      id: this.generateId(),
      docId,
      props,
      title: title || componentName,
      hidden: false,
      isLocked: false,
      condition: true,
      conditionGroup: '',
    };
    
    // 如果有children，添加为直接属性
    if (children !== undefined && children !== null) {
      if (Array.isArray(children) && children.length > 0) {
        schema.children = children;
      } else if (typeof children === 'string' && children.trim()) {
        schema.children = children;
      } else if (!Array.isArray(children)) {
        schema.children = children;
      }
    }
    
    // 如果既没有 children 也没有文本内容，返回 null
    if (!schema.children) {
      return null;
    }
    
    return schema;
  },
  
  /**
   * 解析HTML字符串并转换为Schema
   */
  parse(htmlContent: string): any {
    try {
      console.log('[HtmlToSchemaConverter] 开始解析 HTML，长度:', htmlContent?.length);
      
      if (!htmlContent || htmlContent.trim().length === 0) {
        console.warn('[HtmlToSchemaConverter] HTML 内容为空');
        return null;
      }
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      console.log('[HtmlToSchemaConverter] Body 子元素数量:', doc.body.children.length);
      console.log('[HtmlToSchemaConverter] Body 文本内容:', doc.body.innerText?.trim().substring(0, 100));
      
      // 处理 body 的所有子元素
      if (doc.body.children.length === 0) {
        return null;
      }
      
      // 如果只有一个子元素，直接转换
      if (doc.body.children.length === 1) {
        const result = this.elementToSchema(doc.body.children[0] as HTMLElement);
        // 展平可能的数组返回
        const flattened = flattenSchema(result);
        return flattened.length === 1 ? flattened[0] : 
               flattened.length > 1 ? flattened : null;
      }
      
      // 如果有多个子元素，转换所有元素并展平
      const allChildren = Array.from(doc.body.children)
        .map(child => this.elementToSchema(child as HTMLElement))
        .map(result => flattenSchema(result))  // 展平每个结果
        .flat()  // 再次展平
        .filter(Boolean);
      
      // 如果转换后只有一个有效元素，直接返回
      if (allChildren.length === 1) {
        return allChildren[0];
      }
      
      // 多个元素直接返回数组，让外层处理
      if (allChildren.length > 1) {
        return allChildren;
      }
      
      return null;
    } catch (error) {
      console.error('HTML解析失败:', error);
      return null;
    }
  }
};

const DocumentParserPlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      const { skeleton, project, config } = ctx;
      
      // 预览和编辑对话框
      const showPreviewDialog = (
        parsedContent: any,
        fileName: string,
        onApply: (content: any) => void,
        onCancel: () => void
      ) => {
        let editableContent = JSON.parse(JSON.stringify(parsedContent)); // 深拷贝
        
        // 下载 JSON 文件的函数
        const downloadJSON = () => {
          const jsonStr = JSON.stringify(editableContent, null, 2);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName.replace(/\.[^/.]+$/, '')}-lowcode-schema.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          Message.success('Schema JSON 已下载');
        };
        
        const dialogInstance = Dialog.show({
          title: `预览和编辑: ${fileName}`,
          style: { width: '900px', maxHeight: '80vh' },
          content: (
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
              {/* 添加表格相关的 CSS 样式 */}
              <style>{`
                /* CSS Grid 表格样式 */
                .parsed-table-grid {
                  display: grid !important;
                  gap: 0;
                  margin-bottom: 12px;
                  border: 1px solid #e0e0e0;
                }
                .parsed-table-th,
                .parsed-table-td {
                  padding: 8px;
                  border: 1px solid #e0e0e0;
                  display: flex !important;
                  align-items: center;
                  word-break: break-word;
                }
                .parsed-table-th {
                  background-color: #fafafa;
                  font-weight: bold;
                  justify-content: center;
                }
                .parsed-table-td {
                  background-color: #fff;
                  justify-content: flex-start;
                }
              `}</style>
              
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                border: '1px solid #d9d9d9'
              }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      📄 文件: {fileName}
                    </label>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>
                      预览解析结果。点击下方文本可编辑内容。确认无误后点击"应用"按钮。
                    </p>
                  </div>
                  <Button
                    type="secondary"
                    size="small"
                    onClick={downloadJSON}
                    style={{ marginLeft: '16px' }}
                  >
                    📥 下载 JSON
                  </Button>
                </div>
                
                {/* 预览内容 */}
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                  marginTop: '12px',
                  overflowX: 'auto'
                }}>
                  <PreviewContent 
                    content={editableContent} 
                    onContentChange={(newContent) => {
                      editableContent = newContent;
                    }}
                  />
                </div>
              </div>
            </div>
          ),
          onOk: () => {
            onApply(editableContent, dialogInstance);
            return false; // 阻止自动关闭，由 onApply 手动控制
          },
          onCancel: () => {
            onCancel();
            return true;
          },
        });
      };
      
      // 预览内容组件
      /**
       * 渲染 Schema 的函数 - 真正显示内容而不是 JSON 编辑
       */
      const renderSchema = (content: any): any => {
        if (Array.isArray(content)) {
          return content.map((item, idx) => (
            <React.Fragment key={idx}>
              {renderSchema(item)}
            </React.Fragment>
          ));
        }
        
        if (content && typeof content === 'object' && content.componentName) {
          const { componentName, props = {} } = content;
          const { children, style = {}, className, ...otherProps } = props;
          
          // 合并类名
          const mergedClassName = className || '';
          
          // 根据 componentName 渲染合适的元素
          if (componentName === 'FDCell' || componentName === 'Div') {
            return (
              <div 
                style={style} 
                className={mergedClassName}
                title={content.title}
              >
                {children ? renderSchema(children) : null}
              </div>
            );
          }
          
          if (componentName === 'FDP' || componentName === 'Paragraph') {
            return (
              <p style={style} className={mergedClassName}>
                {children ? renderSchema(children) : null}
              </p>
            );
          }
          
          if (componentName === 'Image') {
            return (
              <img 
                src={props.src} 
                alt={props.alt || 'image'}
                style={style}
                className={mergedClassName}
              />
            );
          }
          
          // 默认渲染为 Div
          return (
            <div style={style} className={mergedClassName} title={content.title}>
              {children ? renderSchema(children) : null}
            </div>
          );
        }
        
        if (typeof content === 'string') {
          return content;
        }
        
        return null;
      };
      
      const PreviewContent = ({ 
        content, 
        onContentChange 
      }: { 
        content: any; 
        onContentChange: (content: any) => void;
      }) => {
        const [showRaw, setShowRaw] = React.useState(false);
        
        if (Array.isArray(content)) {
          return (
            <div>
              {content.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <PreviewContent 
                    content={item} 
                    onContentChange={(newContent) => {
                      // 创建新数组，避免直接修改原数组
                      const newArray = [...content];
                      newArray[idx] = newContent;
                      onContentChange(newArray);
                    }}
                  />
                </div>
              ))}
            </div>
          );
        }
        
        if (content && typeof content === 'object' && content.componentName) {
          const { componentName, props } = content;
          const { children, ...otherProps } = props || {};
          
          return (
            <div>
              <div style={{
                padding: '8px',
                marginBottom: '4px',
                backgroundColor: '#f0f2f5',
                borderRadius: '2px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <strong>{componentName}</strong>
                  {props?.style && ' (带样式)'}
                </div>
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    background: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  {showRaw ? '渲染视图' : '原始JSON'}
                </button>
              </div>
              
              {showRaw ? (
                // JSON 编辑视图
                <div>
                  {typeof children === 'string' ? (
                    <textarea
                      value={children}
                      onChange={(e) => {
                        const newContent = JSON.parse(JSON.stringify(content));
                        newContent.props = { ...newContent.props, children: e.target.value };
                        onContentChange(newContent);
                      }}
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '8px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '13px', color: '#333' }}>
                      <PreviewContent 
                        content={children} 
                        onContentChange={(newContent) => {
                          const newItem = JSON.parse(JSON.stringify(content));
                          newItem.props = { ...newItem.props, children: newContent };
                          onContentChange(newItem);
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                // 渲染视图 - 真正显示样式和内容
                <div style={{
                  padding: '12px',
                  marginBottom: '12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '2px',
                  backgroundColor: '#fafafa'
                }}>
                  {renderSchema(content)}
                </div>
              )}
            </div>
          );
        }
        
        return <div style={{ fontSize: '13px', color: '#666' }}>{String(content)}</div>;
      };
      
      // 解析HTML文档
      const parseHTML = async (file: File): Promise<any> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const htmlContent = e.target?.result as string;
            const schema = HtmlToSchemaConverter.parse(htmlContent);
            
            if (schema) {
              Message.success('HTML文档已解析，包含样式信息');
              resolve(schema);
            } else {
              reject(new Error('HTML解析失败'));
            }
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      };
      
      // 解析图片并添加到画布
      const parseImage = async (file: File): Promise<any> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            
            // 创建一个临时图片来获取尺寸
            const img = new Image();
            img.onload = () => {
              // 计算合适的显示尺寸
              let displayWidth = img.width;
              let displayHeight = img.height;
              const maxWidth = 800;
              
              if (displayWidth > maxWidth) {
                const ratio = maxWidth / displayWidth;
                displayWidth = maxWidth;
                displayHeight = displayHeight * ratio;
              }
              
              Message.success(`图片已解析: ${file.name} (${img.width}x${img.height})`);
              
              // 直接返回图片组件，不包装在容器中
              const imageSchema = {
                componentName: 'Image',
                props: {
                  src: imageUrl,
                  alt: file.name,
                  style: {
                    maxWidth: '100%',
                    width: `${displayWidth}px`,
                    height: 'auto',
                    borderRadius: '4px',
                  },
                },
              };
              
              resolve(imageSchema);
            };
            img.onerror = () => {
              reject(new Error('图片加载失败'));
            };
            img.src = imageUrl;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };
      
      // 解析PDF - 渲染每页为图片（保留完整样式和布局）
      const parsePDF = async (file: File): Promise<any> => {
        try {
          // 动态加载 PDF.js
          const pdfLib = await loadPDFJS();
          
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          console.log(`[PDF解析] 开始解析PDF: ${file.name}, 共 ${pdf.numPages} 页`);
          
          const pageSchemas: any[] = [];
          
          // 遍历所有页面，将每一页渲染为图片
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // 获取页面视口，设置合适的缩放比例以获得高清图片
            const viewport = page.getViewport({ scale: 2.0 });
            
            // 创建 canvas 元素用于渲染
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (!context) {
              console.error(`[PDF解析] 第 ${pageNum} 页无法创建canvas context`);
              continue;
            }
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // 渲染PDF页面到canvas
            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // 将canvas转换为图片URL
            const imageDataUrl = canvas.toDataURL('image/png');
            
            console.log(`[PDF解析] 第 ${pageNum}/${pdf.numPages} 页渲染完成，图片大小: ${(imageDataUrl.length / 1024).toFixed(1)}KB`);
            
            // 创建图片组件Schema
            const pageComponents = [
              {
                componentName: 'FDCell',
                id: HtmlToSchemaConverter.generateId(),
                docId: HtmlToSchemaConverter.getDocId(),
                props: {
                  children: [
                    {
                      componentName: 'Image',
                      id: HtmlToSchemaConverter.generateId(),
                      docId: HtmlToSchemaConverter.getDocId(),
                      props: {
                        src: imageDataUrl,
                        alt: `${file.name} - 第 ${pageNum} 页`,
                        style: {
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      },
                      hidden: false,
                      title: `第${pageNum}页`,
                      isLocked: false,
                      condition: true,
                      conditionGroup: ''
                    }
                  ],
                  style: {
                    padding: '0',
                    backgroundColor: '#fff',
                    marginBottom: pageNum < pdf.numPages ? '20px' : '0'
                  }
                },
                hidden: false,
                title: `第${pageNum}页`,
                isLocked: false,
                condition: true,
                conditionGroup: ''
              }
            ];
            
            // 生成完整的页面Schema
            const pageSchema = HtmlToSchemaConverter.generateLowcodeSchema(
              pageComponents,
              `${file.name}_page_${pageNum}`
            );
            
            pageSchemas.push(pageSchema);
          }
          
          console.log(`[PDF解析] ✓ 所有页面渲染完成`);
          Message.success(`PDF已解析: ${file.name}, 共 ${pdf.numPages} 页（完整保留样式）`);
          
          // 返回多页面数组,标记为多页面模式
          return {
            isMultiPage: true,
            pages: pageSchemas,
            fileName: file.name,
            pageCount: pdf.numPages
          };
        } catch (error) {
          console.error('PDF解析失败:', error);
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          Message.error(`PDF解析失败: ${errorMsg}`);
          
          // 返回错误提示组件
          return {
            componentName: 'FDP',
            props: {
              children: `PDF文件: ${file.name} (解析失败: ${errorMsg})`,
              style: {
                padding: '20px',
                backgroundColor: '#fff1f0',
                borderRadius: '4px',
                color: '#ff4d4f',
              },
            },
          };
        }
      };
      
      // 解析Word文档 - 按Word实际分页逐页解析并保存为数组
      const parseWord = async (file: File): Promise<any> => {
        try {
          // 动态加载 Mammoth
          const mammothLib = await loadMammoth();
          
          const arrayBuffer = await file.arrayBuffer();
          
          console.log('[parseWord] 开始逐页解析Word文档...');
          
          // 步骤1: 使用mammoth提取原始文档结构，按分页符分组段落
          let currentPageParagraphs: any[] = [];
          let allPages: any[][] = [];
          let paragraphIndex = 0;
          
          // 使用transformDocument API遍历文档结构，按分页符分组
          const extractOptions = {
            arrayBuffer,
            convertImage: mammothLib.default.images.imgElement((image: any) => {
              return image.read("base64").then((imageBuffer: string) => {
                return {
                  src: "data:" + image.contentType + ";base64," + imageBuffer
                };
              });
            }),
            transformDocument: (document: any) => {
              console.log('[parseWord] 开始提取文档结构...');
              console.log('[parseWord] document.children 数量:', document.children?.length);
              
              // 遍历所有body元素
              if (document.children) {
                document.children.forEach((element: any, elemIdx: number) => {
                  console.log(`[parseWord] 元素 #${elemIdx + 1}: type=${element.type}`);
                  
                  // 处理段落
                  if (element.type === 'paragraph' && element.children) {
                    // 查找段落内的所有分页符位置
                    const pageBreakIndices: number[] = [];
                    element.children.forEach((child: any, idx: number) => {
                      if (child.type === 'break') {
                        console.log(`[parseWord]   段落内子元素 #${idx}: type=break, breakType=${child.breakType}`);
                      }
                      if (child.type === 'break' && child.breakType === 'page') {
                        pageBreakIndices.push(idx);
                        console.log(`[parseWord]   ✓ 检测到分页符！位置=${idx}`);
                      }
                    });
                    
                    if (pageBreakIndices.length === 0) {
                      // 没有分页符，整个段落添加到当前页
                      currentPageParagraphs.push(element);
                    } else {
                      // 有分页符，需要分割段落
                      console.log(`[parseWord]   段落包含 ${pageBreakIndices.length} 个分页符`);
                      let lastIndex = 0;
                      
                      pageBreakIndices.forEach((breakIdx, idx) => {
                        // 分页符前的内容
                        if (breakIdx > lastIndex) {
                          const beforeBreak = {
                            ...element,
                            children: element.children.slice(lastIndex, breakIdx)
                          };
                          currentPageParagraphs.push(beforeBreak);
                        }
                        
                        // 保存当前页并开始新页
                        if (currentPageParagraphs.length > 0) {
                          allPages.push([...currentPageParagraphs]);
                          console.log(`[parseWord] 段落内分页符 #${idx + 1}，保存第 ${allPages.length} 页，包含 ${currentPageParagraphs.length} 个元素`);
                          currentPageParagraphs = [];
                        }
                        
                        lastIndex = breakIdx + 1;
                      });
                      
                      // 最后一个分页符后的内容
                      if (lastIndex < element.children.length) {
                        const afterBreak = {
                          ...element,
                          children: element.children.slice(lastIndex)
                        };
                        currentPageParagraphs.push(afterBreak);
                      }
                    }
                  } 
                  // 处理表格（表格通常不包含分页符）
                  else if (element.type === 'table') {
                    currentPageParagraphs.push(element);
                  }
                  // 处理独立的分页符（段落外的分页符）
                  else if (element.type === 'break' && element.breakType === 'page') {
                    console.log(`[parseWord] ✓ 检测到独立分页符！`);
                    // 保存当前页
                    if (currentPageParagraphs.length > 0) {
                      allPages.push([...currentPageParagraphs]);
                      console.log(`[parseWord] 独立分页符，保存第 ${allPages.length} 页，包含 ${currentPageParagraphs.length} 个元素`);
                      currentPageParagraphs = [];
                    }
                  }
                  // 其他元素类型也添加到当前页
                  else {
                    currentPageParagraphs.push(element);
                  }
                });
              }
              
              // 保存最后一页
              if (currentPageParagraphs.length > 0) {
                allPages.push([...currentPageParagraphs]);
                console.log(`[parseWord] 保存最后一页（第 ${allPages.length} 页），包含 ${currentPageParagraphs.length} 个元素`);
              }
              
              console.log(`[parseWord] === 文档结构提取完成，共识别 ${allPages.length} 页 ===`);
              
              return document;
            }
          };
          
          // 执行文档结构提取
          await mammothLib.default.convertToHtml(extractOptions);
          
          console.log(`[parseWord] ✓ 文档结构提取完成，共 ${allPages.length} 页`);
          
          // 步骤2: 逐页转换为HTML
          let pages: string[] = [];
          
          if (allPages.length > 0) {
            // 有明确的分页结构，逐页转换
            for (let pageIdx = 0; pageIdx < allPages.length; pageIdx++) {
              const pageParagraphs = allPages[pageIdx];
              
              console.log(`[parseWord] 正在转换第 ${pageIdx + 1}/${allPages.length} 页，包含 ${pageParagraphs.length} 个元素...`);
              
              // 构造临时文档结构用于转换
              const pageDocument = {
                type: 'document',
                children: pageParagraphs
              };
              
              // 转换这一页为HTML
              try {
                const pageResult = await mammothLib.default.convertToHtml({
                  arrayBuffer,
                  transformDocument: () => pageDocument
                });
                
                if (pageResult.value) {
                  pages.push(pageResult.value);
                  const pageText = pageResult.value.replace(/<[^>]+>/g, '');
                  const preview = pageText.substring(0, 60).replace(/\s+/g, ' ');
                  console.log(`[parseWord] 第 ${pageIdx + 1} 页转换完成: ${pageText.length} 字符, 预览="${preview}..."`);
                }
              } catch (pageError) {
                console.error(`[parseWord] 第 ${pageIdx + 1} 页转换失败:`, pageError);
              }
            }
            
            console.log(`[parseWord] ✓ 所有页面转换完成，共 ${pages.length} 页`);
          } else {
            // 没有检测到分页符，使用完整文档转换后再智能分割
            console.log('[parseWord] ⚠ 未检测到分页符，将使用智能分割作为备用方案');
            
            // 执行标准转换获取完整HTML
            const fullResult = await mammothLib.default.convertToHtml({ arrayBuffer });
            const htmlContent = fullResult.value || '';
            
            // 使用智能分页策略
            const allElements = htmlContent.match(/<(p|h[1-6]|div|table|ul|ol)[^>]*>[\s\S]*?<\/\1>/gi) || [];
            console.log(`[parseWord] 共提取到 ${allElements.length} 个内容元素`);
            
            if (allElements.length === 0) {
              pages = [htmlContent];
            } else {
              const totalText = htmlContent.replace(/<[^>]+>/g, '');
              const totalChars = totalText.length;
              const charsPerPage = 2400; // 调整为2400字符/页，更接近A4纸实际容量
              const estimatedPages = Math.max(1, Math.ceil(totalChars / charsPerPage));
              
              console.log(`[parseWord] 文档总字符数: ${totalChars}, 预估页数: ${estimatedPages}`);
              
              let currentPage: string[] = [];
              let currentPageWeight = 0;
              
              for (const element of allElements) {
                const elementText = element.replace(/<[^>]+>/g, '');
                const elementChars = elementText.length;
                let elementWeight = elementChars;
                
                if (element.match(/<table[\s\S]*?<\/table>/i)) {
                  const tableRows = (element.match(/<tr[\s\S]*?<\/tr>/gi) || []).length;
                  elementWeight = elementChars * 1.3 + (tableRows * 30); // 降低表格权重
                }
                else if (element.match(/<h[1-6]/i)) {
                  elementWeight = elementChars * 1.2; // 降低标题权重
                }
                else if (element.match(/<(ul|ol)/i)) {
                  const listItems = (element.match(/<li[\s\S]*?<\/li>/gi) || []).length;
                  elementWeight = elementChars * 1.1 + (listItems * 10); // 降低列表权重
                }
                
                if (currentPageWeight > 0 && currentPageWeight + elementWeight > charsPerPage) {
                  pages.push(currentPage.join(''));
                  currentPage = [element];
                  currentPageWeight = elementWeight;
                } else {
                  currentPage.push(element);
                  currentPageWeight += elementWeight;
                }
              }
              
              if (currentPage.length > 0) {
                pages.push(currentPage.join(''));
              }
              
              console.log(`[parseWord] 智能分页完成，共 ${pages.length} 个页面（备用方案）`);
            }
          }
          
          // 步骤3: 将页面HTML数组转换为Lowcode Schema数组
          console.log(`[parseWord] === 开始将 ${pages.length} 个页面转换为Schema ===`);
          
          if (pages.length === 0) {
            console.warn('[parseWord] 没有提取到任何页面内容');
            Message.warning(`文档 "${file.name}" 内容为空或无法识别`);
            return null;
          }
          
          const pageSchemas: any[] = [];
          
          for (let i = 0; i < pages.length; i++) {
            const pageHtml = pages[i];
            
            // 验证分页内容
            const pageText = pageHtml.replace(/<[^>]+>/g, '').trim();
            if (!pageText) {
              console.warn(`[parseWord] 第 ${i + 1} 页内容为空，跳过`);
              continue;
            }
            
            const preview = pageText.substring(0, 80).replace(/\s+/g, ' ');
            const pageChars = pageText.length;
            
            // 统计页面中的特殊元素
            const tables = (pageHtml.match(/<table[\s\S]*?<\/table>/gi) || []).length;
            const headings = (pageHtml.match(/<h[1-6]/gi) || []).length;
            const paragraphs = (pageHtml.match(/<p[\s\S]*?<\/p>/gi) || []).length;
            
            console.log(`[parseWord] 转换第 ${i + 1}/${pages.length} 页: 字符=${pageChars}, 段落=${paragraphs}, 表格=${tables}, 标题=${headings}`);
            console.log(`[parseWord]   预览: "${preview}..."`);
            
            try {
              const pageSchema = HtmlToSchemaConverter.parse(pageHtml);
              
              console.log(`[parseWord]   parse结果类型: ${typeof pageSchema}, 是否为数组: ${Array.isArray(pageSchema)}`);
              console.log(`[parseWord]   parse结果:`, pageSchema);
              
              // 验证Schema有效性 - 支持多种返回格式
              let isValid = false;
              let componentCount = 0;
              
              if (Array.isArray(pageSchema)) {
                // 返回的是组件数组
                isValid = pageSchema.length > 0;
                componentCount = pageSchema.length;
              } else if (pageSchema && typeof pageSchema === 'object') {
                // 返回的是对象
                if (pageSchema.children && Array.isArray(pageSchema.children)) {
                  isValid = pageSchema.children.length > 0;
                  componentCount = pageSchema.children.length;
                } else {
                  // 单个组件对象
                  isValid = true;
                  componentCount = 1;
                }
              }
              
              if (!isValid) {
                console.warn(`[parseWord] 第 ${i + 1} 页Schema转换失败或内容为空`);
                console.warn(`[parseWord]   原始HTML长度: ${pageHtml.length}`);
                continue;
              }
              
              console.log(`[parseWord]   ✓ Schema转换成功，包含 ${componentCount} 个组件`);
              pageSchemas.push(pageSchema);
            } catch (error) {
              console.error(`[parseWord] 第 ${i + 1} 页转换失败:`, error);
              console.error(`[parseWord]   HTML内容:`, pageHtml.substring(0, 200));
              Message.error(`文档第 ${i + 1} 页转换失败`);
            }
          }
          
          // 最终验证
          if (pageSchemas.length === 0) {
            console.error('[parseWord] 没有成功转换任何页面');
            Message.error(`文档 "${file.name}" 解析失败：无法生成有效的页面内容`);
            return null;
          }
          
          console.log(`[parseWord] === 全部转换完成，成功生成 ${pageSchemas.length} 个页面Schema ===`);
          
          // 步骤4: 为每一页生成完整的Lowcode Schema
          const fullPageSchemas = pageSchemas.map((pageSchema, index) => {
            return HtmlToSchemaConverter.generateLowcodeSchema(pageSchema, `word_page_${index + 1}`);
          });
          
          // 返回多页面格式
          const result = {
            isMultiPage: true,
            pages: fullPageSchemas,
            fileName: file.name,
            pageCount: fullPageSchemas.length
          };
          
          console.log(`[parseWord] === 最终结果 ===`);
          console.log(`[parseWord] 文件名: ${result.fileName}`);
          console.log(`[parseWord] 页面数量: ${result.pageCount}`);
          console.log(`[parseWord] 是否多页面: ${result.isMultiPage}`);
          console.log(`[parseWord] =====================`);
          
          Message.success(`成功导入 "${file.name}"，共 ${fullPageSchemas.length} 个页面（与Word文档一致）`);
          return result;
        } catch (error) {
          console.error('Word解析失败:', error);
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          Message.error(`Word解析失败: ${errorMsg}`);
          
          // 创建错误提示组件
          const errorComponent = {
            componentName: 'FDP',
            id: HtmlToSchemaConverter.generateId(),
            docId: HtmlToSchemaConverter.getDocId(),
            props: {
              children: [{
                componentName: 'NextText',
                id: HtmlToSchemaConverter.generateId(),
                docId: HtmlToSchemaConverter.getDocId(),
                props: {
                  type: 'inherit',
                  children: `Word文档: ${file.name} (解析失败: ${errorMsg})`,
                  mark: false,
                  code: false,
                  delete: false,
                  underline: false,
                  strong: false,
                  prefix: '',
                  classname: '',
                  style: {
                    padding: '20px',
                    backgroundColor: '#fff1f0',
                    borderRadius: '4px',
                    color: '#ff4d4f'
                  }
                },
                hidden: false,
                title: '',
                isLocked: false,
                condition: true,
                conditionGroup: ''
              }]
            },
            title: '错误',
            hidden: false,
            isLocked: false,
            condition: true,
            conditionGroup: ''
          };
          
          // 返回完整的 Lowcode Schema
          return HtmlToSchemaConverter.generateLowcodeSchema([errorComponent], file.name);
        }
      };
      
      // 处理文件上传
      const handleFileUpload = async (file: File, shouldOverwrite: boolean = false, onComplete?: () => void) => {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        
        try {
          let schema: any = null;
          
          // 根据文件类型选择解析方式
          if (
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileType === 'application/msword' ||
            /\.(docx|doc)$/i.test(fileName)
          ) {
            // 直接解析Word文档
            schema = await parseWord(file);
          } else if (fileName.endsWith('.html') || fileType === 'text/html') {
            schema = await parseHTML(file);
          } else if (fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) {
            schema = await parseImage(file);
          } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            schema = await parsePDF(file);
          } else {
            Message.error(`不支持的文件类型: ${fileType || fileName}`);
            return false;
          }
          
          // 解析成功后处理结果
          if (schema) {
            // 检查是否是多页面模式
            if (schema.isMultiPage && schema.pages && Array.isArray(schema.pages)) {
              console.log(`[文件上传] 检测到多页面文档,共 ${schema.pageCount} 页`);
              
              // ===== 重要：在创建新页面前，先保存当前页面的内容（覆盖模式下跳过） =====
              if (!shouldOverwrite) {
                try {
                  const currentPageId = useEditorStore.getState().currentPageId;
                  if (currentPageId && project.currentDocument) {
                    console.log('[文件上传] 保存当前页面内容:', currentPageId);
                  
                  const currentPageSchema = project.exportSchema();
                  if (currentPageSchema && currentPageSchema.componentsTree && currentPageSchema.componentsTree[0]) {
                    const currentDocument = useEditorStore.getState().document;
                    const currentPageIndex = currentDocument.pages.findIndex(p => p.settings.id === currentPageId);
                    
                    if (currentPageIndex >= 0) {
                      const componentsToSave = JSON.parse(JSON.stringify(
                        currentPageSchema.componentsTree[0].children || []
                      ));
                      
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
                      
                      console.log('[文件上传] ✓ 已保存当前页面内容');
                    }
                  }
                }
              } catch (saveError) {
                console.warn('[文件上传] 保存当前页面时出错:', saveError);
              }
              } else {
                console.log('[文件上传] 覆盖模式：跳过保存当前页面内容');
              }
              // ===== 保存完成 =====
              
              // 验证每个页面的schema是否真的不同
              console.log('[文件上传] 验证每页schema差异:');
              for (let checkIdx = 0; checkIdx < Math.min(3, schema.pages.length); checkIdx++) {
                const checkPage = schema.pages[checkIdx];
                const checkChildren = checkPage?.componentsTree?.[0]?.children || [];
                console.log(`  页面 ${checkIdx + 1}: ${checkChildren.length} 个子组件`);
                
                // 深入检查实际内容
                if (checkChildren.length > 0) {
                  const firstChild = checkChildren[0];
                  const childInfo = JSON.stringify(firstChild).substring(0, 200);
                  console.log(`  页面 ${checkIdx + 1} 第1个子组件预览: ${childInfo}`);
                }
              }
              
              // 为每一页创建新的低代码页面
              let successCount = 0;
              const createdPages: Array<{ id: string; name: string; content: any[] }> = [];
              
              for (let i = 0; i < schema.pages.length; i++) {
                const pageSchema = schema.pages[i];
                const pageName = `第${i + 1}页`; // 简洁的页面名称
                
                try {
                  console.log(`[文件上传] 创建页面 ${i + 1}/${schema.pageCount}:`, pageName);
                  
                  // 提取页面内容 - 使用深拷贝避免引用共享
                  let pageContent: any[] = [];
                  if (pageSchema?.componentsTree?.[0]?.children) {
                    // 深拷贝内容,避免所有页面共享同一个数组引用
                    pageContent = JSON.parse(JSON.stringify(pageSchema.componentsTree[0].children));
                  }
                  
                  console.log(`[文件上传] 页面 ${i + 1} 原始提取到 ${pageContent.length} 个组件`);
                  
                  // 递归展平嵌套的容器结构（FDPage/Page/FDSection/FDBlock等）
                  const flattenComponents = (components: any[]): any[] => {
                    const result: any[] = [];
                    
                    for (const component of components) {
                      const isContainer = 
                        component.componentName === 'FDPage' ||
                        component.componentName === 'Page' ||
                        component.componentName === 'FDSection' ||
                        component.componentName === 'FDBlock';
                      
                      if (isContainer && component.children && Array.isArray(component.children)) {
                        // 递归展平容器的子组件
                        console.log(`[文件上传] 展平 ${component.componentName}, 子组件数: ${component.children.length}`);
                        result.push(...flattenComponents(component.children));
                      } else {
                        // 保留非容器组件
                        result.push(component);
                      }
                    }
                    
                    return result;
                  };
                  
                  // 使用递归展平后的内容
                  pageContent = flattenComponents(pageContent);
                  
                  console.log(`[文件上传] 页面 ${i + 1} 展平后有 ${pageContent.length} 个组件`);
                  
                  // 使用 editorStore 的 addPage 方法创建新页面
                  const newPageId = useEditorStore.getState().addPage({
                    name: pageName,
                  });
                  
                  console.log(`[文件上传] ✓ 页面创建成功,ID: ${newPageId}`);
                  
                  // 先缓存页面信息,不立即更新store
                  createdPages.push({
                    id: newPageId,
                    name: pageName,
                    content: pageContent, // 已经是深拷贝的独立数组
                  });
                  
                  // 添加验证日志 - 打印前3个组件的标题来验证内容
                  const firstThreeTitles = pageContent.slice(0, 3).map((c: any) => 
                    c.title || c.componentName || 'Unknown'
                  ).join(', ');
                  console.log(`[文件上传] 页面 ${i + 1} 前3个组件:`, firstThreeTitles);
                  
                  successCount++;
                  
                  console.log(`[文件上传] ✓ 页面 ${i + 1} 完成`);
                } catch (err) {
                  console.error(`[文件上传] ✗ 页面 ${i + 1} 创建失败:`, err);
                }
              }
              
              // 一次性批量更新所有页面的内容到store
              if (createdPages.length > 0) {
                console.log(`[文件上传] 开始批量更新 ${createdPages.length} 个页面的内容到store`);
                
                const currentDocument = useEditorStore.getState().document;
                const updatedPages = [...currentDocument.pages];
                
                // 为每个创建的页面更新内容
                for (const createdPage of createdPages) {
                  const pageIndex = updatedPages.findIndex(p => p.settings.id === createdPage.id);
                  if (pageIndex >= 0) {
                    updatedPages[pageIndex] = {
                      ...updatedPages[pageIndex],
                      components: createdPage.content,
                      settings: {
                        ...updatedPages[pageIndex].settings,
                        // 为Word导入的页面添加默认边距样式标记
                        pageStyle: {
                          height: '100%',
                          paddingLeft: '83px',
                          paddingRight: '83px',
                          paddingTop: '10px',
                          paddingBottom: '22px'
                        }
                      }
                    };
                    console.log(`[文件上传] 已更新页面 ${createdPage.name} 的内容,组件数: ${createdPage.content.length}`);
                  }
                }
                
                // 一次性更新整个document
                useEditorStore.setState({
                  document: {
                    ...currentDocument,
                    pages: updatedPages,
                    updatedAt: new Date(),
                  },
                });
                
                console.log(`[文件上传] ✓ 批量更新完成,共 ${createdPages.length} 个页面`);
                
                // 切换到第一个新创建的页面（直接更新store，不触发handleTabChange）
                const firstPage = createdPages[0];
                
                // 直接更新currentPageId，不通过setCurrentPage（避免触发页面切换保存逻辑）
                useEditorStore.setState({
                  currentPageId: firstPage.id,
                });
                
                console.log(`[文件上传] 已设置当前页面为: ${firstPage.name}`);
                
                // 延迟导入schema,确保状态已更新
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // 导入到画布显示第一页
                try {
                  const displaySchema = {
                    version: '1.0.0',
                    componentsTree: [{
                      componentName: 'Page',
                      fileName: firstPage.name,
                      id: firstPage.id,
                      props: {
                        ref: `page_${firstPage.id}`,
                        style: {
                          height: '100%',
                          paddingLeft: '83px',
                          paddingRight: '83px',
                          paddingTop: '10px',
                          paddingBottom: '22px'
                        }
                      },
                      children: firstPage.content,
                    }],
                  };
                  
                  try {
                    project.importSchema(displaySchema as any);
                    console.log(`[文件上传] ✓ 第一页已显示到画布`);
                  } catch (schemaError) {
                    console.error(`[文件上传] Schema导入失败，尝试加载空页面:`, schemaError);
                    // 如果导入失败，尝试导入空页面
                    const emptyDisplaySchema = {
                      version: '1.0.0',
                      componentsTree: [{
                        componentName: 'Page',
                        fileName: firstPage.name,
                        id: firstPage.id,
                        props: {
                          ref: `page_${firstPage.id}`,
                          style: {
                            height: '100%',
                            paddingLeft: '83px',
                            paddingRight: '83px',
                            paddingTop: '10px',
                            paddingBottom: '22px'
                          }
                        },
                        children: [],
                      }],
                    };
                    project.importSchema(emptyDisplaySchema as any);
                    console.warn(`[文件上传] 已加载空页面作为降级方案`);
                  }
                } catch (err) {
                  console.error(`[文件上传] 第一页 Schema导入画布失败:`, err);
                }
              }
              
              if (successCount > 0) {
                Message.success(
                  `文档 "${schema.fileName}" 已成功导入 ${successCount}/${schema.pageCount} 个页面`
                );
                // 关闭上传弹出框
                if (onComplete) {
                  onComplete();
                }
              } else {
                Message.error(`文档导入失败,未能创建任何页面`);
                // 即使失败也关闭弹出框
                if (onComplete) {
                  onComplete();
                }
              }
              
              return;
            }
            
            // 单页面模式 - 显示预览对话框
            showPreviewDialog(
              schema,
              file.name,
              (editedContent, dialogInstance) => {
                // 用户点击"应用"按钮后的回调
                
                try {
                  // 如果是覆盖模式，先清空画布
                  if (shouldOverwrite) {
                    try {
                      if (project.currentDocument && typeof project.currentDocument.getRoot === 'function') {
                        const rootNode = project.currentDocument.getRoot();
                        if (rootNode) {
                          const children = rootNode.children?.toArray() || [];
                          children.forEach((child: any) => {
                            try {
                              child.remove();
                            } catch (e) {
                              console.warn('[单页面导入] 删除子节点失败:', e);
                            }
                          });
                          console.log('[单页面导入] 已清空画布（覆盖模式）');
                        }
                      }
                    } catch (clearError) {
                      console.warn('[单页面导入] 清空画布时出错:', clearError);
                    }
                  }
                  
                  // 检查是否是完整的 Lowcode Schema 格式（包含 version, componentsMap, componentsTree）
                  if (editedContent?.version && editedContent?.componentsMap && editedContent?.componentsTree) {
                    console.log('[导入Schema] 检测到完整的 Lowcode Schema 格式');
                    
                    // 直接使用 project.importSchema 导入整个 schema
                    try {
                      project.importSchema(editedContent);
                      Message.success(`文件 "${file.name}" 已成功导入为完整页面`);
                      dialogInstance?.hide();
                      // 关闭上传弹出框
                      if (onComplete) {
                        onComplete();
                      }
                      return;
                    } catch (err) {
                      console.error('导入完整 Schema 失败:', err);
                      Message.error(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
                      dialogInstance?.hide();
                      // 关闭上传弹出框
                      if (onComplete) {
                        onComplete();
                      }
                      return;
                    }
                  }
                  
                  // 否则按照原有逻辑处理（兼容旧格式）
                  const rootNode = project.currentDocument?.root;
                  if (!rootNode) {
                    Message.error('无法获取根节点');
                    dialogInstance?.hide();
                    return;
                  }
                  
                  let addedCount = 0;
                  
                  // 统一处理：数组或单个组件都展平后导入
                  const contentToImport = Array.isArray(editedContent) ? editedContent : [editedContent];
                  console.log('[导入Schema] 准备导入内容，数量:', contentToImport.length);
                  
                  const flatItems = flattenSchema(contentToImport);
                  console.log('[导入Schema] 展平后元素数量:', flatItems.length);
                  
                  flatItems.forEach((item: any, idx: number) => {
                    if (item && item.componentName) {
                      try {
                        console.log(`[导入Schema] 导入第 ${idx + 1}/${flatItems.length} 个元素:`, {
                          componentName: item.componentName,
                          title: item.title,
                        });
                        rootNode.children?.importSchema(item);
                        addedCount++;
                      } catch (err) {
                        console.error('导入Schema失败:', item, err);
                      }
                    }
                  });
                  
                  if (addedCount > 0) {
                    Message.success(`文件 "${file.name}" 已添加到画布（共 ${addedCount} 个元素）`);
                    dialogInstance?.hide();
                    // 关闭上传弹出框
                    if (onComplete) {
                      onComplete();
                    }
                  } else {
                    Message.error('文件解析成功但未能添加任何元素');
                    dialogInstance?.hide();
                    // 关闭上传弹出框
                    if (onComplete) {
                      onComplete();
                    }
                  }
                } catch (error) {
                  console.error('处理内容时出错:', error);
                  Message.error(`处理内容失败: ${error instanceof Error ? error.message : '未知错误'}`);
                  dialogInstance?.hide();
                  // 关闭上传弹出框
                  if (onComplete) {
                    onComplete();
                  }
                }
              },
              () => {
                // 用户点击"取消"按钮的回调
                Message.notice('已取消添加文件');
                // 关闭上传弹出框
                if (onComplete) {
                  onComplete();
                }
              }
            );
          }
          
          return true;
        } catch (error) {
          console.error('文件解析失败:', error);
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          Message.error(`文件解析失败: ${errorMsg}`);
          // 解析失败也关闭上传弹出框
          if (onComplete) {
            onComplete();
          }
          return false;
        }
      };
      
      // 显示上传对话框
      const showUploadDialog = () => {
        // 状态管理：是否覆盖当前内容
        let shouldOverwrite = false;
        
        const dialogInstance = Dialog.show({
          title: '上传文档/图片',
          style: { width: '500px' },
          content: (
            <div>
              <Upload.Dragger
                accept=".html,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx"
                beforeUpload={(file) => {
                  handleFileUpload(file as File, shouldOverwrite, () => {
                    // 解析完成后关闭弹出框
                    dialogInstance.hide();
                  });
                  return false; // 阻止自动上传
                }}
                style={{ padding: '40px' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '48px', marginBottom: '16px' }}>📄</p>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                    点击或拖拽文件到此区域上传
                  </p>
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    支持: HTML网页、图片(JPG/PNG/GIF/SVG)、PDF文档、Word文档
                  </p>
                  <p style={{ fontSize: '12px', color: '#52c41a', marginTop: '8px' }}>
                    ✨ 智能解析文档内容和样式
                  </p>
                  <p style={{ fontSize: '11px', color: '#1890ff', marginTop: '4px' }}>
                    📄 PDF: 提取文本内容 | 📝 Word: 提取段落和样式 | 🖼️ 图片: 自动适配尺寸
                  </p>
                </div>
              </Upload.Dragger>
              
              {/* 添加覆盖/追加选项 */}
              <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ marginBottom: '8px', fontWeight: 500, color: '#333' }}>导入模式：</div>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    defaultChecked
                    onChange={() => { shouldOverwrite = false; }}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ color: '#52c41a' }}>📎 在后面追加内容</span>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>(默认)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    onChange={() => { shouldOverwrite = true; }}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ color: '#ff4d4f' }}>🔄 覆盖当前内容</span>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>(清空画布后导入)</span>
                </label>
              </div>
            </div>
          ),
          footer: false,
        });
      };

      // 将上传文档功能暴露到 config 中供统一操作插件使用
      config.set('uploadDocumentAction', showUploadDialog);
    },
  };
};

DocumentParserPlugin.pluginName = 'DocumentParserPlugin';
DocumentParserPlugin.meta = {
  preferenceDeclaration: {
    title: '文档解析插件配置',
    properties: [],
  },
};

export default DocumentParserPlugin;

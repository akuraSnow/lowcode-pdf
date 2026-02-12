/**
 * 文档解析插件 - 上传文档/图片并智能解析为低代码Schema
 * 支持: HTML、图片、PDF、Word等格式，提取样式并转换为可用的组件
 */

import React from 'react';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';
import { Button, Dialog, Upload, Message, Loading } from '@alifd/next';

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
              height: '100%'
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
  elementToSchema(element: HTMLElement, parentTag?: string): any {
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
        const childSchema = this.elementToSchema(child, tag);
        if (childSchema) {
          childrenSchemas.push(childSchema);
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
        
        children = [{
          componentName: 'NextText',
          id: this.generateId(),
          docId,
          props: {
            type: tag as any,
            children: text || '',
            mark: false,
            code: false,
            delete: false,
            underline: false,
            strong: false,
            prefix: '',
            classname: '',
            style: {
              fontSize,
              ...styles,
            }
          },
          hidden: false,
          title: '',
          isLocked: false,
          condition: true,
          conditionGroup: ''
        }];
        
        return {
          componentName: 'FDP',
          id: this.generateId(),
          docId,
          props: {
            children
          },
          title: `标题 H${headingLevel}`,
          hidden: false,
          isLocked: false,
          condition: true,
          conditionGroup: ''
        };
      }
      
      case 'p': {
        // 段落使用 FDP 组件
        if (childrenSchemas.length > 0) {
          // 有子元素（如嵌套的 span, strong 等）
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
              style: styles
            },
            hidden: false,
            title: '',
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
            children,
            style: {
              marginBottom: '12px',
              ...styles
            }
          },
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
        // 列表项使用 FDCell
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
          // 列表项文本包装在 FDP + NextText 中（可编辑）
          children = [{
            componentName: 'FDP',
            id: this.generateId(),
            docId,
            props: {
              children: [{
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
                title: '',
                isLocked: false,
                condition: true,
                conditionGroup: ''
              }]
            },
            title: '段落',
            hidden: false,
            isLocked: false,
            condition: true,
            conditionGroup: ''
          }];
        }
        title = '列表项';
        break;
      }
      
      case 'table': {
        // 表格使用 FDCell 作为容器
        componentName = 'FDCell';
        props = {
          align: 'left',
          verAlign: 'top',
          className: 'parsed-table',
          style: {
            borderCollapse: 'collapse',
            border: '1px solid #d9d9d9',
            marginBottom: '12px',
            width: '100%',
            display: 'table',
            tableLayout: 'fixed',
            borderSpacing: '0',
            backgroundColor: '#fff',
            ...styles
          }
        };
        children = childrenSchemas;
        title = '表格';
        break;
      }
      
      case 'tbody':
      case 'thead':
      case 'tfoot': {
        componentName = 'FDCell';
        props = {
          align: 'left',
          verAlign: 'top',
          className: `parsed-table-${tag}`,
          style: {
            display: 'table-row-group',
            ...styles
          }
        };
        children = childrenSchemas;
        title = tag.toUpperCase();
        break;
      }
      
      case 'tr': {
        // 表格行使用 FDRow
        componentName = 'FDRow';
        props = {
          className: 'parsed-table-row',
          style: {
            display: 'table-row',
            width: '100%',
            borderBottom: '1px solid #d9d9d9',
            margin: '0',
            padding: '0',
            backgroundColor: 'rgba(255,255,255,1)',
            ...styles
          }
        };
        children = childrenSchemas;
        title = '表行';
        break;
      }
      
      case 'td':
      case 'th': {
        // 表格单元格使用 FDCell
        componentName = 'FDCell';
        const isTh = tag === 'th';
        props = {
          align: 'left',
          verAlign: 'top',
          className: isTh ? 'parsed-table-th' : 'parsed-table-td',
          style: {
            display: 'table-cell',
            padding: '12px',
            borderRight: '1px solid #d9d9d9',
            fontSize: '14px',
            verticalAlign: 'top',
            wordWrap: 'break-word',
            minWidth: '50px',
            margin: '0',
            ...(isTh ? { 
              fontWeight: 'bold', 
              backgroundColor: '#fafafa',
              textAlign: 'left',
            } : { 
              backgroundColor: '#fff',
            }),
            ...styles
          }
        };
        
        if (childrenSchemas.length > 0) {
          children = childrenSchemas;
        } else if (text) {
          // 单元格文本包装在 FDP + NextText 中（可编辑）
          children = [{
            componentName: 'FDP',
            id: this.generateId(),
            docId,
            props: {
              children: [{
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
                  style: {}
                },
                hidden: false,
                title: '',
                isLocked: false,
                condition: true,
                conditionGroup: ''
              }]
            },
            title: '段落',
            hidden: false,
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
        // 引用块使用 FDCell
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
          componentName: 'FDP',
          id: this.generateId(),
          docId,
          props: { 
            children: [{
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
                style: { fontStyle: 'italic', color: '#666' }
              },
              hidden: false,
              title: '',
              isLocked: false,
              condition: true,
              conditionGroup: ''
            }]
          },
          title: '段落',
          hidden: false,
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
        // 代码块使用 FDCell
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
          componentName: 'FDP',
          id: this.generateId(),
          docId,
          props: { 
            children: [{
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
                  whiteSpace: 'pre-wrap',
                  fontSize: '12px'
                }
              },
              hidden: false,
              title: '',
              isLocked: false,
              condition: true,
              conditionGroup: ''
            }]
          },
          title: '段落',
          hidden: false,
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
        // 通用容器使用 FDCell
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
          // 纯文本包装在 FDP + NextText 中（可编辑）
          children = [{
            componentName: 'FDP',
            id: this.generateId(),
            docId,
            props: { 
              children: [{
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
                title: '',
                isLocked: false,
                condition: true,
                conditionGroup: ''
              }]
            },
            title: '段落',
            hidden: false,
            isLocked: false,
            condition: true,
            conditionGroup: ''
          }];
        }
        title = tag.charAt(0).toUpperCase() + tag.slice(1);
        break;
      }
    }
    
    // 如果有 children，添加到 props
    if (children.length > 0) {
      props.children = children;
    } else if (!props.children && text && componentName === 'FDCell') {
      // 没有children但有文本，且是FDCell，添加文本子节点
      props.children = [{
        componentName: 'FDP',
        id: this.generateId(),
        docId,
        props: { children: text },
        title: '段落',
        hidden: false,
        isLocked: false,
        condition: true,
        conditionGroup: ''
      }];
    }
    
    // 如果既没有 children 也没有文本内容，返回 null
    if (!props.children && !text && children.length === 0) {
      return null;
    }
    
    // 返回完整的 Schema 对象（符合 Lowcode Engine 标准格式）
    return {
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
               flattened.length > 1 ? {
                 componentName: '__MultipleContent__',
                 props: { children: flattened }
               } : null;
      }
      
      // 如果有多个子元素，转换所有元素
      const allChildren = Array.from(doc.body.children)
        .map(child => this.elementToSchema(child as HTMLElement))
        .map(result => flattenSchema(result))  // 展平每个结果
        .flat()  // 再次展平
        .filter(Boolean);
      
      // 如果转换后只有一个有效元素，直接返回
      if (allChildren.length === 1) {
        return allChildren[0];
      }
      
      // 多个元素用虚拟容器包装
      if (allChildren.length > 1) {
        return {
          componentName: '__MultipleContent__',
          props: {
            children: allChildren,
          },
        };
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
      const { skeleton, project } = ctx;
      
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
                .parsed-table {
                  display: table !important;
                  border-collapse: collapse;
                  width: 100%;
                }
                .parsed-table-thead, .parsed-table-tbody, .parsed-table-tfoot {
                  display: table-row-group !important;
                }
                .parsed-table-row {
                  display: table-row !important;
                }
                .parsed-table-th, .parsed-table-td {
                  display: table-cell !important;
                  vertical-align: middle;
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
      
      // 解析PDF - 提取文本内容
      const parsePDF = async (file: File): Promise<any> => {
        try {
          // 动态加载 PDF.js
          const pdfLib = await loadPDFJS();
          
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          const children: any[] = [
            {
              componentName: 'Paragraph',
              props: {
                children: `📄 ${file.name} (共 ${pdf.numPages} 页)`,
                style: {
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: '#1890ff',
                },
              },
            },
          ];
          
          // 遍历所有页面
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // 提取文本并按行分组
            const textItems = textContent.items.map((item: any) => item.str).filter(Boolean);
            
            if (textItems.length > 0) {
              // 添加页码标题（不用 Div 容器）
              children.push({
                componentName: 'Paragraph',
                props: {
                  children: `第 ${pageNum} 页`,
                  style: {
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1890ff',
                    padding: '10px 0',
                    borderBottom: '1px solid #e0e0e0',
                    marginBottom: '10px',
                  },
                },
              });
              
              // 添加文本内容（每行作为一个段落）
              textItems.forEach((text: string) => {
                if (text.trim()) {
                  children.push({
                    componentName: 'Paragraph',
                    props: {
                      children: text,
                      style: {
                        marginBottom: '8px',
                        lineHeight: '1.6',
                      },
                    },
                  });
                }
              });
            }
          }
          
          Message.success(`PDF已解析，共 ${pdf.numPages} 页`);
          
          // 返回包含所有页面的数组 schema
          // 由于平台可能不支持数组，改为返回单个根组件
          // 用第一个 Paragraph 作为容器，其他内容作为附加属性
          if (children.length > 0) {
            // 对于多个组件，创建一个虚拟根组件，返回一个带有多个子元素的结构
            return {
              componentName: '__DocumentContent__',
              props: {
                children: children,
              },
            };
          } else {
            throw new Error('PDF 中未找到可提取的文本');
          }
        } catch (error) {
          console.error('PDF解析失败:', error);
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          Message.error(`PDF解析失败: ${errorMsg}`);
          
          // 返回错误提示组件
          return {
            componentName: 'Paragraph',
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
      
      // 解析Word文档 - 提取段落和样式，返回完整的 Lowcode Schema
      const parseWord = async (file: File): Promise<any> => {
        try {
          // 动态加载 Mammoth
          const mammothLib = await loadMammoth();
          
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammothLib.default.convertToHtml({ arrayBuffer });
          
          if (result.messages.length > 0) {
            console.warn('Word解析警告:', result.messages);
          }
          
          // 使用 HtmlToSchemaConverter 转换提取的HTML
          console.log('[parseWord] Mammoth 转换结果 HTML 长度:', result.value?.length);
          console.log('[parseWord] HTML 内容预览:', result.value?.substring(0, 200));
          
          const schema = HtmlToSchemaConverter.parse(result.value);
          
          console.log('[parseWord] Schema 转换结果:', schema);
          
          if (schema) {
            Message.success(`Word文档已解析: ${file.name}`);
            
            // 创建文件名标题
            const titleComponent = {
              componentName: 'FDP',
              id: HtmlToSchemaConverter.generateId(),
              docId: HtmlToSchemaConverter.getDocId(),
              props: {
                children: [{
                  componentName: 'NextText',
                  id: HtmlToSchemaConverter.generateId(),
                  docId: HtmlToSchemaConverter.getDocId(),
                  props: {
                    type: 'h3',
                    children: `📝 ${file.name}`,
                    mark: false,
                    code: false,
                    delete: false,
                    underline: false,
                    strong: true,
                    prefix: '',
                    classname: '',
                    style: {
                      fontSize: '20px',
                      color: '#1890ff',
                      marginBottom: '16px'
                    }
                  },
                  hidden: false,
                  title: '',
                  isLocked: false,
                  condition: true,
                  conditionGroup: ''
                }]
              },
              title: '标题',
              hidden: false,
              isLocked: false,
              condition: true,
              conditionGroup: ''
            };
            
            // 规范化schema为数组形式
            let contentComponents: any[] = [];
            
            if (Array.isArray(schema)) {
              // 直接是数组
              contentComponents = schema;
            } else if (schema.componentName === '__MultipleContent__' && schema.props?.children) {
              // 虚拟容器，展开其子元素
              const children = Array.isArray(schema.props.children) 
                ? schema.props.children 
                : [schema.props.children];
              contentComponents = children.filter(Boolean);
            } else {
              // 单个组件
              contentComponents = [schema];
            }
            
            // 合并标题和内容
            const childrenArray = [titleComponent, ...contentComponents];
            
            // 生成完整的 Lowcode Schema
            return HtmlToSchemaConverter.generateLowcodeSchema(childrenArray, file.name);
          } else {
            // Schema 为空，可能是文档内容为空或无法识别
            console.warn('[parseWord] Schema 转换结果为空，返回空内容提示');
            Message.warning(`文档 "${file.name}" 可能为空或内容无法识别`);
            
            // 创建空内容提示组件
            const emptyWarning = {
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
                    children: `⚠️ ${file.name}（文档内容为空或无法识别）`,
                    mark: false,
                    code: false,
                    delete: false,
                    underline: false,
                    strong: false,
                    prefix: '',
                    classname: '',
                    style: {
                      fontSize: '14px',
                      color: '#faad14',
                      padding: '16px',
                      backgroundColor: '#fffbe6',
                      border: '1px solid #ffe58f',
                      borderRadius: '4px'
                    }
                  },
                  hidden: false,
                  title: '',
                  isLocked: false,
                  condition: true,
                  conditionGroup: ''
                }]
              },
              title: '警告',
              hidden: false,
              isLocked: false,
              condition: true,
              conditionGroup: ''
            };
            
            // 返回完整的 Lowcode Schema
            return HtmlToSchemaConverter.generateLowcodeSchema([emptyWarning], file.name);
          }
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
      const handleFileUpload = async (file: File) => {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        
        try {
          let schema: any = null;
          
          // 根据文件类型选择解析方式
          if (fileName.endsWith('.html') || fileType === 'text/html') {
            schema = await parseHTML(file);
          } else if (fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) {
            schema = await parseImage(file);
          } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            schema = await parsePDF(file);
          } else if (
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileType === 'application/msword' ||
            /\.(docx|doc)$/i.test(fileName)
          ) {
            schema = await parseWord(file);
          } else {
            Message.error(`不支持的文件类型: ${fileType || fileName}`);
            return false;
          }
          
          // 解析成功后显示预览对话框
          if (schema) {
            showPreviewDialog(
              schema,
              file.name,
              (editedContent, dialogInstance) => {
                // 用户点击"应用"按钮后的回调
                
                try {
                  // 检查是否是完整的 Lowcode Schema 格式（包含 version, componentsMap, componentsTree）
                  if (editedContent?.version && editedContent?.componentsMap && editedContent?.componentsTree) {
                    console.log('[导入Schema] 检测到完整的 Lowcode Schema 格式');
                    
                    // 直接使用 project.importSchema 导入整个 schema
                    try {
                      project.importSchema(editedContent);
                      Message.success(`文件 "${file.name}" 已成功导入为完整页面`);
                      dialogInstance?.hide();
                      return;
                    } catch (err) {
                      console.error('导入完整 Schema 失败:', err);
                      Message.error(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
                      dialogInstance?.hide();
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
                  
                  // 处理__DocumentContent__容器（Word文档旧格式）
                  if (editedContent?.componentName === '__DocumentContent__' && editedContent.props?.children) {
                    const children = Array.isArray(editedContent.props.children) 
                      ? editedContent.props.children 
                      : [editedContent.props.children];
                    
                    children.forEach((child: any) => {
                      if (child) {
                        // 递归展平所有嵌套的数组
                        const flatItems = flattenSchema(child);
                        console.log('[导入Schema] flatItems 长度:', flatItems.length);
                        flatItems.forEach((item: any, idx: number) => {
                          if (item && item.componentName) {
                            try {
                              console.log(`[导入Schema] 导入第 ${idx + 1} 个元素:`, {
                                componentName: item.componentName,
                                title: item.title,
                                hasChildren: !!item.props?.children,
                                childrenCount: Array.isArray(item.props?.children) ? item.props.children.length : 0,
                              });
                              rootNode.children?.importSchema(item);
                              addedCount++;
                            } catch (err) {
                              console.error('导入Schema失败:', item, err);
                            }
                          }
                        });
                      }
                    });
                    
                    if (addedCount > 0) {
                      Message.success(`文件 "${file.name}" 已添加到画布（共 ${addedCount} 个元素）`);
                      dialogInstance?.hide();
                    } else {
                      Message.error('文件解析成功但未能添加任何元素');
                      dialogInstance?.hide();
                    }
                  } 
                  // 处理__MultipleContent__容器
                  else if (editedContent?.componentName === '__MultipleContent__' && editedContent.props?.children) {
                    const children = Array.isArray(editedContent.props.children) 
                      ? editedContent.props.children 
                      : [editedContent.props.children];
                    
                    console.log('[导入Schema] __MultipleContent__ 包含子元素数量:', children.length);
                    
                    children.forEach((child: any, childIdx: number) => {
                      if (child) {
                        // 如果child本身就是有效的Schema对象（不是数组），直接导入
                        if (child.componentName && !Array.isArray(child)) {
                          try {
                            console.log(`[导入Schema] 直接导入元素 ${childIdx + 1}:`, {
                              componentName: child.componentName,
                              hasChildren: !!child.props?.children,
                              childrenType: Array.isArray(child.props?.children) ? 'array' : typeof child.props?.children,
                            });
                            rootNode.children?.importSchema(child);
                            addedCount++;
                          } catch (err) {
                            console.error('导入Schema失败:', child, err);
                          }
                        } else {
                          // 否则展平处理
                          const flatItems = flattenSchema(child);
                          console.log(`[导入Schema] 展平元素 ${childIdx + 1} 后得到:`, flatItems.length, '个子项');
                          flatItems.forEach((item: any, itemIdx: number) => {
                            if (item && item.componentName) {
                              try {
                                console.log(`[导入Schema]   子项 ${itemIdx + 1}:`, item.componentName);
                                rootNode.children?.importSchema(item);
                                addedCount++;
                              } catch (err) {
                                console.error('导入Schema失败:', item, err);
                              }
                            }
                          });
                        }
                      }
                    });
                    
                    if (addedCount > 0) {
                      Message.success(`文件 "${file.name}" 已添加到画布（共 ${addedCount} 个元素）`);
                      dialogInstance?.hide();
                    } else {
                      Message.error('文件解析成功但未能添加任何元素');
                      dialogInstance?.hide();
                    }
                  } 
                  // 处理直接数组
                  else if (Array.isArray(editedContent)) {
                    const flatItems = flattenSchema(editedContent);
                    flatItems.forEach((item: any) => {
                      if (item && item.componentName) {
                        try {
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
                    } else {
                      Message.error('文件解析成功但未能添加任何元素');
                      dialogInstance?.hide();
                    }
                  } 
                  // 处理单个组件
                  else if (editedContent?.componentName) {
                    try {
                      rootNode.children?.importSchema(editedContent);
                      Message.success(`文件 "${file.name}" 已添加到画布`);
                      dialogInstance?.hide();
                    } catch (err) {
                      console.error('导入Schema失败:', editedContent, err);
                      Message.error('添加到画布失败');
                      dialogInstance?.hide();
                    }
                  } 
                  else {
                    Message.error('内容格式无效，无法添加到画布');
                    dialogInstance?.hide();
                  }
                } catch (error) {
                  console.error('处理内容时出错:', error);
                  Message.error(`处理内容失败: ${error instanceof Error ? error.message : '未知错误'}`);
                  dialogInstance?.hide();
                }
              },
              () => {
                // 用户点击"取消"按钮的回调
                Message.notice('已取消添加文件');
              }
            );
          }
          
          return true;
        } catch (error) {
          console.error('文件解析失败:', error);
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          Message.error(`文件解析失败: ${errorMsg}`);
          return false;
        }
      };
      
      // 显示上传对话框
      const showUploadDialog = () => {
        Dialog.show({
          title: '上传文档/图片',
          style: { width: '500px' },
          content: (
            <div>
              <Upload.Dragger
                accept=".html,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx"
                beforeUpload={(file) => {
                  handleFileUpload(file as File);
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
                    ✨ 智能解析文档内容和样式，自动添加到画布末尾
                  </p>
                  <p style={{ fontSize: '11px', color: '#1890ff', marginTop: '4px' }}>
                    📄 PDF: 提取文本内容 | 📝 Word: 提取段落和样式 | 🖼️ 图片: 自动适配尺寸
                  </p>
                </div>
              </Upload.Dragger>
            </div>
          ),
          footer: false,
        });
      };
      
      // 添加上传文档按钮
      skeleton.add({
        area: 'topArea',
        type: 'Widget',
        name: 'uploadDocButton',
        content: Button,
        contentProps: {
          children: '📤 上传文档',
          onClick: showUploadDialog,
          style: {
            marginRight: '8px',
          },
        },
        props: {
          align: 'right',
          width: 100,
        },
      });
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

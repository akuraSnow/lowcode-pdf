/**
 * 文档解析插件 - 上传文档/图片并智能解析为低代码Schema
 * 支持: HTML、图片、PDF、Word等格式，提取样式并转换为可用的组件
 */

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
  
  // 处理字符串（纯文本）
  if (typeof content === 'string') {
    return [content];
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
   * 递归转换HTML元素为Schema
   */
  elementToSchema(element: HTMLElement): any {
    const tag = element.tagName.toLowerCase();
    const text = element.innerText?.trim();
    const styles = this.extractStyles(element);
    const docId = this.getDocId();
    
    // 确定组件类型 - 使用简化的纯文本节点
    let componentName = 'Slot';  // 默认使用 Slot 作为容器
    let props: Record<string, any> = {};
    let title = '';
    
    // 针对不同HTML标签的转换 - 全部转换为纯文本
    // 不依赖特定组件，直接返回文本字符串
    if (!text) {
      // 没有文本内容的元素，检查是否有子元素
      if (element.children.length > 0) {
        const convertedChildren = Array.from(element.children)
          .map(child => this.elementToSchema(child as HTMLElement))
          .filter(Boolean);
        
        // 返回子元素数组或单个元素
        if (convertedChildren.length === 1) {
          return convertedChildren[0];
        }
        if (convertedChildren.length > 1) {
          return convertedChildren;
        }
      }
      return null;
    }
    
    // 有文本内容，直接返回纯文本字符串
    // 画布会将纯字符串自动转换为文本节点
    return text;
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
        
        const dialogInstance = Dialog.show({
          title: `预览和编辑: ${fileName}`,
          style: { width: '700px', maxHeight: '80vh' },
          content: (
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                border: '1px solid #d9d9d9'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    📄 文件: {fileName}
                  </label>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>
                    预览解析结果。点击下方文本可编辑内容。确认无误后点击"应用"按钮。
                  </p>
                </div>
                
                {/* 预览内容 */}
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                  marginTop: '12px'
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
      const PreviewContent = ({ 
        content, 
        onContentChange 
      }: { 
        content: any; 
        onContentChange: (content: any) => void;
      }) => {
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
            <div style={{
              padding: '8px',
              marginBottom: '8px',
              backgroundColor: '#fafafa',
              borderLeft: '3px solid #1890ff',
              borderRadius: '2px'
            }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                {componentName}
              </div>
              {typeof children === 'string' ? (
                <textarea
                  value={children}
                  onChange={(e) => {
                    // 完整深拷贝，确保所有属性都被保留
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
                      // 完整深拷贝，确保所有属性都被保留
                      const newItem = JSON.parse(JSON.stringify(content));
                      newItem.props = { ...newItem.props, children: newContent };
                      onContentChange(newItem);
                    }}
                  />
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
      
      // 解析Word文档 - 提取段落和样式
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
              componentName: 'Paragraph',
              props: {
                children: `📝 ${file.name}`,
                style: {
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: '#1890ff',
                },
              },
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
            
            // 返回带有文件名标题的结构
            return {
              componentName: '__DocumentContent__',
              props: {
                children: childrenArray,
              },
            };
          } else {
            // Schema 为空，可能是文档内容为空或无法识别
            console.warn('[parseWord] Schema 转换结果为空，返回空内容提示');
            Message.warning(`文档 "${file.name}" 可能为空或内容无法识别`);
            
            // 返回一个提示组件
            return {
              componentName: '__DocumentContent__',
              props: {
                children: [{
                  componentName: 'Paragraph',
                  props: {
                    children: `⚠️ ${file.name}（文档内容为空或无法识别）`,
                    style: {
                      fontSize: '14px',
                      color: '#faad14',
                      padding: '16px',
                      backgroundColor: '#fffbe6',
                      border: '1px solid #ffe58f',
                      borderRadius: '4px',
                    },
                  },
                }],
              },
            };
          }
        } catch (error) {
          console.error('Word解析失败:', error);
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          Message.error(`Word解析失败: ${errorMsg}`);
          
          // 返回错误提示组件
          return {
            componentName: 'Paragraph',
            props: {
              children: `Word文档: ${file.name} (解析失败: ${errorMsg})`,
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
                const rootNode = project.currentDocument?.root;
                if (!rootNode) {
                  Message.error('无法获取根节点');
                  dialogInstance?.hide(); // 关闭对话框
                  return;
                }
                
                let addedCount = 0;
                
                try {
                  // 处理__DocumentContent__容器（Word文档）
                  if (editedContent?.componentName === '__DocumentContent__' && editedContent.props?.children) {
                    const children = Array.isArray(editedContent.props.children) 
                      ? editedContent.props.children 
                      : [editedContent.props.children];
                    
                    children.forEach((child: any) => {
                      if (child) {
                        // 递归展平所有嵌套的数组
                        const flatItems = flattenSchema(child);
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
                      }
                    });
                    
                    if (addedCount > 0) {
                      Message.success(`文件 "${file.name}" 已添加到画布（共 ${addedCount} 个元素）`);
                      dialogInstance?.hide(); // 成功后关闭对话框
                    } else {
                      Message.error('文件解析成功但未能添加任何元素');
                      dialogInstance?.hide(); // 失败也关闭对话框
                    }
                  } 
                  // 处理__MultipleContent__容器
                  else if (editedContent?.componentName === '__MultipleContent__' && editedContent.props?.children) {
                    const children = Array.isArray(editedContent.props.children) 
                      ? editedContent.props.children 
                      : [editedContent.props.children];
                    
                    children.forEach((child: any) => {
                      if (child) {
                        const flatItems = flattenSchema(child);
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

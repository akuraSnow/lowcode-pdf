/**
 * 工具函数集合
 */

import type {
  Component,
  AlignmentLine,
  PageBreak,
  TextComponent,
  TableComponent,
  FrameComponent,
} from '../types';

// ==================== 高度估算 ====================

/**
 * 估算组件高度
 */
export function estimateHeight(component: Component): number {
  switch (component.type) {
    case 'text':
      return estimateTextHeight(component as TextComponent);
    case 'table':
      return estimateTableHeight(component as TableComponent);
    case 'image':
      return (component.size?.height as number) || 100;
    case 'chart':
      return (component.size?.height as number) || 300;
    case 'barcode':
      return component.height || 50;
    case 'qrcode':
      return component.qrSize || 128;
    case 'frame':
      return estimateFrameHeight(component as FrameComponent);
    default:
      return 50;
  }
}

/**
 * 估算文本组件高度
 */
function estimateTextHeight(component: TextComponent): number {
  const fontSize = component.fontSize || 14;
  const lineHeight = component.lineHeight
    ? typeof component.lineHeight === 'number'
      ? component.lineHeight
      : parseFloat(component.lineHeight as string) * fontSize
    : fontSize * 1.5;

  const content = component.content || '';
  const lines = content.split('\n').length;

  const padding =
    (component.padding?.top || 0) + (component.padding?.bottom || 0);
  const margin = (component.margin?.top || 0) + (component.margin?.bottom || 0);

  return lines * lineHeight + padding + margin;
}

/**
 * 估算表格组件高度
 */
function estimateTableHeight(component: TableComponent): number {
  const headerHeight = 40; // 表头行高
  const rowHeight = component.tableSize === 'small' ? 32 : 48; // 数据行高

  const dataRowCount = component.dataSource?.length || 0;
  const totalHeight = headerHeight + dataRowCount * rowHeight;

  const padding =
    (component.padding?.top || 0) + (component.padding?.bottom || 0);
  const margin = (component.margin?.top || 0) + (component.margin?.bottom || 0);

  return totalHeight + padding + margin;
}

/**
 * 估算容器组件高度
 */
function estimateFrameHeight(component: FrameComponent): number {
  // 简化处理：返回固定高度或者计算子组件高度总和
  if (component.size?.height) {
    return component.size.height as number;
  }

  // 这里需要递归计算子组件高度，简化处理返回默认值
  return 200;
}

// ==================== 分页计算 ====================

/**
 * 计算分页断点
 */
export function calculatePageBreaks(
  components: Component[],
  pageHeight: number
): PageBreak[] {
  const pageBreaks: PageBreak[] = [];
  let currentPage: Component[] = [];
  let currentY = 0;
  let pageIndex = 0;

  for (const component of components) {
    const componentHeight = estimateHeight(component);

    // 如果当前组件放不下，需要分页
    if (currentY + componentHeight > pageHeight && currentPage.length > 0) {
      pageBreaks.push({
        pageIndex,
        components: currentPage,
        startY: 0,
        endY: currentY,
      });

      pageIndex++;
      currentPage = [];
      currentY = 0;
    }

    currentPage.push(component);
    currentY += componentHeight;
  }

  // 添加最后一页
  if (currentPage.length > 0) {
    pageBreaks.push({
      pageIndex,
      components: currentPage,
      startY: 0,
      endY: currentY,
    });
  }

  return pageBreaks;
}

/**
 * 智能分割组件（表格、文本等）
 */
export function smartSplit(
  component: Component,
  remainingHeight: number
): Component[] {
  if (component.type === 'table') {
    return splitTable(component as TableComponent, remainingHeight);
  } else if (component.type === 'text') {
    return splitText(component as TextComponent, remainingHeight);
  }

  return [component];
}

/**
 * 分割表格组件
 */
function splitTable(
  component: TableComponent,
  remainingHeight: number
): TableComponent[] {
  const headerHeight = 40;
  const rowHeight = component.tableSize === 'small' ? 32 : 48;

  const availableHeight = remainingHeight - headerHeight;
  const rowsPerPage = Math.floor(availableHeight / rowHeight);

  if (rowsPerPage <= 0 || !component.dataSource || component.dataSource.length <= rowsPerPage) {
    return [component];
  }

  const tables: TableComponent[] = [];
  const dataSource = component.dataSource;

  for (let i = 0; i < dataSource.length; i += rowsPerPage) {
    const pageData = dataSource.slice(i, i + rowsPerPage);
    tables.push({
      ...component,
      dataSource: pageData,
    });
  }

  return tables;
}

/**
 * 分割文本组件
 */
function splitText(
  component: TextComponent,
  remainingHeight: number
): TextComponent[] {
  const fontSize = component.fontSize || 14;
  const lineHeight = component.lineHeight
    ? typeof component.lineHeight === 'number'
      ? component.lineHeight
      : parseFloat(component.lineHeight as string) * fontSize
    : fontSize * 1.5;

  const availableLines = Math.floor(remainingHeight / lineHeight);
  const lines = (component.content || '').split('\n');

  if (lines.length <= availableLines) {
    return [component];
  }

  const texts: TextComponent[] = [];
  for (let i = 0; i < lines.length; i += availableLines) {
    const pageLines = lines.slice(i, i + availableLines);
    texts.push({
      ...component,
      content: pageLines.join('\n'),
    });
  }

  return texts;
}

// ==================== 对齐检测 ====================

/**
 * 检测对齐线
 */
export function detectAlignment(
  movingComponent: Component,
  allComponents: Component[],
  threshold: number = 5
): AlignmentLine[] {
  const alignmentLines: AlignmentLine[] = [];

  if (!movingComponent.position) {
    return alignmentLines;
  }

  const movingLeft = parseFloat(String(movingComponent.position.left || 0));
  const movingTop = parseFloat(String(movingComponent.position.top || 0));
  const movingWidth = parseFloat(String(movingComponent.size?.width || 0));
  const movingHeight = parseFloat(String(movingComponent.size?.height || 0));

  const movingRight = movingLeft + movingWidth;
  const movingBottom = movingTop + movingHeight;
  const movingCenterX = movingLeft + movingWidth / 2;
  const movingCenterY = movingTop + movingHeight / 2;

  for (const component of allComponents) {
    if (component.id === movingComponent.id || !component.position) {
      continue;
    }

    const left = parseFloat(String(component.position.left || 0));
    const top = parseFloat(String(component.position.top || 0));
    const width = parseFloat(String(component.size?.width || 0));
    const height = parseFloat(String(component.size?.height || 0));

    const right = left + width;
    const bottom = top + height;
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // 垂直对齐检测
    if (Math.abs(movingLeft - left) < threshold) {
      alignmentLines.push({
        type: 'vertical',
        position: left,
        componentId: component.id,
      });
    }
    if (Math.abs(movingRight - right) < threshold) {
      alignmentLines.push({
        type: 'vertical',
        position: right,
        componentId: component.id,
      });
    }
    if (Math.abs(movingCenterX - centerX) < threshold) {
      alignmentLines.push({
        type: 'vertical',
        position: centerX,
        componentId: component.id,
      });
    }

    // 水平对齐检测
    if (Math.abs(movingTop - top) < threshold) {
      alignmentLines.push({
        type: 'horizontal',
        position: top,
        componentId: component.id,
      });
    }
    if (Math.abs(movingBottom - bottom) < threshold) {
      alignmentLines.push({
        type: 'horizontal',
        position: bottom,
        componentId: component.id,
      });
    }
    if (Math.abs(movingCenterY - centerY) < threshold) {
      alignmentLines.push({
        type: 'horizontal',
        position: centerY,
        componentId: component.id,
      });
    }
  }

  return alignmentLines;
}

// ==================== 数据路径解析 ====================

/**
 * 从对象中根据路径获取值
 */
export function getValueByPath(obj: any, path: string): any {
  if (!path) return obj;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    // 处理数组索引 users[0]
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current?.[arrayName]?.[parseInt(index, 10)];
    } else {
      current = current?.[key];
    }

    if (current === undefined) {
      return undefined;
    }
  }

  return current;
}

/**
 * 设置对象中指定路径的值
 */
export function setValueByPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // 处理数组索引
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      if (!current[arrayName]) {
        current[arrayName] = [];
      }
      const idx = parseInt(index, 10);
      if (!current[arrayName][idx]) {
        current[arrayName][idx] = {};
      }
      current = current[arrayName][idx];
    } else {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

// ==================== JSON 解析 ====================

/**
 * 安全解析JSON
 */
export function parseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
}

/**
 * 格式化JSON字符串
 */
export function formatJSON(obj: any, spaces: number = 2): string {
  try {
    return JSON.stringify(obj, null, spaces);
  } catch (error) {
    console.error('JSON stringify error:', error);
    return '';
  }
}

/**
 * 验证JSON Schema
 */
export function validateSchema(schema: any): boolean {
  // 简化的Schema验证
  if (!schema || typeof schema !== 'object') {
    return false;
  }

  // 检查必要字段
  if (!schema.id || !schema.pages || !Array.isArray(schema.pages)) {
    return false;
  }

  return true;
}

// ==================== 颜色处理 ====================

/**
 * RGB转HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * HEX转RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// ==================== 文件处理 ====================

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 读取文件为文本
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * 读取图片文件
 */
export function readImageFile(file: File): Promise<{
  url: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          url: e.target?.result as string,
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== 尺寸转换 ====================

/**
 * mm转px (96 DPI)
 */
export function mmToPx(mm: number): number {
  return (mm * 96) / 25.4;
}

/**
 * px转mm (96 DPI)
 */
export function pxToMm(px: number): number {
  return (px * 25.4) / 96;
}

// ==================== 防抖和节流 ====================

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();

    if (!previous) previous = now;

    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
}

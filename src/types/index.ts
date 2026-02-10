/**
 * 低代码平台核心类型定义
 */

// ==================== 编辑器模式 ====================
export type EditorMode = 'EDIT' | 'PREVIEW' | 'PUBLISH';
export type LayoutMode = 'waterfall' | 'absolute';

// ==================== 页面相关 ====================
export type PageSize = 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageSettings {
  id: string;
  name: string;
  size: PageSize;
  customWidth?: number;
  customHeight?: number;
  orientation: PageOrientation;
  margin: PageMargin;
  backgroundColor: string;
  defaultFontSize: number;
  defaultFontColor: string;
  defaultFontFamily: string;
  componentGap: number;
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
}

export interface HeaderFooterConfig {
  enabled: boolean;
  height: number;
  content: string;
  backgroundColor: string;
  templateId?: string;
  components?: Component[];
}

// ==================== 组件相关 ====================
export type ComponentType = 'text' | 'table' | 'image' | 'chart' | 'barcode' | 'qrcode' | 'frame';

export interface Position {
  left?: number | string;
  right?: number | string;
  top?: number | string;
  bottom?: number | string;
}

export interface Size {
  width?: number | string;
  height?: number | string;
}

export interface BaseComponent {
  id: string;
  type: ComponentType;
  position?: Position;
  size?: Size;
  rotation?: number;
  scale?: number;
  zIndex?: number;
  order?: number;
  margin?: PageMargin;
  padding?: PageMargin;
  align?: 'left' | 'center' | 'right' | 'justify';
  display?: 'block' | 'inline-block' | 'inline' | 'none';
  style?: React.CSSProperties;
  rules?: LogicRule[];
  dataBinding?: DataBinding;
  dataBindings?: MultiDataBinding[];
}

// ==================== 文本组件 ====================
export interface TextComponent extends BaseComponent {
  type: 'text';
  content: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textIndent?: number | string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  whiteSpace?: 'normal' | 'pre' | 'nowrap' | 'pre-wrap';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderRadius?: number;
  textRanges?: TextRange[];
}

export interface TextRange {
  id: string;
  start: number;
  end: number;
  text: string;
  rules?: LogicRule[];
  dataBinding?: string;
  style?: React.CSSProperties;
}

// ==================== 表格组件 ====================
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  children?: TableColumn[];
  colSpan?: number;
  render?: string;
}

export interface CellConfig {
  id: string;
  row: number;
  col: number;
  content?: any;
  style?: React.CSSProperties;
  rules?: LogicRule[];
  dataBinding?: string;
  rowSpan?: number;
  colSpan?: number;
}

export interface TableComponent extends BaseComponent {
  type: 'table';
  columns: TableColumn[];
  dataSource: any[];
  bordered?: boolean;
  tableSize?: 'small' | 'middle' | 'large';
  headerStyle?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
  cells?: CellConfig[];
  pagination?: {
    pageSize: number;
    current: number;
    total: number;
  };
}

// ==================== 图片组件 ====================
export interface ImageComponent extends BaseComponent {
  type: 'image';
  src: string;
  alt?: string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

// ==================== 图表组件 ====================
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

export interface ChartComponent extends BaseComponent {
  type: 'chart';
  chartType: ChartType;
  data: any;
  option?: any;
}

// ==================== 条形码组件 ====================
export interface BarcodeComponent extends BaseComponent {
  type: 'barcode';
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC';
  lineWidth?: number;
  height?: number;
  displayValue?: boolean;
}

// ==================== 二维码组件 ====================
export interface QRCodeComponent extends BaseComponent {
  type: 'qrcode';
  value: string;
  qrSize?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
}

// ==================== 容器组件 ====================
export type ContainerLayout = 'horizontal' | 'vertical' | 'fix' | 'grid' | 'table';

export interface FrameComponent extends BaseComponent {
  type: 'frame';
  layout: ContainerLayout;
  children: string[];
  gap?: number;
  gridColumns?: number;
  gridRows?: number;
  tableColumns?: number;
  tableRows?: number;
  childrenConfig?: {
    [childId: string]: {
      widthType?: 'px' | 'flex';
      widthValue?: number;
      heightType?: 'px' | 'flex' | 'auto';
      heightValue?: number;
      position?: Position;
    };
  };
}

export type Component = 
  | TextComponent 
  | TableComponent 
  | ImageComponent 
  | ChartComponent 
  | BarcodeComponent 
  | QRCodeComponent 
  | FrameComponent;

// ==================== 数据绑定 ====================
export interface DataBinding {
  path: string;
  transform?: string;
}

export interface MultiDataBinding {
  id: string;
  path: string;
  order: number;
  processorFunction?: string;
}

// ==================== 逻辑规则 ====================
export type LogicType = 'code' | 'visual';

export interface LogicRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: LogicType;
  code?: string;
  conditions?: Condition[];
  conditionLogic?: 'AND' | 'OR';
  actions?: Action[];
}

export interface Condition {
  id: string;
  fieldType: 'component' | 'pageData' | 'expression';
  fieldPath: string;
  operator: ComparisonOperator;
  valueType: 'static' | 'dynamic' | 'pageData';
  value: any;
}

export type ComparisonOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'greaterThan' 
  | 'lessThan' 
  | 'greaterEqual' 
  | 'lessEqual'
  | 'contains'
  | 'notContains'
  | 'isEmpty'
  | 'isNotEmpty';

export interface Action {
  id: string;
  type: ActionType;
  target?: string;
  value?: any;
  valueType?: 'static' | 'dynamic' | 'pageData';
  params?: any;
}

export type ActionType = 
  | 'show' 
  | 'hide' 
  | 'enable' 
  | 'disable' 
  | 'setValue' 
  | 'setStyle' 
  | 'alert' 
  | 'navigate' 
  | 'apiCall';

// ==================== API配置 ====================
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface APIConfig {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  transform?: string;
  dataKey?: string;
}

// ==================== 生命周期 ====================
export type LifecycleType = 'onLoad' | 'onBeforeMount' | 'onMounted' | 'onBeforeUnmount' | 'onUnmounted';
export type LifecycleConfigType = 'code' | 'api';

export interface LifecycleConfig {
  type: LifecycleConfigType;
  code?: string;
  apiIds?: string[];
}

// ==================== 页面数据配置 ====================
export interface PageDataConfig {
  apis: APIConfig[];
  lifecycles: Record<LifecycleType, LifecycleConfig>;
  initialData: any;
}

// ==================== 资源管理 ====================
export interface ImageResource {
  id: string;
  name: string;
  url: string;
  size: number;
  width: number;
  height: number;
  uploadedAt: Date;
  usageCount: number;
}

export interface CSSResource {
  id: string;
  name: string;
  content: string;
  size: number;
  uploadedAt: Date;
  enabled: boolean;
}

export interface FunctionResource {
  id: string;
  name: string;
  code: string;
  description?: string;
  parameters?: string[];
  returnType?: string;
  usageCount: number;
}

// ==================== 模板 ====================
export type TemplateType = 'header' | 'footer' | 'component';

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  description?: string;
  height?: number;
  backgroundColor?: string;
  components?: Component[];
  thumbnail?: string;
  createdAt: Date;
}

// ==================== 文档配置 ====================
export interface DocumentConfig {
  id: string;
  title: string;
  description?: string;
  version: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  pages: PageConfig[];
  resources?: {
    images: ImageResource[];
    css: CSSResource[];
    functions: FunctionResource[];
  };
  templates?: Template[];
}

export interface PageConfig {
  settings: PageSettings;
  components: Component[];
  dataConfig?: PageDataConfig;
}

// ==================== 编辑器状态 ====================
export interface EditorState {
  document: DocumentConfig;
  currentPageId: string;
  selectedComponentId: string | null;
  mode: EditorMode;
  layoutMode: LayoutMode;
  clipboard: Component | null;
  history: DocumentConfig[];
  historyIndex: number;
}

// ==================== 工具函数返回类型 ====================
export interface AlignmentLine {
  type: 'vertical' | 'horizontal';
  position: number;
  componentId: string;
}

export interface PageBreak {
  pageIndex: number;
  components: Component[];
  startY: number;
  endY: number;
}

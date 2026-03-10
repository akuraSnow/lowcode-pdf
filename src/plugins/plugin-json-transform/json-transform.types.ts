export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export type TransformTemplateType =
  | 'pickPath'
  | 'omitPath'
  | 'setValue'
  | 'renameKey'
  | 'mergeObject'
  | 'filterArray'
  | 'mapArrayField';

export interface TransformStep {
  id: string;
  templateType: TransformTemplateType;
  configText: string;
  enabled: boolean;
}

export interface TransformNode {
  id: string;
  name: string;
  children: TransformNode[];
  /** @deprecated 旧版内置模板转换步骤，新版使用 mode 字段 */
  transformStep: TransformStep | null;
  /** 绑定模式：直接路径提取 或 调用自定义JS函数，默认 directPath */
  mode: NodeFunctionMode;
  /** directPath 模式：从 sourceJson 取值的路径，如 "data.list" */
  directPath?: string;
  /** customFunction 模式：所选的 JS 文件名 */
  jsFileName?: string;
  /** customFunction 模式：所选的函数名 */
  functionName?: string;
}

export interface JsonTransformError {
  nodeId: string;
  message: string;
}

/** 节点绑定模式：直接路径提取 或 调用自定义函数 */
export type NodeFunctionMode = 'directPath' | 'customFunction';

/** JS 方法文件描述 */
export interface JsMethodFile {
  filename: string;
  content?: string;
}

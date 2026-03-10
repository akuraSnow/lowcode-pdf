import {
  JsonValue,
  TransformNode,
  TransformTemplateType,
} from '../json-transform.types';

interface PickPathConfig {
  path: string;
}

interface OmitPathConfig {
  path: string;
}

interface SetValueConfig {
  path: string;
  value: JsonValue;
}

interface RenameKeyConfig {
  path: string;
  from: string;
  to: string;
}

interface MergeObjectConfig {
  path: string;
  value: Record<string, JsonValue>;
}

interface FilterArrayConfig {
  path: string;
  field: string;
  equals: JsonValue;
}

interface MapArrayFieldConfig {
  path: string;
  field: string;
  newField: string;
  defaultValue: JsonValue;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function parsePath(pathText: string): string[] {
  return pathText
    .split('.')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAtPath(data: JsonValue, pathText: string): JsonValue | undefined {
  const path = parsePath(pathText);
  let current: JsonValue | undefined = data;

  for (const key of path) {
    if (Array.isArray(current)) {
      const index = Number(key);
      if (Number.isNaN(index)) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (!current || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, JsonValue>)[key];
  }

  return current;
}

function setAtPath(data: JsonValue, pathText: string, value: JsonValue): JsonValue {
  const path = parsePath(pathText);
  if (path.length === 0) {
    return value;
  }

  const root = deepClone(data);
  let current: JsonValue = root;

  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];

    if (Array.isArray(current)) {
      const index = Number(key);
      if (Number.isNaN(index)) {
        throw new Error(`无效数组索引: ${key}`);
      }
      if (current[index] === undefined || current[index] === null) {
        current[index] = {};
      }
      current = current[index] as JsonValue;
      continue;
    }

    if (!current || typeof current !== 'object') {
      throw new Error(`无法写入路径: ${pathText}`);
    }

    const obj = current as Record<string, JsonValue>;
    if (obj[key] === undefined || obj[key] === null) {
      obj[key] = {};
    }
    current = obj[key];
  }

  const lastKey = path[path.length - 1];

  if (Array.isArray(current)) {
    const index = Number(lastKey);
    if (Number.isNaN(index)) {
      throw new Error(`无效数组索引: ${lastKey}`);
    }
    current[index] = value;
    return root;
  }

  if (!current || typeof current !== 'object') {
    throw new Error(`无法写入路径: ${pathText}`);
  }

  (current as Record<string, JsonValue>)[lastKey] = value;
  return root;
}

function deleteAtPath(data: JsonValue, pathText: string): JsonValue {
  const path = parsePath(pathText);
  if (path.length === 0) {
    return deepClone(data);
  }

  const root = deepClone(data);
  let current: JsonValue = root;

  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];

    if (Array.isArray(current)) {
      const index = Number(key);
      if (Number.isNaN(index)) {
        return root;
      }
      current = current[index] as JsonValue;
      continue;
    }

    if (!current || typeof current !== 'object') {
      return root;
    }

    current = (current as Record<string, JsonValue>)[key];
  }

  const lastKey = path[path.length - 1];

  if (Array.isArray(current)) {
    const index = Number(lastKey);
    if (Number.isNaN(index)) {
      return root;
    }
    current.splice(index, 1);
    return root;
  }

  if (!current || typeof current !== 'object') {
    return root;
  }

  delete (current as Record<string, JsonValue>)[lastKey];
  return root;
}

function parseConfig<T>(configText: string): T {
  return JSON.parse(configText) as T;
}

function applyTemplate(
  templateType: TransformTemplateType,
  sourceJson: JsonValue,
  workingJson: JsonValue,
  configText: string
): JsonValue {
  if (!configText.trim()) {
    throw new Error('请填写模板配置 JSON');
  }

  switch (templateType) {
    case 'pickPath': {
      const config = parseConfig<PickPathConfig>(configText);
      const picked = getAtPath(sourceJson, config.path);
      if (picked === undefined) {
        throw new Error(`pickPath 未找到路径: ${config.path}`);
      }
      return deepClone(picked);
    }
    case 'omitPath': {
      const config = parseConfig<OmitPathConfig>(configText);
      return deleteAtPath(workingJson, config.path);
    }
    case 'setValue': {
      const config = parseConfig<SetValueConfig>(configText);
      return setAtPath(workingJson, config.path, config.value);
    }
    case 'renameKey': {
      const config = parseConfig<RenameKeyConfig>(configText);
      const target = getAtPath(workingJson, config.path);
      if (!target || typeof target !== 'object' || Array.isArray(target)) {
        throw new Error(`renameKey 目标必须是对象: ${config.path}`);
      }
      const cloned = deepClone(workingJson);
      const nextTarget = getAtPath(cloned, config.path);
      if (!nextTarget || typeof nextTarget !== 'object' || Array.isArray(nextTarget)) {
        throw new Error(`renameKey 目标必须是对象: ${config.path}`);
      }
      const targetObject = nextTarget as Record<string, JsonValue>;
      if (!(config.from in targetObject)) {
        throw new Error(`renameKey 源字段不存在: ${config.from}`);
      }
      targetObject[config.to] = targetObject[config.from];
      delete targetObject[config.from];
      return cloned;
    }
    case 'mergeObject': {
      const config = parseConfig<MergeObjectConfig>(configText);
      const target = getAtPath(workingJson, config.path);
      if (!target || typeof target !== 'object' || Array.isArray(target)) {
        throw new Error(`mergeObject 目标必须是对象: ${config.path}`);
      }
      const merged = {
        ...(target as Record<string, JsonValue>),
        ...config.value,
      };
      return setAtPath(workingJson, config.path, merged);
    }
    case 'filterArray': {
      const config = parseConfig<FilterArrayConfig>(configText);
      const target = getAtPath(workingJson, config.path);
      if (!Array.isArray(target)) {
        throw new Error(`filterArray 目标必须是数组: ${config.path}`);
      }
      const filtered = target.filter((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return false;
        }
        return (item as Record<string, JsonValue>)[config.field] === config.equals;
      });
      return setAtPath(workingJson, config.path, filtered);
    }
    case 'mapArrayField': {
      const config = parseConfig<MapArrayFieldConfig>(configText);
      const target = getAtPath(workingJson, config.path);
      if (!Array.isArray(target)) {
        throw new Error(`mapArrayField 目标必须是数组: ${config.path}`);
      }
      const mapped = target.map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return item;
        }
        const record = item as Record<string, JsonValue>;
        return {
          ...record,
          [config.newField]:
            record[config.field] === undefined ? config.defaultValue : record[config.field],
        };
      });
      return setAtPath(workingJson, config.path, mapped);
    }
    default:
      return workingJson;
  }
}

/**
 * 计算单个节点的输出值：
 * - 有子节点：递归构建以子节点 name 为 key 的嵌套对象
 * - 无子节点：按节点模式从 sourceJson 提取/计算值
 */
function computeNodeValue(sourceJson: JsonValue, node: TransformNode): JsonValue {
  if (node.children.length > 0) {
    const obj: Record<string, JsonValue> = {};
    for (const child of node.children) {
      obj[child.name] = computeNodeValue(sourceJson, child);
    }
    return obj;
  }

  const mode = node.mode || 'directPath';

  if (mode === 'directPath') {
    if (!node.directPath) return null;
    const val = getAtPath(sourceJson, node.directPath);
    return val !== undefined ? deepClone(val) : null;
  }

  if (mode === 'customFunction') {
    if (!node.jsFileName || !node.functionName || !(node as any).__fnContent) return null;
    try {
      const fnBody = `
        ${(node as any).__fnContent}
        return typeof ${node.functionName} === 'function' ? ${node.functionName}(sourceJson, nodePath) : null;
      `;
      // eslint-disable-next-line no-new-func
      const executor = new Function('sourceJson', 'nodePath', fnBody);
      const result = executor(sourceJson, node.directPath || '');
      return result !== undefined ? result : null;
    } catch (err) {
      throw new Error(`函数执行失败 [${node.functionName}]: ${(err as Error).message}`);
    }
  }

  // 旧版 transformStep 模式
  if (!node.transformStep || !node.transformStep.enabled) return null;
  return applyTemplate(
    node.transformStep.templateType,
    sourceJson,
    deepClone(sourceJson),
    node.transformStep.configText
  );
}

/**
 * 将节点树映射为结构化输出 JSON：
 * 顶层节点以各自的 name 作为 key，子节点递归嵌套。
 * 输出结构与节点树完全一致。
 */
export function executeTransformTree(sourceJson: JsonValue, nodes: TransformNode[]): JsonValue {
  if (nodes.length === 0) return deepClone(sourceJson);

  const result: Record<string, JsonValue> = {};
  for (const node of nodes) {
    result[node.name] = computeNodeValue(sourceJson, node);
  }
  return result;
}

export const templateDefaults: Record<TransformTemplateType, string> = {
  pickPath: '{\n  "path": "data"\n}',
  omitPath: '{\n  "path": "data.temp"\n}',
  setValue: '{\n  "path": "meta.version",\n  "value": "1.0.0"\n}',
  renameKey: '{\n  "path": "data",\n  "from": "oldKey",\n  "to": "newKey"\n}',
  mergeObject: '{\n  "path": "meta",\n  "value": {\n    "updated": true\n  }\n}',
  filterArray: '{\n  "path": "list",\n  "field": "status",\n  "equals": "active"\n}',
  mapArrayField: '{\n  "path": "list",\n  "field": "name",\n  "newField": "displayName",\n  "defaultValue": ""\n}',
};

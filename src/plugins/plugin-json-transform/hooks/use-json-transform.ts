import { useCallback, useEffect, useMemo, useState } from 'react';
import { Message } from '@alifd/next';
import {
  JsonValue,
  JsMethodFile,
  NodeFunctionMode,
  TransformNode,
  TransformStep,
  TransformTemplateType,
} from '../json-transform.types';
import {
  addChildNode,
  addSiblingNode,
  createNode,
  deleteNode,
  getNodeById,
  updateNodeCustomFunction,
  updateNodeDirectPath,
  updateNodeMode,
  updateNodeName,
  updateNodeTransformStep,
  updateNodesCustomFunction,
} from '../utils/tree-operations';
import { executeTransformTree, templateDefaults } from '../utils/transform-templates';
import { extractImportableSchema } from '../utils/schema-adapter';
import { API_ENDPOINTS } from '../../../config/api';
import { useGlobalSettingsStore } from '../../../stores/globalSettingsStore';
import { useDataStore } from '../../../stores/dataStore';
import { useJsonTransformPersistStore } from '../store/json-transform-persist.store';

function createStep(templateType: TransformTemplateType): TransformStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    templateType,
    configText: templateDefaults[templateType],
    enabled: true,
  };
}

/**
 * 从 JS 文件内容中解析导出的函数名列表
 */
export function parseExportedFunctions(content: string): string[] {
  const names: string[] = [];
  // function xxx(
  const funcDecl = /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
  // const/let/var xxx = function|( => )
  const arrowOrExpr = /(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;

  let m: RegExpExecArray | null;
  while ((m = funcDecl.exec(content)) !== null) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  while ((m = arrowOrExpr.exec(content)) !== null) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

export function useJsonTransform(project: any) {
  const methodDir = useGlobalSettingsStore((s: any) => s.settings.paths.methodPath as string);
  const initialJsonPath = useGlobalSettingsStore((s: any) => s.settings.paths.initialJsonPath as string | undefined);
  const updatePageData = useDataStore((s: any) => s.updatePageData as (path: string, value: any) => void);

  // ── 持久化状态（关闭 Drawer 后保留，重新打开可恢复） ──
  const sourceJson = useJsonTransformPersistStore((s) => s.sourceJson);
  const setSourceJson = useJsonTransformPersistStore((s) => s.setSourceJson);
  const sourceJsonCollapsed = useJsonTransformPersistStore((s) => s.sourceJsonCollapsed);
  const setSourceJsonCollapsed = useJsonTransformPersistStore((s) => s.setSourceJsonCollapsed);
  const nodes = useJsonTransformPersistStore((s) => s.nodes);
  const setNodes = useJsonTransformPersistStore((s) => s.setNodes);
  const selectedNodeId = useJsonTransformPersistStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useJsonTransformPersistStore((s) => s.setSelectedNodeId);
  const checkedNodeIds = useJsonTransformPersistStore((s) => s.checkedNodeIds);
  const setCheckedNodeIds = useJsonTransformPersistStore((s) => s.setCheckedNodeIds);
  const methodContents = useJsonTransformPersistStore((s) => s.methodContents);
  const setMethodContents = useJsonTransformPersistStore((s) => s.setMethodContents);

  // ── 运行时状态（不需要持久化） ──
  const [previewJson, setPreviewJson] = useState<JsonValue | null>(null);
  const [errorText, setErrorText] = useState<string>('');
  const [methodFiles, setMethodFiles] = useState<JsMethodFile[]>([]);
  const [methodFilesLoading, setMethodFilesLoading] = useState(false);

  // 若 sourceJson 为空且配置了初始JSON路径，自动加载
  useEffect(() => {
    if (sourceJson !== null || !initialJsonPath?.trim()) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${API_ENDPOINTS.localJson}?path=${encodeURIComponent(initialJsonPath.trim())}&mode=wrapped`
        );
        const data = await res.json();
        if (data.success && data.data !== undefined) {
          setSourceJson(data.data as JsonValue);
          setSourceJsonCollapsed(false);
        }
      } catch {
        // 静默失败，不打扰用户
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialJsonPath]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return getNodeById(nodes, selectedNodeId);
  }, [nodes, selectedNodeId]);

  // 当 nodes 或 sourceJson 变更时重新计算预览
  useEffect(() => {
    if (!sourceJson) {
      setPreviewJson(null);
      setErrorText('');
      return;
    }
    try {
      // 将已加载的函数内容注入 node.__fnContent
      const injectContent = (nodeList: TransformNode[]): TransformNode[] =>
        nodeList.map((n) => ({
          ...n,
          __fnContent: n.jsFileName ? methodContents[n.jsFileName] || '' : '',
          children: injectContent(n.children),
        }));

      const enrichedNodes = injectContent(nodes);
      const next = executeTransformTree(sourceJson, enrichedNodes);
      setPreviewJson(next);
      setErrorText('');
    } catch (error) {
      setErrorText((error as Error).message);
    }
  }, [sourceJson, nodes, methodContents]);

  // ==================== 方法文件 API ====================

  const loadMethodFiles = useCallback(async () => {
    if (!methodDir) return;
    setMethodFilesLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.methods}?dir=${encodeURIComponent(methodDir)}`);
      const data = await res.json();
      if (data.success) {
        setMethodFiles(data.files as JsMethodFile[]);
      } else {
        Message.error(`获取方法文件列表失败: ${data.message}`);
      }
    } catch (err) {
      Message.error(`获取方法文件列表失败: ${(err as Error).message}`);
    } finally {
      setMethodFilesLoading(false);
    }
  }, [methodDir]);

  const loadMethodContent = useCallback(async (filename: string): Promise<string> => {
    if (methodContents[filename] !== undefined) return methodContents[filename];
    if (!methodDir) return '';
    try {
      const res = await fetch(
        `${API_ENDPOINTS.methodByName(filename)}?dir=${encodeURIComponent(methodDir)}`
      );
      const data = await res.json();
      if (data.success) {
        setMethodContents((prev) => ({ ...prev, [filename]: data.content }));
        return data.content as string;
      }
    } catch {
      // ignore
    }
    return '';
  }, [methodDir, methodContents]);

  const saveMethodFile = useCallback(async (filename: string, content: string): Promise<boolean> => {
    if (!methodDir) { Message.error('请先在全局设置中配置方法保存路径'); return false; }
    try {
      const res = await fetch(API_ENDPOINTS.methodByName(filename), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: methodDir, content }),
      });
      const data = await res.json();
      if (data.success) {
        setMethodContents((prev) => ({ ...prev, [filename]: content }));
        // 刷新文件列表
        await loadMethodFiles();
        Message.success('方法文件保存成功');
        return true;
      }
      Message.error(`保存失败: ${data.message}`);
      return false;
    } catch (err) {
      Message.error(`保存失败: ${(err as Error).message}`);
      return false;
    }
  }, [methodDir, loadMethodFiles]);

  const deleteMethodFile = useCallback(async (filename: string): Promise<boolean> => {
    if (!methodDir) return false;
    try {
      const res = await fetch(
        `${API_ENDPOINTS.methodByName(filename)}?dir=${encodeURIComponent(methodDir)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        setMethodContents((prev) => {
          const next = { ...prev };
          delete next[filename];
          return next;
        });
        setMethodFiles((prev) => prev.filter((f) => f.filename !== filename));
        Message.success('方法文件删除成功');
        return true;
      }
      Message.error(`删除失败: ${data.message}`);
      return false;
    } catch (err) {
      Message.error(`删除失败: ${(err as Error).message}`);
      return false;
    }
  }, [methodDir]);

  // ==================== JSON 导入 ====================

  const importJsonFile = async (file: File) => {
    try {
      const fileText = await file.text();
      const parsed = JSON.parse(fileText) as JsonValue;
      const root = createNode('根节点');
      setSourceJson(parsed);
      setNodes([root]);
      setSelectedNodeId(root.id);
      setSourceJsonCollapsed(false); // 导入后展开显示
      Message.success('JSON 导入成功');
    } catch (error) {
      Message.error(`JSON 导入失败: ${(error as Error).message}`);
    }
  };

  /**
   * 从 JSON 模板文件生成输出节点树
   * 递归遍历 JSON 的 key，每个 key 生成一个 directPath 模式节点
   * 数组只展开第一个元素，深度限制为 3 层，防止节点爆炸
   */
  const importTemplateJson = async (file: File) => {
    try {
      const fileText = await file.text();
      const parsed = JSON.parse(fileText) as JsonValue;

      const buildNodes = (obj: JsonValue, parentPath: string, depth: number): TransformNode[] => {
        if (depth > 3 || obj === null || typeof obj !== 'object') return [];

        const entries = Array.isArray(obj)
          ? obj.length > 0 ? Object.entries(obj[0] as object) : []
          : Object.entries(obj as object);

        return entries.map(([key, val]) => {
          const fullPath = parentPath ? `${parentPath}.${key}` : key;
          const node = createNode(key);
          node.mode = 'directPath';
          node.directPath = fullPath;
          node.children = (val !== null && typeof val === 'object')
            ? buildNodes(val as JsonValue, fullPath, depth + 1)
            : [];
          return node;
        });
      };

      const generatedNodes = buildNodes(parsed, '', 1);
      if (generatedNodes.length === 0) {
        Message.warning('JSON 模板为空或无法解析为节点树');
        return;
      }
      setNodes(generatedNodes);
      setSelectedNodeId(generatedNodes[0].id);
      Message.success(`已从模板生成 ${generatedNodes.length} 个根节点`);
    } catch (error) {
      Message.error(`模板 JSON 导入失败: ${(error as Error).message}`);
    }
  };

  // ==================== 节点操作 ====================

  const addSibling = () => {
    if (!selectedNodeId) { Message.warning('请先选择一个节点'); return; }
    setNodes((prev) => addSiblingNode(prev, selectedNodeId));
  };

  const addChild = () => {
    if (!selectedNodeId) { Message.warning('请先选择一个节点'); return; }
    setNodes((prev) => addChildNode(prev, selectedNodeId));
  };

  const addRoot = () => {
    const newRoot = createNode('新根节点');
    setNodes((prev) => [...prev, newRoot]);
    setSelectedNodeId(newRoot.id);
  };

  const removeCurrentNode = () => {
    if (!selectedNodeId) { Message.warning('请先选择一个节点'); return; }
    setNodes((prev) => {
      const next = deleteNode(prev, selectedNodeId);
      if (next.length === 0) {
        const fallback = createNode('根节点');
        setSelectedNodeId(fallback.id);
        return [fallback];
      }
      setSelectedNodeId(next[0].id);
      return next;
    });
  };

  const removeCheckedNodes = () => {
    if (checkedNodeIds.length === 0) { Message.warning('请先勾选节点'); return; }
    setNodes((prev) => {
      let next = prev;
      for (const id of checkedNodeIds) {
        next = deleteNode(next, id);
      }
      if (next.length === 0) {
        const fallback = createNode('根节点');
        setSelectedNodeId(fallback.id);
        setCheckedNodeIds([]);
        return [fallback];
      }
      setCheckedNodeIds([]);
      if (checkedNodeIds.includes(selectedNodeId)) {
        setSelectedNodeId(next[0].id);
      }
      return next;
    });
  };

  const updateCurrentNodeName = (name: string) => {
    if (!selectedNodeId) return;
    setNodes((prev) => updateNodeName(prev, selectedNodeId, name));
  };

  const setNodeMode = (nodeId: string, mode: NodeFunctionMode) => {
    setNodes((prev) => updateNodeMode(prev, nodeId, mode));
  };

  const setNodeDirectPath = (nodeId: string, directPath: string) => {
    setNodes((prev) => updateNodeDirectPath(prev, nodeId, directPath));
  };

  const setNodeCustomFunction = (nodeId: string, jsFileName: string, functionName: string) => {
    setNodes((prev) => updateNodeCustomFunction(prev, nodeId, jsFileName, functionName));
    // 预加载文件内容
    if (jsFileName) loadMethodContent(jsFileName);
  };

  const batchSetCustomFunction = (jsFileName: string, functionName: string) => {
    if (checkedNodeIds.length === 0) { Message.warning('请先勾选节点'); return; }
    setNodes((prev) => {
      let next = updateNodesCustomFunction(prev, checkedNodeIds, jsFileName, functionName);
      // 同时将所有选中节点设为 customFunction 模式
      for (const id of checkedNodeIds) {
        next = updateNodeMode(next, id, 'customFunction');
      }
      return next;
    });
    if (jsFileName) loadMethodContent(jsFileName);
    Message.success(`已为 ${checkedNodeIds.length} 个节点设置函数`);
  };

  // 兼容旧版 transformStep
  const setCurrentNodeTransform = (
    templateType: TransformTemplateType,
    configText: string,
    enabled: boolean
  ) => {
    if (!selectedNodeId) return;
    const currentStep = selectedNode?.transformStep;
    const nextStep: TransformStep = {
      id: currentStep?.id || `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      templateType,
      configText,
      enabled,
    };
    setNodes((prev) => updateNodeTransformStep(prev, selectedNodeId, nextStep));
  };

  const clearCurrentNodeTransform = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => updateNodeTransformStep(prev, selectedNodeId, null));
  };

  const initTransformForCurrentNode = (templateType: TransformTemplateType) => {
    if (!selectedNodeId) return;
    const step = createStep(templateType);
    setNodes((prev) => updateNodeTransformStep(prev, selectedNodeId, step));
  };

  // ==================== 写出结果 ====================

  const applyToPageData = () => {
    if (!previewJson) { Message.warning('暂无可写出的数据'); return; }
    updatePageData('jsonTransformResult', previewJson);
    Message.success('转换结果已写入页面变量 jsonTransformResult，可在变量绑定中使用');
  };

  const applyPreviewToSchema = () => {
    if (!previewJson) { Message.warning('暂无可写回的数据'); return; }
    const importableSchema = extractImportableSchema(previewJson);
    if (!importableSchema) {
      Message.error('当前转换结果不是可导入的低代码 Schema（需包含 componentsTree）');
      return;
    }
    try {
      project.importSchema(importableSchema);
      Message.success('转换结果已写回当前页面');
    } catch (error) {
      Message.error(`写回失败: ${(error as Error).message}`);
    }
  };

  // ==================== 勾选操作 ====================

  const toggleChecked = (nodeId: string) => {
    setCheckedNodeIds((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  const clearChecked = () => setCheckedNodeIds([]);

  const getAllNodeIds = (nodeList: TransformNode[]): string[] => {
    const ids: string[] = [];
    const walk = (list: TransformNode[]) => {
      for (const n of list) {
        ids.push(n.id);
        walk(n.children);
      }
    };
    walk(nodeList);
    return ids;
  };

  const selectAll = () => setCheckedNodeIds(getAllNodeIds(nodes));

  return {
    sourceJson,
    sourceJsonCollapsed,
    setSourceJsonCollapsed,
    nodes,
    selectedNodeId,
    selectedNode,
    checkedNodeIds,
    previewJson,
    errorText,
    methodFiles,
    methodContents,
    methodFilesLoading,
    methodDir,
    // JSON 导入
    importJsonFile,
    importTemplateJson,
    // 节点选择
    setSelectedNodeId,
    toggleChecked,
    clearChecked,
    selectAll,
    // 节点 CRUD
    addRoot,
    addSibling,
    addChild,
    removeCurrentNode,
    removeCheckedNodes,
    updateCurrentNodeName,
    // 节点模式设置
    setNodeMode,
    setNodeDirectPath,
    setNodeCustomFunction,
    batchSetCustomFunction,
    // 旧版模板函数兼容
    setCurrentNodeTransform,
    clearCurrentNodeTransform,
    initTransformForCurrentNode,
    // 方法文件管理
    loadMethodFiles,
    loadMethodContent,
    saveMethodFile,
    deleteMethodFile,
    parseExportedFunctions,
    // 结果写出
    applyToPageData,
    applyPreviewToSchema,
  };
}


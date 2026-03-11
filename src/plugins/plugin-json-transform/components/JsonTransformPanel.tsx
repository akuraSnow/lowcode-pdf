import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Collapse, Input, Message, Select, Tab } from '@alifd/next';
import { NodeFunctionMode, TransformNode, TransformTemplateType } from '../json-transform.types';
import { templateDefaults } from '../utils/transform-templates';
import { useJsonTransform, parseExportedFunctions } from '../hooks/use-json-transform';
import { MethodManager } from './MethodManager';

interface JsonTransformPanelProps {
  ctx: any;
}

const templateOptions: { value: TransformTemplateType; label: string }[] = [
  { value: 'pickPath', label: 'pickPath — 按路径提取值' },
  { value: 'omitPath', label: 'omitPath — 删除指定路径' },
  { value: 'setValue', label: 'setValue — 设置路径值' },
  { value: 'renameKey', label: 'renameKey — 重命名键名' },
  { value: 'mergeObject', label: 'mergeObject — 合并对象' },
  { value: 'filterArray', label: 'filterArray — 过滤数组' },
  { value: 'mapArrayField', label: 'mapArrayField — 数组字段映射' },
];

type FunctionSegment = {
  start: number;
  end: number;
  code: string;
};

function findMatchingBrace(source: string, openBraceIndex: number): number {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openBraceIndex; index < source.length; index++) {
    const char = source[index];
    const prev = index > 0 ? source[index - 1] : '';
    const next = index + 1 < source.length ? source[index + 1] : '';

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (prev === '*' && char === '/') inBlockComment = false;
      continue;
    }
    if (inSingleQuote) {
      if (char === "'" && prev !== '\\') inSingleQuote = false;
      continue;
    }
    if (inDoubleQuote) {
      if (char === '"' && prev !== '\\') inDoubleQuote = false;
      continue;
    }
    if (inTemplateString) {
      if (char === '`' && prev !== '\\') inTemplateString = false;
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      index++;
      continue;
    }
    if (char === "'") {
      inSingleQuote = true;
      continue;
    }
    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (char === '`') {
      inTemplateString = true;
      continue;
    }

    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function extractFunctionSegment(content: string, functionName: string): FunctionSegment | null {
  const fnDeclReg = new RegExp(`function\\s+${functionName}\\s*\\(`);
  const fnDeclMatch = fnDeclReg.exec(content);
  if (fnDeclMatch && fnDeclMatch.index >= 0) {
    const start = fnDeclMatch.index;
    const openBraceIndex = content.indexOf('{', start);
    if (openBraceIndex < 0) return null;
    const closeBraceIndex = findMatchingBrace(content, openBraceIndex);
    if (closeBraceIndex < 0) return null;
    const end = closeBraceIndex + 1;
    return { start, end, code: content.slice(start, end) };
  }

  const varDeclReg = new RegExp(`(?:const|let|var)\\s+${functionName}\\s*=`);
  const varDeclMatch = varDeclReg.exec(content);
  if (varDeclMatch && varDeclMatch.index >= 0) {
    const start = varDeclMatch.index;
    const openBraceIndex = content.indexOf('{', start);
    if (openBraceIndex < 0) return null;
    const closeBraceIndex = findMatchingBrace(content, openBraceIndex);
    if (closeBraceIndex < 0) return null;
    let end = closeBraceIndex + 1;
    while (end < content.length && /\s/.test(content[end])) end++;
    if (content[end] === ';') end++;
    return { start, end, code: content.slice(start, end) };
  }

  return null;
}

function replaceFunctionSegment(content: string, functionName: string, newCode: string): string | null {
  const segment = extractFunctionSegment(content, functionName);
  if (!segment) return null;
  return `${content.slice(0, segment.start)}${newCode}${content.slice(segment.end)}`;
}

// ─────────────────────────────────────────────────────────
// JSON 可展开/收缩查看器
// ─────────────────────────────────────────────────────────
type JsonVal = string | number | boolean | null | JsonVal[] | { [k: string]: JsonVal };

function JsonNode({ value, depth = 0 }: { value: JsonVal; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 1);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed((v) => !v);
  }, []);

  const indent = depth * 16;
  const arrowStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 14,
    cursor: 'pointer',
    userSelect: 'none',
    color: '#999',
    fontSize: 10,
    marginRight: 2,
  };

  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: '#555' }}>[]</span>;
    return (
      <span>
        <span style={arrowStyle} onClick={toggle}>{collapsed ? '▶' : '▼'}</span>
        <span style={{ color: '#555' }}>[</span>
        {collapsed ? (
          <span
            onClick={toggle}
            style={{ color: '#999', cursor: 'pointer', fontSize: 11, margin: '0 4px' }}
          >
            {value.length} items
          </span>
        ) : (
          <div style={{ marginLeft: indent + 16 }}>
            {value.map((item, i) => (
              <div key={i}>
                <JsonNode value={item as JsonVal} depth={depth + 1} />
                {i < value.length - 1 && <span style={{ color: '#555' }}>,</span>}
              </div>
            ))}
          </div>
        )}
        <span style={{ color: '#555' }}>]</span>
      </span>
    );
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span style={{ color: '#555' }}>{'{}'}</span>;
    return (
      <span>
        <span style={arrowStyle} onClick={toggle}>{collapsed ? '▶' : '▼'}</span>
        <span style={{ color: '#555' }}>{'{'}</span>
        {collapsed ? (
          <span
            onClick={toggle}
            style={{ color: '#999', cursor: 'pointer', fontSize: 11, margin: '0 4px' }}
          >
            {entries.length} keys
          </span>
        ) : (
          <div style={{ marginLeft: indent + 16 }}>
            {entries.map(([k, v], i) => (
              <div key={k}>
                <span style={{ color: '#905' }}>"{k}"</span>
                <span style={{ color: '#555' }}>: </span>
                <JsonNode value={v as JsonVal} depth={depth + 1} />
                {i < entries.length - 1 && <span style={{ color: '#555' }}>,</span>}
              </div>
            ))}
          </div>
        )}
        <span style={{ color: '#555' }}>{'}'}</span>
      </span>
    );
  }

  if (typeof value === 'string') return <span style={{ color: '#070' }}>"{value}"</span>;
  if (typeof value === 'number') return <span style={{ color: '#164' }}>{ value }</span>;
  if (typeof value === 'boolean') return <span style={{ color: '#219' }}>{ String(value) }</span>;
  return <span style={{ color: '#999' }}>null</span>;
}

function JsonViewer({ value, placeholder }: { value: JsonVal | null; placeholder?: string }) {
  if (value === null || value === undefined) {
    return (
      <div
        style={{
          padding: '10px 12px',
          background: '#fafafa',
          border: '1px solid #e8e8e8',
          borderRadius: 4,
          color: '#bbb',
          fontSize: 12,
          fontFamily: 'monospace',
          minHeight: 60,
        }}
      >
        {placeholder || ''}
      </div>
    );
  }
  return (
    <div
      style={{
        padding: '10px 12px',
        background: '#fafafa',
        border: '1px solid #e8e8e8',
        borderRadius: 4,
        fontSize: 12,
        fontFamily: 'monospace',
        lineHeight: 1.6,
        overflowX: 'auto',
      }}
    >
      <JsonNode value={value} depth={0} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 节点树（递归渲染，支持勾选）
// ─────────────────────────────────────────────────────────
function NodeTree(props: {
  nodes: TransformNode[];
  selectedNodeId: string;
  checkedNodeIds: string[];
  onSelect: (id: string) => void;
  onToggleCheck: (id: string) => void;
}) {
  const { nodes, selectedNodeId, checkedNodeIds, onSelect, onToggleCheck } = props;

  if (nodes.length === 0) {
    return <div style={{ color: '#999', fontSize: 12, padding: '4px 0' }}>暂无节点，点击「新增根节点」开始</div>;
  }

  const renderNodes = (list: TransformNode[], level: number): React.ReactNode =>
    list.map((node) => {
      const modeLabel =
        node.mode === 'customFunction'
          ? `[fn: ${node.functionName || '未选择'}]`
          : node.directPath
          ? `[路径: ${node.directPath}]`
          : node.transformStep
          ? '[模板]'
          : '[未配置]';

      return (
        <div key={node.id} style={{ marginLeft: level * 14, marginBottom: 4 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 6px',
              borderRadius: 4,
              background: selectedNodeId === node.id ? '#e6f4ff' : 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => onSelect(node.id)}
          >
            <Checkbox
              checked={checkedNodeIds.includes(node.id)}
              onChange={() => onToggleCheck(node.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <span style={{ flex: 1, fontSize: 12, fontWeight: selectedNodeId === node.id ? 600 : 400 }}>
              {node.name}
            </span>
            <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>{modeLabel}</span>
          </div>
          {node.children.length > 0 ? renderNodes(node.children, level + 1) : null}
        </div>
      );
    });

  return <div>{renderNodes(nodes, 0)}</div>;
}

// ─────────────────────────────────────────────────────────
// 节点编辑器（右侧面板）
// ─────────────────────────────────────────────────────────
function NodeEditor(props: {
  selectedNode: TransformNode | null;
  methodFiles: Array<{ filename: string }>;
  methodContents: Record<string, string>;
  onLoadContent: (filename: string) => Promise<string>;
  onSaveMethodFile: (filename: string, content: string) => Promise<boolean>;
  onNameChange: (name: string) => void;
  onModeChange: (mode: NodeFunctionMode) => void;
  onDirectPathChange: (path: string) => void;
  onCustomFunctionChange: (jsFileName: string, functionName: string) => void;
  onClearTransform: () => void;
  // 旧模板相关（向下兼容）
  onSetTemplate: (type: TransformTemplateType, config: string, enabled: boolean) => void;
  onInitTemplate: (type: TransformTemplateType) => void;
  onAddSibling: () => void;
  onAddChild: () => void;
  onRemove: () => void;
}) {
  const {
    selectedNode,
    methodFiles,
    methodContents,
    onLoadContent,
    onSaveMethodFile,
    onNameChange,
    onModeChange,
    onDirectPathChange,
    onCustomFunctionChange,
    onClearTransform,
    onSetTemplate,
    onInitTemplate,
    onAddSibling,
    onAddChild,
    onRemove,
  } = props;

  const [localFunctions, setLocalFunctions] = useState<string[]>([]);
  const [functionCode, setFunctionCode] = useState('');
  const [originalFunctionCode, setOriginalFunctionCode] = useState('');
  const [functionCodeLoading, setFunctionCodeLoading] = useState(false);
  const [functionCodeSaving, setFunctionCodeSaving] = useState(false);

  const functionCodeDirty = functionCode !== originalFunctionCode;

  // 当选中节点的 jsFileName 变化时，解析该文件内的函数列表
  // 注意：故意不将 methodContents / onLoadContent 列入依赖，
  // 因为 onLoadContent 每次执行后会更新 methodContents，
  // 若将二者列为依赖会导致 useEffect 反复触发，产生无限网络请求。
  useEffect(() => {
    if (!selectedNode?.jsFileName) {
      setLocalFunctions([]);
      return;
    }
    const filename = selectedNode.jsFileName;
    const cached = methodContents[filename];
    if (cached !== undefined) {
      setLocalFunctions(parseExportedFunctions(cached));
    }
    onLoadContent(filename).then((content) => {
      setLocalFunctions(parseExportedFunctions(content));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.jsFileName]);

  // 当文件/函数变化时，加载当前函数代码片段
  useEffect(() => {
    const loadFunctionSnippet = async () => {
      if (!selectedNode?.jsFileName || !selectedNode?.functionName) {
        setFunctionCode('');
        setOriginalFunctionCode('');
        return;
      }

      setFunctionCodeLoading(true);
      const content = await onLoadContent(selectedNode.jsFileName);

      const segment = extractFunctionSegment(content || '', selectedNode.functionName);
      if (!segment) {
        setFunctionCode('');
        setOriginalFunctionCode('');
        Message.warning(`未在 ${selectedNode.jsFileName} 中找到函数 ${selectedNode.functionName}`);
      } else {
        setFunctionCode(segment.code);
        setOriginalFunctionCode(segment.code);
      }
      setFunctionCodeLoading(false);
    };

    loadFunctionSnippet();
  }, [selectedNode?.jsFileName, selectedNode?.functionName]);

  const handleFunctionCodeBlur = async () => {
    if (!selectedNode?.jsFileName || !selectedNode?.functionName) return;
    if (!functionCodeDirty) return;
    if (!functionCode.trim()) {
      Message.warning('函数代码不能为空');
      return;
    }

    setFunctionCodeSaving(true);
    const latestContent = await onLoadContent(selectedNode.jsFileName);

    const replaced = replaceFunctionSegment(
      latestContent || '',
      selectedNode.functionName,
      functionCode
    );

    if (!replaced) {
      Message.error(`保存失败：未找到函数 ${selectedNode.functionName}`);
      setFunctionCodeSaving(false);
      return;
    }

    const ok = await onSaveMethodFile(selectedNode.jsFileName, replaced);
    if (ok) {
      setOriginalFunctionCode(functionCode);
    }
    setFunctionCodeSaving(false);
  };

  if (!selectedNode) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: 13,
          border: '1px dashed #d9d9d9',
          borderRadius: 4,
        }}
      >
        请从左侧选择节点进行编辑
      </div>
    );
  }

  const mode = selectedNode.mode || 'directPath';
  const selectedTemplate = selectedNode.transformStep?.templateType || 'pickPath';
  const selectedConfigText = selectedNode.transformStep?.configText || templateDefaults.pickPath;
  const selectedEnabled = selectedNode.transformStep?.enabled ?? true;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto', paddingRight: 2 }}>
      {/* 节点名称 */}
      <div>
        <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>节点名称</div>
        <Input
          value={selectedNode.name}
          onChange={(v) => onNameChange(String(v))}
          placeholder="节点名称"
          style={{ width: '100%' }}
        />
      </div>

      {/* 节点操作 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button size="small" onClick={onAddSibling}>+ 兄弟节点</Button>
        <Button size="small" onClick={onAddChild}>+ 子节点</Button>
        <Button size="small" warning onClick={onRemove}>删除节点</Button>
      </div>

      {/* 绑定模式切换 */}
      <div>
        <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>绑定模式</div>
        <div style={{ display: 'flex', gap: 0, border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
          {[
            { value: 'directPath', label: '直接路径' },
            { value: 'customFunction', label: '调用函数' },
            { value: 'template', label: '内置模板（旧）' },
          ].map(({ value, label }) => (
            <div
              key={value}
              onClick={() => {
                if (value !== 'template') onModeChange(value as NodeFunctionMode);
              }}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '6px 4px',
                fontSize: 12,
                cursor: 'pointer',
                background:
                  (value === 'template' && mode !== 'directPath' && mode !== 'customFunction') ||
                  mode === value
                    ? '#1677ff'
                    : '#f5f5f5',
                color:
                  (value === 'template' && mode !== 'directPath' && mode !== 'customFunction') ||
                  mode === value
                    ? '#fff'
                    : '#333',
                borderRight: '1px solid #d9d9d9',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* 直接路径模式 */}
      {mode === 'directPath' && (
        <div>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>提取路径</div>
          <Input
            value={selectedNode.directPath || ''}
            onChange={(v) => onDirectPathChange(String(v))}
            placeholder="如: data.list 或 users[0].name"
            style={{ width: '100%', fontFamily: 'monospace' }}
          />
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
            从导入的 JSON 中按路径提取值，支持点分路径和数组索引
          </div>
        </div>
      )}

      {/* 自定义函数模式 */}
      {mode === 'customFunction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>选择 JS 文件</div>
            <Select
              value={selectedNode.jsFileName || ''}
              onChange={(v) => {
                onCustomFunctionChange(String(v), '');
              }}
              placeholder="请选择方法文件"
              style={{ width: '100%' }}
              showSearch
              filterLocal
              dataSource={methodFiles.map((f) => ({ label: f.filename, value: f.filename }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>选择函数</div>
            <Select
              value={selectedNode.functionName || ''}
              onChange={(v) => {
                onCustomFunctionChange(selectedNode.jsFileName || '', String(v));
              }}
              placeholder={selectedNode.jsFileName ? '请选择函数' : '请先选择JS文件'}
              disabled={!selectedNode.jsFileName}
              style={{ width: '100%' }}
              showSearch
              filterLocal
              dataSource={localFunctions.map((fn) => ({ label: fn, value: fn }))}
            />
          </div>
          <div style={{ fontSize: 11, color: '#999' }}>
            函数签名：<code>function(nodePath) {'{ return uiJson ... }'}</code>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span>函数代码（失焦自动保存）</span>
              <span style={{ color: functionCodeSaving ? '#1677ff' : functionCodeDirty ? '#faad14' : '#999' }}>
                {functionCodeSaving ? '保存中...' : functionCodeDirty ? '未保存' : '已保存'}
              </span>
            </div>
            <Input.TextArea
              value={functionCode}
              onChange={(v) => setFunctionCode(String(v))}
              onBlur={handleFunctionCodeBlur}
              placeholder={
                selectedNode.functionName
                  ? functionCodeLoading
                    ? '函数代码加载中...'
                    : '未找到函数代码，请检查函数名和文件'
                  : '请先选择函数'
              }
              disabled={!selectedNode.functionName || functionCodeLoading}
              rows={12}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
        </div>
      )}

      {/* 旧版内置模板模式 */}
      {mode !== 'directPath' && mode !== 'customFunction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>函数模板</div>
            <Select
              value={selectedTemplate}
              onChange={(v) => onInitTemplate(v as TransformTemplateType)}
              style={{ width: '100%' }}
              dataSource={templateOptions.map((o) => ({ label: o.label, value: o.value }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>模板配置 (JSON)</div>
            <Input.TextArea
              value={selectedConfigText}
              onChange={(v) => onSetTemplate(selectedTemplate, String(v), selectedEnabled)}
              rows={6}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="small"
              onClick={() => {
                onSetTemplate(selectedTemplate, selectedConfigText, !selectedEnabled);
                Message.success(selectedEnabled ? '已禁用函数' : '已启用函数');
              }}
            >
              {selectedEnabled ? '禁用' : '启用'}
            </Button>
            <Button size="small" onClick={onClearTransform}>清除模板</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 主面板（Drawer 内容）
// ─────────────────────────────────────────────────────────
export function JsonTransformPanel({ ctx }: JsonTransformPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const templateFileInputRef = useRef<HTMLInputElement | null>(null);
  const state = useJsonTransform(ctx.project);
  const {
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
    importJsonFile,
    importTemplateJson,
    setSelectedNodeId,
    toggleChecked,
    clearChecked,
    selectAll,
    addRoot,
    addSibling,
    addChild,
    removeCurrentNode,
    removeCheckedNodes,
    updateCurrentNodeName,
    setNodeMode,
    setNodeDirectPath,
    setNodeCustomFunction,
    batchSetCustomFunction,
    setCurrentNodeTransform,
    clearCurrentNodeTransform,
    initTransformForCurrentNode,
    loadMethodFiles,
    loadMethodContent,
    saveMethodFile,
    deleteMethodFile,
    applyToPageData,
  } = state;

  const [batchJsFile, setBatchJsFile] = useState('');
  const [batchFnName, setBatchFnName] = useState('');
  const [batchFnOptions, setBatchFnOptions] = useState<string[]>([]);

  // 批量设置时加载函数列表
  const handleBatchFileChange = async (filename: string) => {
    setBatchJsFile(filename);
    setBatchFnName('');
    if (filename) {
      const content = await loadMethodContent(filename);
      setBatchFnOptions(parseExportedFunctions(content));
    } else {
      setBatchFnOptions([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Tab>
        {/* ═══════════════════  转换配置  ═══════════════════ */}
        <Tab.Item title="🔄 转换配置" key="transform">
          <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 0 0' }}>
            {/* 顶部工具栏 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <Button
                type="primary"
                onClick={() => fileInputRef.current?.click()}
                style={{ minWidth: 100 }}
              >
                📂 导入 JSON
              </Button>
              <Button onClick={addRoot}>+ 新增根节点</Button>
              {checkedNodeIds.length > 0 && (
                <>
                  <span style={{ color: '#888', fontSize: 12 }}>已选 {checkedNodeIds.length} 个</span>
                  <Button size="small" warning onClick={removeCheckedNodes}>批量删除</Button>
                  <Button size="small" onClick={clearChecked}>取消勾选</Button>
                </>
              )}
              <Button size="small" type="normal" onClick={selectAll}>全选</Button>
            </div>

            {/* 批量设置函数（仅勾选时显示） */}
            {checkedNodeIds.length > 1 && (
              <div
                style={{
                  padding: '8px 10px',
                  background: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 4,
                  marginBottom: 10,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 12, color: '#555', flexShrink: 0 }}>批量设置函数：</span>
                <Select
                  size="small"
                  placeholder="选择JS文件"
                  value={batchJsFile}
                  onChange={(v) => handleBatchFileChange(String(v))}
                  style={{ width: 160 }}
                  showSearch
                  filterLocal
                  dataSource={methodFiles.map((f) => ({ label: f.filename, value: f.filename }))}
                />
                <Select
                  size="small"
                  placeholder="选择函数"
                  value={batchFnName}
                  onChange={(v) => setBatchFnName(String(v))}
                  disabled={!batchJsFile}
                  style={{ width: 140 }}
                  showSearch
                  filterLocal
                  dataSource={batchFnOptions.map((fn) => ({ label: fn, value: fn }))}
                />
                <Button
                  size="small"
                  type="primary"
                  disabled={!batchJsFile || !batchFnName}
                  onClick={() => batchSetCustomFunction(batchJsFile, batchFnName)}
                >
                  应用到选中节点
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const input = e.target as HTMLInputElement;
                const file = input.files?.[0];
                if (!file) return;
                await importJsonFile(file);
                if (input) input.value = '';
              }}
            />
            <input
              ref={templateFileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const input = e.target as HTMLInputElement;
                const file = input.files?.[0];
                if (!file) return;
                await importTemplateJson(file);
                if (input) input.value = '';
              }}
            />

            {/* 源 JSON 折叠展示 */}
            {sourceJson && (
              <Collapse style={{ marginBottom: 10 }}>
                <Collapse.Panel
                  title={
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      📋 源 JSON {sourceJsonCollapsed ? '（已折叠）' : ''}
                    </span>
                  }
                  key="sourceJson"
                >
                  <JsonViewer value={sourceJson as JsonVal} />
                </Collapse.Panel>
              </Collapse>
            )}

            {/* 中部两栏：节点树 + 节点编辑器 */}
            <div style={{ display: 'flex', gap: 12, minHeight: 400 }}>
              {/* 节点树 */}
              <div
                style={{
                  width: 260,
                  flexShrink: 0,
                  border: '1px solid #e8e8e8',
                  borderRadius: 4,
                  overflow: 'auto',
                  padding: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 12, color: '#333' }}>📁 输出节点树</span>
                  <Button
                    size="small"
                    onClick={() => templateFileInputRef.current?.click()}
                    title="上传一个 JSON 文件，自动按其结构生成节点树"
                  >
                    📋 从模板生成
                  </Button>
                </div>
                <NodeTree
                  nodes={nodes}
                  selectedNodeId={selectedNodeId}
                  checkedNodeIds={checkedNodeIds}
                  onSelect={setSelectedNodeId}
                  onToggleCheck={toggleChecked}
                />
              </div>

              {/* 节点编辑器 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: '#333' }}>
                  ✏️ 节点编辑
                </div>
                <NodeEditor
                  selectedNode={selectedNode}
                  methodFiles={methodFiles}
                  methodContents={methodContents}
                  onLoadContent={loadMethodContent}
                  onSaveMethodFile={saveMethodFile}
                  onNameChange={updateCurrentNodeName}
                  onModeChange={(mode) => selectedNodeId && setNodeMode(selectedNodeId, mode)}
                  onDirectPathChange={(path) => selectedNodeId && setNodeDirectPath(selectedNodeId, path)}
                  onCustomFunctionChange={(file, fn) => selectedNodeId && setNodeCustomFunction(selectedNodeId, file, fn)}
                  onClearTransform={clearCurrentNodeTransform}
                  onSetTemplate={setCurrentNodeTransform}
                  onInitTemplate={initTransformForCurrentNode}
                  onAddSibling={addSibling}
                  onAddChild={addChild}
                  onRemove={removeCurrentNode}
                />
              </div>
            </div>

            {/* 底部：转换预览 */}
            <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: '#333' }}>
                🔍 转换结果预览
              </div>
              {errorText && (
                <div style={{ color: '#d4380d', fontSize: 12, marginBottom: 6, padding: '4px 8px', background: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
                  ❌ 错误：{errorText}
                </div>
              )}
              <JsonViewer value={previewJson as JsonVal | null} placeholder="转换结果将显示在此处..." />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button
                  type="primary"
                  onClick={applyToPageData}
                  disabled={!previewJson || !!errorText}
                >
                  📌 应用到页面变量
                </Button>
              </div>
              {previewJson && !errorText && (
                <div style={{ fontSize: 11, color: '#52c41a', marginTop: 4 }}>
                  ✅ 点击「应用到页面变量」后可在变量绑定中通过 <code>state.jsonTransformResult</code> 引用数据
                </div>
              )}
            </div>
          </div>
        </Tab.Item>

        {/* ═══════════════════  方法管理  ═══════════════════ */}
        <Tab.Item title="⚙️ 方法管理" key="methods">
          <div style={{ padding: '12px 0 0', display: 'flex', flexDirection: 'column' }}>
            <MethodManager
              methodFiles={methodFiles}
              methodContents={methodContents}
              methodFilesLoading={methodFilesLoading}
              methodDir={methodDir}
              onLoad={loadMethodFiles}
              onLoadContent={loadMethodContent}
              onSave={saveMethodFile}
              onDelete={deleteMethodFile}
            />
          </div>
        </Tab.Item>
      </Tab>
    </div>
  );
}


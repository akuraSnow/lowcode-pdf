import React, { useEffect, useRef, useState } from 'react';
import { Button, Dialog, Input, Message } from '@alifd/next';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { JsMethodFile } from '../json-transform.types';

interface MethodManagerProps {
  methodFiles: JsMethodFile[];
  methodContents: Record<string, string>;
  methodFilesLoading: boolean;
  methodDir: string;
  onLoad: () => void;
  onLoadContent: (filename: string) => Promise<string>;
  onSave: (filename: string, content: string) => Promise<boolean>;
  onDelete: (filename: string) => Promise<boolean>;
}

const DEFAULT_TEMPLATE = `/**
 * 转换函数模板
 * @param {string} nodePath - 当前节点的直接路径（可选）
 * @description 可直接使用全局变量 uiJson（导入的原始 JSON 数据）
 * @returns {any} 转换后的值
 */
function transform(nodePath) {
  // 在此编写转换逻辑
  return uiJson;
}
`;

/**
 * 方法文件管理器 - 用于新增/编辑/删除 JS 方法文件
 */
export function MethodManager({
  methodFiles,
  methodContents,
  methodFilesLoading,
  methodDir,
  onLoad,
  onLoadContent,
  onSave,
  onDelete,
}: MethodManagerProps) {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [editingContent, setEditingContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);

  // 初始加载文件列表
  useEffect(() => {
    onLoad();
  }, []);

  // 选中文件时加载内容
  useEffect(() => {
    if (!selectedFile) {
      setEditingContent('');
      setIsDirty(false);
      return;
    }

    const cachedContent = methodContents[selectedFile];
    if (cachedContent !== undefined) {
      setEditingContent(cachedContent);
      setIsDirty(false);
    }
    onLoadContent(selectedFile).then((content) => {
      setEditingContent(content);
      setIsDirty(false);
    });
  }, [selectedFile]);

  // 当已加载内容变更时同步（例如外部刷新）
  useEffect(() => {
    if (selectedFile && methodContents[selectedFile] !== undefined && !isDirty) {
      setEditingContent(methodContents[selectedFile]);
    }
  }, [methodContents]);

  const handleSelectFile = (filename: string) => {
    if (isDirty) {
      Dialog.confirm({
        title: '未保存的修改',
        content: '当前文件有未保存的修改，确定要切换吗？',
        onOk: () => {
          setSelectedFile(filename);
          setIsDirty(false);
        },
      });
    } else {
      setSelectedFile(filename);
    }
  };

  const handleContentChange = (value: string) => {
    setEditingContent(value);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    const ok = await onSave(selectedFile, editingContent);
    if (ok) setIsDirty(false);
    setIsSaving(false);
  };

  const handleCreateFile = async () => {
    let filename = newFileName.trim();
    if (!filename) return;
    if (!filename.endsWith('.js')) filename += '.js';
    if (methodFiles.some((f) => f.filename === filename)) {
      Message.warning('文件名已存在');
      return;
    }
    const ok = await onSave(filename, DEFAULT_TEMPLATE);
    if (ok) {
      setShowNewFileInput(false);
      setNewFileName('');
      setSelectedFile(filename);
    }
  };

  const handleDeleteFile = (filename: string) => {
    Dialog.confirm({
      title: '确认删除',
      content: `确定要删除文件 "${filename}" 吗？此操作不可撤销。`,
      onOk: async () => {
        await onDelete(filename);
        if (selectedFile === filename) {
          setSelectedFile('');
          setEditingContent('');
          setIsDirty(false);
        }
      },
    });
  };

  return (
    <div style={{ display: 'flex', gap: 12, minHeight: 500 }}>
      {/* 左侧文件列表 */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          border: '1px solid #e8e8e8',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '8px 10px',
            borderBottom: '1px solid #e8e8e8',
            fontWeight: 600,
            fontSize: 12,
            background: '#fafafa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>方法文件</span>
          <Button
            size="small"
            type="primary"
            onClick={() => setShowNewFileInput((v) => !v)}
          >
            + 新建
          </Button>
        </div>

        {showNewFileInput && (
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #eee', background: '#f5f5f5' }}>
            <Input
              size="small"
              placeholder="文件名 (.js)"
              value={newFileName}
              onChange={(v) => setNewFileName(String(v))}
              style={{ width: '100%', marginBottom: 4 }}
              onPressEnter={handleCreateFile}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <Button size="small" type="primary" onClick={handleCreateFile} style={{ flex: 1 }}>确认</Button>
              <Button size="small" onClick={() => { setShowNewFileInput(false); setNewFileName(''); }} style={{ flex: 1 }}>取消</Button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {methodFilesLoading ? (
            <div style={{ padding: 10, color: '#999', fontSize: 12 }}>加载中...</div>
          ) : methodFiles.length === 0 ? (
            <div style={{ padding: 10, color: '#999', fontSize: 12 }}>暂无方法文件</div>
          ) : (
            methodFiles.map((f) => (
              <div
                key={f.filename}
                onClick={() => handleSelectFile(f.filename)}
                style={{
                  padding: '7px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  background: selectedFile === f.filename ? '#e6f4ff' : 'transparent',
                  borderLeft: selectedFile === f.filename ? '3px solid #1677ff' : '3px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📄 {f.filename}
                </span>
                <Button
                  size="small"
                  type="normal"
                  warning
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(f.filename);
                  }}
                  style={{ padding: '0 4px', minWidth: 'unset', fontSize: 11 }}
                >
                  删除
                </Button>
              </div>
            ))
          )}
        </div>

        {!methodDir && (
          <div style={{ padding: 8, color: '#ff4d4f', fontSize: 11, borderTop: '1px solid #eee' }}>
            ⚠ 请先在全局设置中配置方法保存路径
          </div>
        )}
      </div>

      {/* 右侧编辑器 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedFile ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                {selectedFile}
                {isDirty && <span style={{ color: '#faad14', marginLeft: 6, fontSize: 12 }}>● 未保存</span>}
              </span>
              <Button
                type="primary"
                size="small"
                onClick={handleSave}
                loading={isSaving}
                disabled={!isDirty}
              >
                保存
              </Button>
            </div>
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'auto' }}>
              <CodeMirror
                value={editingContent}
                extensions={[javascript()]}
                theme="light"
                onChange={handleContentChange}
                minHeight="400px"
                style={{ fontSize: 13 }}
                basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true }}
              />
            </div>
          </>
        ) : (
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
            请从左侧选择一个方法文件进行编辑
          </div>
        )}
      </div>
    </div>
  );
}

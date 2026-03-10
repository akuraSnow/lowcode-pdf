/**
 * JSON 转换插件持久化 Store
 * 使用 zustand persist 中间件，将核心状态持久化到 localStorage
 * 关闭 Drawer 后再次打开可恢复上次的工作状态
 */

import create from 'zustand';
import { persist } from 'zustand/middleware';
import { JsonValue, TransformNode } from '../json-transform.types';

interface JsonTransformPersistState {
  /** 导入的原始 JSON */
  sourceJson: JsonValue | null;
  setSourceJson: (v: JsonValue | null) => void;

  /** 源 JSON 折叠显示状态 */
  sourceJsonCollapsed: boolean;
  setSourceJsonCollapsed: (v: boolean) => void;

  /** 输出节点树 */
  nodes: TransformNode[];
  setNodes: (v: TransformNode[] | ((prev: TransformNode[]) => TransformNode[])) => void;

  /** 当前选中节点 ID */
  selectedNodeId: string;
  setSelectedNodeId: (v: string) => void;

  /** 批量勾选的节点 IDs */
  checkedNodeIds: string[];
  setCheckedNodeIds: (v: string[] | ((prev: string[]) => string[])) => void;

  /** 方法文件内容缓存（filename -> content） */
  methodContents: Record<string, string>;
  setMethodContents: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export const useJsonTransformPersistStore = create<JsonTransformPersistState>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (persist as any)(
    (set: (partial: Partial<JsonTransformPersistState> | ((s: JsonTransformPersistState) => Partial<JsonTransformPersistState>)) => void) => ({
      sourceJson: null as JsonValue | null,
      setSourceJson: (v: JsonValue | null) => set({ sourceJson: v }),

      sourceJsonCollapsed: true as boolean,
      setSourceJsonCollapsed: (v: boolean) => set({ sourceJsonCollapsed: v }),

      nodes: [] as TransformNode[],
      setNodes: (v: TransformNode[] | ((prev: TransformNode[]) => TransformNode[])) =>
        set((state: JsonTransformPersistState) => ({
          nodes: typeof v === 'function' ? v(state.nodes) : v,
        })),

      selectedNodeId: '' as string,
      setSelectedNodeId: (v: string) => set({ selectedNodeId: v }),

      checkedNodeIds: [] as string[],
      setCheckedNodeIds: (v: string[] | ((prev: string[]) => string[])) =>
        set((state: JsonTransformPersistState) => ({
          checkedNodeIds: typeof v === 'function' ? v(state.checkedNodeIds) : v,
        })),

      methodContents: {} as Record<string, string>,
      setMethodContents: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) =>
        set((state: JsonTransformPersistState) => ({
          methodContents: typeof v === 'function' ? v(state.methodContents) : v,
        })),
    }),
    {
      name: 'json-transform-storage',
    }
  )
);

import * as zustand from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

const create = (zustand as any).default || zustand;
import type {
  EditorState,
  DocumentConfig,
  PageConfig,
  PageSettings,
  Component,
  EditorMode,
  LayoutMode,
  PageSize,
  PageOrientation,
  PageMargin,
} from '../types';

// 默认页面边距
const DEFAULT_MARGIN: PageMargin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

// 默认页面设置
const createDefaultPageSettings = (): PageSettings => ({
  id: uuidv4(),
  name: '新页面',
  size: 'A4',
  customWidth: 210,
  customHeight: 297,
  orientation: 'portrait',
  margin: DEFAULT_MARGIN,
  backgroundColor: '#ffffff',
  defaultFontSize: 14,
  defaultFontColor: '#000000',
  defaultFontFamily: 'Arial',
  componentGap: 10,
});

// 默认文档配置
const createDefaultDocument = (): DocumentConfig => ({
  id: uuidv4(),
  title: '未命名文档',
  description: '',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  pages: [
    {
      settings: createDefaultPageSettings(),
      components: [],
    },
  ],
  resources: {
    images: [],
    css: [],
    functions: [],
  },
  templates: [],
});

interface EditorStore extends EditorState {
  // ==================== 文档操作 ====================
  setDocument: (document: DocumentConfig) => void;
  updateDocument: (updates: Partial<DocumentConfig>) => void;
  resetDocument: () => void;

  // ==================== 页面操作 ====================
  addPage: (settings?: Partial<PageSettings>) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  updatePageSettings: (pageId: string, settings: Partial<PageSettings>) => void;
  movePage: (fromIndex: number, toIndex: number) => void;
  setCurrentPage: (pageId: string) => void;
  getCurrentPage: () => PageConfig | undefined;

  // ==================== 组件操作 ====================
  addComponent: (component: Component, pageId?: string) => void;
  deleteComponent: (componentId: string, pageId?: string) => void;
  updateComponent: (
    componentId: string,
    updates: Partial<Component>,
    pageId?: string
  ) => void;
  duplicateComponent: (componentId: string, pageId?: string) => void;
  moveComponent: (
    componentId: string,
    newIndex: number,
    pageId?: string
  ) => void;

  // ==================== 选择操作 ====================
  selectComponent: (componentId: string | null) => void;
  getSelectedComponent: () => Component | undefined;

  // ==================== 编辑器模式 ====================
  setMode: (mode: EditorMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;

  // ==================== 剪贴板操作 ====================
  copyComponent: (componentId: string, pageId?: string) => void;
  pasteComponent: (pageId?: string) => void;
  cutComponent: (componentId: string, pageId?: string) => void;

  // ==================== 历史记录（撤销/重做） ====================
  addToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // ==================== 工具方法 ====================
  getComponentById: (
    componentId: string,
    pageId?: string
  ) => Component | undefined;
  getPageById: (pageId: string) => PageConfig | undefined;
}

const immerSet = (fn: any) => (state: any) => produce(state, fn);

export const useEditorStore = create<EditorStore>((set, get) => {
  const setState = (fn: any) => set(immerSet(fn));
  
  return {
    // 初始状态
    document: createDefaultDocument(),
    currentPageId: '',
    selectedComponentId: null,
    mode: 'EDIT',
    layoutMode: 'waterfall',
    clipboard: null,
    history: [],
    historyIndex: -1,

    // ==================== 文档操作 ====================
    setDocument: (document) => {
      setState((state) => {
        state.document = document;
        state.currentPageId = document.pages[0]?.settings.id || '';
        state.selectedComponentId = null;
        state.document.updatedAt = new Date();
      });
      get().addToHistory();
    },

    updateDocument: (updates) => {
      setState((state) => {
        Object.assign(state.document, updates);
        state.document.updatedAt = new Date();
      });
      get().addToHistory();
    },

    resetDocument: () => {
      const defaultDoc = createDefaultDocument();
      setState((state) => {
        state.document = defaultDoc;
        state.currentPageId = defaultDoc.pages[0].settings.id;
        state.selectedComponentId = null;
        state.history = [];
        state.historyIndex = -1;
      });
    },

    // ==================== 页面操作 ====================
    addPage: (settings = {}) => {
      const newPageSettings = {
        ...createDefaultPageSettings(),
        ...settings,
      };
      const newPage: PageConfig = {
        settings: newPageSettings,
        components: [],
      };

      setState((state) => {
        state.document.pages.push(newPage);
        state.currentPageId = newPageSettings.id;
        state.document.updatedAt = new Date();
      });
      get().addToHistory();
    },

    deletePage: (pageId) => {
      setState((state) => {
        const pageIndex = state.document.pages.findIndex(
          (p) => p.settings.id === pageId
        );

        // 不允许删除最后一页
        if (state.document.pages.length <= 1) {
          return;
        }

        if (pageIndex !== -1) {
          state.document.pages.splice(pageIndex, 1);

          // 如果删除的是当前页，切换到相邻页面
          if (state.currentPageId === pageId) {
            const newIndex = Math.min(pageIndex, state.document.pages.length - 1);
            state.currentPageId = state.document.pages[newIndex].settings.id;
          }

          state.document.updatedAt = new Date();
        }
      });
      get().addToHistory();
    },

    duplicatePage: (pageId) => {
      setState((state) => {
        const pageIndex = state.document.pages.findIndex(
          (p) => p.settings.id === pageId
        );

        if (pageIndex !== -1) {
          const originalPage = state.document.pages[pageIndex];
          const newPage: PageConfig = {
            settings: {
              ...originalPage.settings,
              id: uuidv4(),
              name: `${originalPage.settings.name} - 副本`,
            },
            components: originalPage.components.map((comp) =>
              duplicateComponentWithNewId(comp)
            ),
            dataConfig: originalPage.dataConfig
              ? JSON.parse(JSON.stringify(originalPage.dataConfig))
              : undefined,
          };

          state.document.pages.splice(pageIndex + 1, 0, newPage);
          state.currentPageId = newPage.settings.id;
          state.document.updatedAt = new Date();
        }
      });
      get().addToHistory();
    },

    updatePageSettings: (pageId, settings) => {
      setState((state) => {
        const page = state.document.pages.find((p) => p.settings.id === pageId);
        if (page) {
          Object.assign(page.settings, settings);
          state.document.updatedAt = new Date();
        }
      });
      get().addToHistory();
    },

    movePage: (fromIndex, toIndex) => {
      setState((state) => {
        const pages = state.document.pages;
        if (
          fromIndex >= 0 &&
          fromIndex < pages.length &&
          toIndex >= 0 &&
          toIndex < pages.length
        ) {
          const [movedPage] = pages.splice(fromIndex, 1);
          pages.splice(toIndex, 0, movedPage);
          state.document.updatedAt = new Date();
        }
      });
      get().addToHistory();
    },

    setCurrentPage: (pageId) => {
      setState((state) => {
        state.currentPageId = pageId;
        state.selectedComponentId = null;
      });
    },

    getCurrentPage: () => {
      const state = get();
      return state.document.pages.find(
        (p) => p.settings.id === state.currentPageId
      );
    },

    // ==================== 组件操作 ====================
    addComponent: (component, pageId) => {
      setState((state) => {
        const targetPageId = pageId || state.currentPageId;
        const page = state.document.pages.find(
          (p) => p.settings.id === targetPageId
        );

        if (page) {
          page.components.push(component);
          state.selectedComponentId = component.id;
          state.document.updatedAt = new Date();
        }
      });
      get().addToHistory();
    },

    deleteComponent: (componentId, pageId) => {
      setState((state) => {
        const targetPageId = pageId || state.currentPageId;
        const page = state.document.pages.find(
          (p) => p.settings.id === targetPageId
        );

        if (page) {
          const index = page.components.findIndex((c) => c.id === componentId);
          if (index !== -1) {
            page.components.splice(index, 1);
            if (state.selectedComponentId === componentId) {
              state.selectedComponentId = null;
            }
            state.document.updatedAt = new Date();
          }
        }
      });
      get().addToHistory();
    },

    updateComponent: (componentId, updates, pageId) => {
      setState((state) => {
        const targetPageId = pageId || state.currentPageId;
        const page = state.document.pages.find(
          (p) => p.settings.id === targetPageId
        );

        if (page) {
          const component = page.components.find((c) => c.id === componentId);
          if (component) {
            Object.assign(component, updates);
            state.document.updatedAt = new Date();
          }
        }
      });
      get().addToHistory();
    },

    duplicateComponent: (componentId, pageId) => {
      setState((state) => {
        const targetPageId = pageId || state.currentPageId;
        const page = state.document.pages.find(
          (p) => p.settings.id === targetPageId
        );

        if (page) {
          const componentIndex = page.components.findIndex(
            (c) => c.id === componentId
          );
          if (componentIndex !== -1) {
            const originalComponent = page.components[componentIndex];
            const newComponent = duplicateComponentWithNewId(originalComponent);
            page.components.splice(componentIndex + 1, 0, newComponent);
            state.selectedComponentId = newComponent.id;
            state.document.updatedAt = new Date();
          }
        }
      });
      get().addToHistory();
    },

    moveComponent: (componentId, newIndex, pageId) => {
      setState((state) => {
        const targetPageId = pageId || state.currentPageId;
        const page = state.document.pages.find(
          (p) => p.settings.id === targetPageId
        );

        if (page) {
          const oldIndex = page.components.findIndex((c) => c.id === componentId);
          if (oldIndex !== -1 && newIndex >= 0 && newIndex < page.components.length) {
            const [component] = page.components.splice(oldIndex, 1);
            page.components.splice(newIndex, 0, component);
            state.document.updatedAt = new Date();
          }
        }
      });
      get().addToHistory();
    },

    // ==================== 选择操作 ====================
    selectComponent: (componentId) => {
      setState((state) => {
        state.selectedComponentId = componentId;
      });
    },

    getSelectedComponent: () => {
      const state = get();
      if (!state.selectedComponentId) return undefined;
      return get().getComponentById(state.selectedComponentId);
    },

    // ==================== 编辑器模式 ====================
    setMode: (mode) => {
      setState((state) => {
        state.mode = mode;
        if (mode !== 'EDIT') {
          state.selectedComponentId = null;
        }
      });
    },

    setLayoutMode: (mode) => {
      setState((state) => {
        state.layoutMode = mode;
      });
    },

    // ==================== 剪贴板操作 ====================
    copyComponent: (componentId, pageId) => {
      const component = get().getComponentById(componentId, pageId);
      if (component) {
        setState((state) => {
          state.clipboard = JSON.parse(JSON.stringify(component));
        });
      }
    },

    pasteComponent: (pageId) => {
      const state = get();
      if (state.clipboard) {
        const newComponent = duplicateComponentWithNewId(state.clipboard);
        get().addComponent(newComponent, pageId);
      }
    },

    cutComponent: (componentId, pageId) => {
      get().copyComponent(componentId, pageId);
      get().deleteComponent(componentId, pageId);
    },

    // ==================== 历史记录 ====================
    addToHistory: () => {
      setState((state) => {
        const currentDocument = JSON.parse(JSON.stringify(state.document));

        // 如果当前不在历史记录的末尾，删除后面的记录
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }

        state.history.push(currentDocument);

        // 限制历史记录数量
        if (state.history.length > 50) {
          state.history.shift();
        } else {
          state.historyIndex++;
        }
      });
    },

    undo: () => {
      const state = get();
      if (state.historyIndex > 0) {
        set((draft) => {
          draft.historyIndex--;
          draft.document = JSON.parse(
            JSON.stringify(draft.history[draft.historyIndex])
          );
        });
      }
    },

    redo: () => {
      const state = get();
      if (state.historyIndex < state.history.length - 1) {
        set((draft) => {
          draft.historyIndex++;
          draft.document = JSON.parse(
            JSON.stringify(draft.history[draft.historyIndex])
          );
        });
      }
    },

    canUndo: () => {
      return get().historyIndex > 0;
    },

    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },

    // ==================== 工具方法 ====================
    getComponentById: (componentId, pageId) => {
      const state = get();
      const targetPageId = pageId || state.currentPageId;
      const page = state.document.pages.find(
        (p) => p.settings.id === targetPageId
      );
      return page?.components.find((c) => c.id === componentId);
    },

    getPageById: (pageId) => {
      return get().document.pages.find((p) => p.settings.id === pageId);
    },
  };
});

// 辅助函数：深度复制组件并重新生成ID
function duplicateComponentWithNewId(component: Component): Component {
  const newComponent = JSON.parse(JSON.stringify(component)) as Component;
  newComponent.id = uuidv4();

  // 如果是容器组件，递归处理子组件
  if (newComponent.type === 'frame' && newComponent.children) {
    newComponent.children = newComponent.children.map(() => uuidv4());
  }

  return newComponent;
}

// 初始化store时设置currentPageId
const initStore = () => {
  const state = useEditorStore.getState();
  if (state.document.pages.length > 0 && !state.currentPageId) {
    useEditorStore.setState({
      currentPageId: state.document.pages[0].settings.id,
    });
  }
};

// 执行初始化
if (typeof window !== 'undefined') {
  initStore();
}

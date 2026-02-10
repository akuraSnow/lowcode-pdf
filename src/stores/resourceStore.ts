import * as zustand from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

const create = (zustand as any).default || zustand;
import type {
  ImageResource,
  CSSResource,
  FunctionResource,
  Template,
  TemplateType,
} from '../types';

interface ResourceStore {
  // ==================== 图片资源 ====================
  images: ImageResource[];
  addImage: (image: Omit<ImageResource, 'id' | 'uploadedAt' | 'usageCount'>) => void;
  deleteImage: (imageId: string) => void;
  updateImage: (imageId: string, updates: Partial<ImageResource>) => void;
  getImageById: (imageId: string) => ImageResource | undefined;
  incrementImageUsage: (imageId: string) => void;

  // ==================== CSS资源 ====================
  cssResources: CSSResource[];
  addCSS: (css: Omit<CSSResource, 'id' | 'uploadedAt'>) => void;
  deleteCSS: (cssId: string) => void;
  updateCSS: (cssId: string, updates: Partial<CSSResource>) => void;
  getCSSById: (cssId: string) => CSSResource | undefined;
  toggleCSS: (cssId: string) => void;

  // ==================== JavaScript函数 ====================
  functions: FunctionResource[];
  addFunction: (func: Omit<FunctionResource, 'id' | 'usageCount'>) => void;
  deleteFunction: (funcId: string) => void;
  updateFunction: (funcId: string, updates: Partial<FunctionResource>) => void;
  getFunctionById: (funcId: string) => FunctionResource | undefined;
  incrementFunctionUsage: (funcId: string) => void;

  // ==================== 模板管理 ====================
  templates: Template[];
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void;
  deleteTemplate: (templateId: string) => void;
  updateTemplate: (templateId: string, updates: Partial<Template>) => void;
  getTemplateById: (templateId: string) => Template | undefined;
  getTemplatesByType: (type: TemplateType) => Template[];

  // ==================== 工具方法 ====================
  clearUnusedResources: () => void;
  exportResources: () => string;
  importResources: (jsonString: string) => boolean;
}

const immerSet = (fn: any) => (state: any) => produce(state, fn);

export const useResourceStore = create<ResourceStore>((set, get) => {
  const setState = (fn: any) => set(immerSet(fn));
  
  return {
    images: [],
    cssResources: [],
    functions: [],
    templates: [],

    // ==================== 图片资源 ====================
    addImage: (image) => {
      setState((state) => {
        state.images.push({
          ...image,
          id: uuidv4(),
          uploadedAt: new Date(),
          usageCount: 0,
        });
      });
    },

    deleteImage: (imageId) => {
      setState((state) => {
        state.images = state.images.filter((img) => img.id !== imageId);
      });
    },

    updateImage: (imageId, updates) => {
      setState((state) => {
        const image = state.images.find((img) => img.id === imageId);
        if (image) {
          Object.assign(image, updates);
        }
      });
    },

    getImageById: (imageId) => {
      return get().images.find((img) => img.id === imageId);
    },

    incrementImageUsage: (imageId) => {
      setState((state) => {
        const image = state.images.find((img) => img.id === imageId);
        if (image) {
          image.usageCount++;
        }
      });
    },

    // ==================== CSS资源 ====================
    addCSS: (css) => {
      setState((state) => {
        state.cssResources.push({
          ...css,
          id: uuidv4(),
          uploadedAt: new Date(),
        });
      });
    },

    deleteCSS: (cssId) => {
      setState((state) => {
        state.cssResources = state.cssResources.filter((css) => css.id !== cssId);
      });
    },

    updateCSS: (cssId, updates) => {
      setState((state) => {
        const css = state.cssResources.find((c) => c.id === cssId);
        if (css) {
          Object.assign(css, updates);
        }
      });
    },

    getCSSById: (cssId) => {
      return get().cssResources.find((css) => css.id === cssId);
    },

    toggleCSS: (cssId) => {
      setState((state) => {
        const css = state.cssResources.find((c) => c.id === cssId);
        if (css) {
          css.enabled = !css.enabled;
        }
      });
    },

    // ==================== JavaScript函数 ====================
    addFunction: (func) => {
      setState((state) => {
        state.functions.push({
          ...func,
          id: uuidv4(),
          usageCount: 0,
        });
      });
    },

    deleteFunction: (funcId) => {
      setState((state) => {
        state.functions = state.functions.filter((f) => f.id !== funcId);
      });
    },

    updateFunction: (funcId, updates) => {
      setState((state) => {
        const func = state.functions.find((f) => f.id === funcId);
        if (func) {
          Object.assign(func, updates);
        }
      });
    },

    getFunctionById: (funcId) => {
      return get().functions.find((f) => f.id === funcId);
    },

    incrementFunctionUsage: (funcId) => {
      setState((state) => {
        const func = state.functions.find((f) => f.id === funcId);
        if (func) {
          func.usageCount++;
        }
      });
    },

    // ==================== 模板管理 ====================
    addTemplate: (template) => {
      setState((state) => {
        state.templates.push({
          ...template,
          id: uuidv4(),
          createdAt: new Date(),
        });
      });
    },

    deleteTemplate: (templateId) => {
      setState((state) => {
        state.templates = state.templates.filter((t) => t.id !== templateId);
      });
    },

    updateTemplate: (templateId, updates) => {
      setState((state) => {
        const template = state.templates.find((t) => t.id === templateId);
        if (template) {
          Object.assign(template, updates);
        }
      });
    },

    getTemplateById: (templateId) => {
      return get().templates.find((t) => t.id === templateId);
    },

    getTemplatesByType: (type) => {
      return get().templates.filter((t) => t.type === type);
    },

    // ==================== 工具方法 ====================
    clearUnusedResources: () => {
      setState((state) => {
        // 清理未使用的图片
        state.images = state.images.filter((img) => img.usageCount > 0);

        // 清理未使用的函数
        state.functions = state.functions.filter((f) => f.usageCount > 0);
      });
    },

    exportResources: () => {
      const state = get();
      return JSON.stringify(
        {
          images: state.images,
          cssResources: state.cssResources,
          functions: state.functions,
          templates: state.templates,
        },
        null,
        2
      );
    },

    importResources: (jsonString) => {
      try {
        const data = JSON.parse(jsonString);
        setState((state) => {
          if (data.images) state.images = data.images;
          if (data.cssResources) state.cssResources = data.cssResources;
          if (data.functions) state.functions = data.functions;
          if (data.templates) state.templates = data.templates;
        });
        return true;
      } catch (error) {
        console.error('Failed to import resources:', error);
        return false;
      }
    },
  };
});

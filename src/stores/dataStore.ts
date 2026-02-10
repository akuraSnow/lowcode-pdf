import * as zustand from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

const create = (zustand as any).default || zustand;
import type {
  APIConfig,
  PageDataConfig,
  LifecycleConfig,
  LifecycleType,
  HttpMethod,
} from '../types';

interface DataStore {
  // ==================== 页面数据 ====================
  pageData: Record<string, any>;
  setPageData: (data: Record<string, any>) => void;
  updatePageData: (path: string, value: any) => void;
  getPageDataByPath: (path: string) => any;

  // ==================== API配置 ====================
  apis: Record<string, APIConfig>;
  addAPI: (api: Omit<APIConfig, 'id'>) => string;
  deleteAPI: (apiId: string) => void;
  updateAPI: (apiId: string, updates: Partial<APIConfig>) => void;
  getAPIById: (apiId: string) => APIConfig | undefined;
  testAPI: (apiId: string) => Promise<any>;
  executeAPI: (apiId: string) => Promise<any>;

  // ==================== 生命周期配置 ====================
  lifecycles: Record<LifecycleType, LifecycleConfig>;
  updateLifecycle: (type: LifecycleType, config: LifecycleConfig) => void;
  getLifecycle: (type: LifecycleType) => LifecycleConfig;
  executeLifecycle: (type: LifecycleType) => Promise<void>;

  // ==================== 页面数据配置 ====================
  getPageDataConfig: () => PageDataConfig;
  setPageDataConfig: (config: PageDataConfig) => void;

  // ==================== 工具方法 ====================
  clearPageData: () => void;
  exportDataConfig: () => string;
  importDataConfig: (jsonString: string) => boolean;
}

// 默认生命周期配置
const createDefaultLifecycles = (): Record<LifecycleType, LifecycleConfig> => ({
  onLoad: { type: 'code', code: '', apiIds: [] },
  onBeforeMount: { type: 'code', code: '', apiIds: [] },
  onMounted: { type: 'code', code: '', apiIds: [] },
  onBeforeUnmount: { type: 'code', code: '', apiIds: [] },
  onUnmounted: { type: 'code', code: '', apiIds: [] },
});

const immerSet = (fn: any) => (state: any) => produce(state, fn);

export const useDataStore = create<DataStore>((set, get) => {
  const setState = (fn: any) => set(immerSet(fn));
  
  return {
    pageData: {},
    apis: {},
    lifecycles: createDefaultLifecycles(),

    // ==================== 页面数据 ====================
    setPageData: (data) => {
      setState((state) => {
        state.pageData = data;
      });
    },

    updatePageData: (path, value) => {
      setState((state) => {
        const keys = path.split('.');
        let current: any = state.pageData;

        // 遍历路径创建嵌套对象
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
          }
          current = current[key];
        }

        // 设置最终值
        current[keys[keys.length - 1]] = value;
      });
    },

    getPageDataByPath: (path) => {
      const state = get();
      const keys = path.split('.');
      let current: any = state.pageData;

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
    },

    // ==================== API配置 ====================
    addAPI: (api) => {
      const id = uuidv4();
      setState((state) => {
        state.apis[id] = { ...api, id };
      });
      return id;
    },

    deleteAPI: (apiId) => {
      setState((state) => {
        delete state.apis[apiId];
      });
    },

    updateAPI: (apiId, updates) => {
      setState((state) => {
        const api = state.apis[apiId];
        if (api) {
          Object.assign(api, updates);
        }
      });
    },

    getAPIById: (apiId) => {
      return get().apis[apiId];
    },

    testAPI: async (apiId) => {
      const api = get().getAPIById(apiId);
      if (!api) {
        throw new Error(`API ${apiId} not found`);
      }

      return get().executeAPI(apiId);
    },

    executeAPI: async (apiId) => {
      const api = get().getAPIById(apiId);
      if (!api) {
        throw new Error(`API ${apiId} not found`);
      }

      try {
        // 构建请求URL
        let url = api.url;
        if (api.params && Object.keys(api.params).length > 0) {
          const params = new URLSearchParams(api.params).toString();
          url = `${url}?${params}`;
        }

        // 构建请求选项
        const options: RequestInit = {
          method: api.method,
          headers: {
            'Content-Type': 'application/json',
            ...api.headers,
          },
        };

        // 添加请求体
        if (api.body && (api.method === 'POST' || api.method === 'PUT')) {
          options.body = JSON.stringify(api.body);
        }

        // 发送请求
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        let data = await response.json();

        // 数据转换
        if (api.transform) {
          try {
            const transformFunc = new Function('response', api.transform);
            data = transformFunc(data);
          } catch (error) {
            console.error('Transform function error:', error);
          }
        }

        // 存储数据
        if (api.dataKey) {
          get().updatePageData(api.dataKey, data);
        }

        return data;
      } catch (error) {
        console.error('API execution error:', error);
        throw error;
      }
    },

    // ==================== 生命周期配置 ====================
    updateLifecycle: (type, config) => {
      setState((state) => {
        state.lifecycles[type] = config;
      });
    },

    getLifecycle: (type) => {
      return get().lifecycles[type];
    },

    executeLifecycle: async (type) => {
      const lifecycle = get().getLifecycle(type);

      if (lifecycle.type === 'code' && lifecycle.code) {
        try {
          // 执行自定义代码
          const func = new Function('pageData', 'updatePageData', lifecycle.code);
          func(get().pageData, get().updatePageData);
        } catch (error) {
          console.error(`Lifecycle ${type} code execution error:`, error);
        }
      } else if (lifecycle.type === 'api' && lifecycle.apiIds) {
        // 按顺序执行API
        for (const apiId of lifecycle.apiIds) {
          try {
            await get().executeAPI(apiId);
          } catch (error) {
            console.error(`Lifecycle ${type} API ${apiId} execution error:`, error);
          }
        }
      }
    },

    // ==================== 页面数据配置 ====================
    getPageDataConfig: () => {
      const state = get();
      return {
        apis: Object.values(state.apis),
        lifecycles: state.lifecycles,
        initialData: state.pageData,
      };
    },

    setPageDataConfig: (config) => {
      setState((state) => {
        // 转换API数组为对象
        state.apis = {};
        config.apis.forEach((api) => {
          state.apis[api.id] = api;
        });

        state.lifecycles = config.lifecycles;
        state.pageData = config.initialData;
      });
    },

    // ==================== 工具方法 ====================
    clearPageData: () => {
      setState((state) => {
        state.pageData = {};
      });
    },

    exportDataConfig: () => {
      const config = get().getPageDataConfig();
      return JSON.stringify(config, null, 2);
    },

    importDataConfig: (jsonString) => {
      try {
        const config = JSON.parse(jsonString);
        get().setPageDataConfig(config);
        return true;
      } catch (error) {
        console.error('Failed to import data config:', error);
        return false;
      }
    },
  };
});

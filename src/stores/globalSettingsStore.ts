/**
 * 全局设置Store - 使用Zustand管理全局路径配置
 */

import create from 'zustand';
import { persist } from 'zustand/middleware';
import type { GlobalSettings, GlobalPathSettings } from '../types/settings';

interface GlobalSettingsState {
  settings: GlobalSettings;
  updatePaths: (paths: Partial<GlobalPathSettings>) => void;
  resetToDefaults: () => void;
}

// 默认路径配置
const DEFAULT_PATHS: GlobalPathSettings = {
  productPath: './data/products',
  templatePath: './data/templates',
  methodPath: './data/methods',
  filePath: './data/files',
  initialJsonPath: '',
};

const DEFAULT_SETTINGS: GlobalSettings = {
  paths: DEFAULT_PATHS,
  updatedAt: new Date().toISOString(),
};

export const useGlobalSettingsStore = create<GlobalSettingsState>(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updatePaths: (paths: Partial<GlobalPathSettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            paths: {
              ...state.settings.paths,
              ...paths,
            },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      resetToDefaults: () => {
        set({
          settings: {
            paths: DEFAULT_PATHS,
            updatedAt: new Date().toISOString(),
          },
        });
      },
    }),
    {
      name: 'global-settings-storage',
    }
  )
);

/**
 * 全局路径设置类型定义
 */

export interface GlobalPathSettings {
  /** 产品JSON保存路径 */
  productPath: string;
  /** 模板保存路径 */
  templatePath: string;
  /** 方法/组件保存路径 */
  methodPath: string;
  /** 通用文件保存路径 */
  filePath: string;
}

export interface GlobalSettings {
  /** 路径配置 */
  paths: GlobalPathSettings;
  /** 上次更新时间 */
  updatedAt: string;
}

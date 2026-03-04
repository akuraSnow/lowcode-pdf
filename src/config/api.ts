/**
 * API 配置
 * 统一管理所有 API 端点配置
 */

// 判断是否在开发环境
const isDevelopment = process.env.NODE_ENV === 'development';

// 后端服务端口配置
export const API_PORT = 8080;

// API 基础地址
// 开发环境使用相对路径（通过 webpack devServer proxy 代理到后端）
// 生产环境使用环境变量或默认地址
export const API_BASE_URL = isDevelopment 
  ? '/api'  // 开发环境使用代理路径
  : (process.env.API_URL || `http://localhost:${API_PORT}/api`);

/**
 * API 端点定义
 */
export const API_ENDPOINTS = {
  // 发布相关
  publish: `${API_BASE_URL}/publish`,
  
  // 产品相关
  products: `${API_BASE_URL}/products`,
  fixProducts: `${API_BASE_URL}/fix-products`,
  
  // 模板相关
  templates: `${API_BASE_URL}/templates`,
  templateById: (id: string) => `${API_BASE_URL}/templates/${id}`,
  
  // 存储相关
  storageSave: `${API_BASE_URL}/storage/save`,
  storageBatchSave: `${API_BASE_URL}/storage/batch-save`,
  storageLoad: `${API_BASE_URL}/storage/load`,
  storageList: `${API_BASE_URL}/storage/list`,
  storageDelete: `${API_BASE_URL}/storage/delete`,
  
  // 健康检查
  health: `${API_BASE_URL}/health`,
};

/**
 * 构建带查询参数的 URL
 */
export function buildApiUrl(endpoint: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return `${endpoint}?${queryString}`;
}

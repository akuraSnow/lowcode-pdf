/**
 * 产品相关类型定义
 */

export interface Product {
  /** 产品ID */
  id: string;
  /** 产品名称 */
  name: string;
  /** 产品描述 */
  description?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 低代码平台schema数据 */
  schema?: any;
  /** 缩略图 */
  thumbnail?: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
}

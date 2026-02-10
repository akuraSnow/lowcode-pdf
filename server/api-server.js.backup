/**
 * 后端API示例 - 保存JSON到文件系统
 * 
 * 这是一个Node.js Express后端API示例
 * 需要单独运行在后端服务器上
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// 默认保存路径配置
const DEFAULT_SAVE_PATH = process.env.SAVE_PATH || path.join(__dirname, '../data');

// 确保默认保存目录存在
if (!fs.existsSync(DEFAULT_SAVE_PATH)) {
  fs.mkdirSync(DEFAULT_SAVE_PATH, { recursive: true });
  console.log(`✅ 创建默认保存目录: ${DEFAULT_SAVE_PATH}`);
}

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json({ limit: '50mb' })); // 解析JSON body

/**
 * 验证文件路径安全性
 */
function validatePath(filePath) {
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    throw new Error('不允许的文件路径 (包含 ..)');
  }
  return normalizedPath;
}

/**
 * 发布接口 - 保存schema到指定路径
 * POST /api/publish
 * 
 * 请求体:
 * {
 *   path: string,          // 保存路径
 *   schema: object,        // 低代码schema
 *   productId: string,     // 产品ID
 *   productName: string    // 产品名称
 * }
 */
app.post('/api/publish', async (req, res) => {
  try {
    const { path: savePath, schema, productId, productName } = req.body;
    
    if (!savePath || !schema) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: path 或 schema',
      });
    }
    
    // 确保路径是安全的（防止路径遍历攻击）
    const normalizedPath = path.normalize(savePath);
    if (normalizedPath.includes('..')) {
      return res.status(400).json({
        success: false,
        message: '不允许的文件路径',
      });
    }
    
    // 确保目录存在
    const directory = path.dirname(normalizedPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // 将schema转换为JSON字符串
    const jsonContent = JSON.stringify(schema, null, 2);
    
    // 写入文件
    fs.writeFileSync(normalizedPath, jsonContent, 'utf8');
    
    console.log(`[发布成功] 产品: ${productName} (${productId})`);
    console.log(`[保存路径] ${normalizedPath}`);
    console.log(`[文件大小] ${(jsonContent.length / 1024).toFixed(2)} KB`);
    
    res.json({
      success: true,
      message: '发布成功',
      data: {
        path: normalizedPath,
        size: jsonContent.length,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('[发布失败]', error);
    res.status(500).json({
      success: false,
      message: `发布失败: ${error.message}`,
    });
  }
});

/**
 * 保存浏览器数据库数据到本地文件系统
 * POST /api/storage/save
 * 
 * 请求体:
 * {
 *   type: 'projectSchema' | 'products' | 'templates',  // 数据类型
 *   key: string,          // 数据键名
 *   data: any,            // 要保存的数据
 *   customPath?: string   // 自定义保存路径(可选)
 * }
 */
app.post('/api/storage/save', async (req, res) => {
  try {
    const { type, key, data, customPath } = req.body;
    
    if (!type || !key || data === undefined) {
      return res� 默认保存路径: ${DEFAULT_SAVE_PATH}`);
  console.log(`🔗 发布接口: http://localhost:${PORT}/api/publish`);
  console.log(`💾 存储接口: http://localhost:${PORT}/api/storage/*`);
  console.log(`💚 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
  console.log(`\n可用的存储API:`);
  console.log(`  POST   /api/storage/save        - 保存单个数据`);
  console.log(`  POST   /api/storage/batch-save  - 批量保存数据`);
  console.log(`  GET    /api/storage/load        - 加载数据`);
  console.log(`  GET    /api/storage/list        - 列出数据`);
  console.log(`  DELETE /api/storage/delete      - 删除数据`);
  console.log(`========================================\n`);
});

/**
 * 使用方法:
 * 
 * 1. 安装依赖:
 *    npm install express cors
 * 
 * 2. 启动服务 (可选设置保存路径):
 *    node server/api-server.js
 *    或
 *    SAVE_PATH=/your/custom/path node server/api-server.js
 * 
 * 3. API使用示例:
 * 
 *    # 保存单个数据
 *    curl -X POST http://localhost:3001/api/storage/save \
 *      -H "Content-Type: application/json" \
 *      -d '{"type":"projectSchema","key":"general:projectSchema","data":{"version":"1.0"}}'
 * 
 *    # 批量保存数据
 *    curl -X POST http://localhost:3001/api/storage/batch-save \
 *      -H "Content-Type: application/json" \
 *      -d '{"items":[{"type":"products","key":"product1","data":{}}]}'
 * 
 *    # 加载数据
 *    curl "http://localhost:3001/api/storage/load?type=projectSchema&key=general:projectSchema"
 * 
 *    # 列出数据
 *    curl "http://localhost:3001/api/storage/list?type=products"
 * 
 *    # 删除数据
 *    curl -X DELETE http://localhost:3001/api/storage/delete \
 *      -H "Content-Type: application/json" \
 *      -d '{"type":"projectSchema","key":"general:projectSchema"}'
    // 确定保存路径
    const basePath = customPath || DEFAULT_SAVE_PATH;
    const typeFolder = path.join(basePath, type);
    
    // 确保目录存在
    if (!fs.existsSync(typeFolder)) {
      fs.mkdirSync(typeFolder, { recursive: true });
    }
    
    // 生成文件名（使用key作为文件名）
    const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `${sanitizedKey}.json`;
    const filePath = validatePath(path.join(typeFolder, fileName));
    
    // 将数据转换为JSON字符串
    const jsonContent = JSON.stringify(data, null, 2);
    
    // 写入文件
    fs.writeFileSync(filePath, jsonContent, 'utf8');
    
    console.log(`[保存成功] 类型: ${type}, 键: ${key}`);
    console.log(`[保存路径] ${filePath}`);
    console.log(`[文件大小] ${(jsonContent.length / 1024).toFixed(2)} KB`);
    
    res.json({
      success: true,
      message: '数据保存成功',
      data: {
        type,
        key,
        path: filePath,
        size: jsonContent.length,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('[保存失败]', error);
    res.status(500).json({
      success: false,
      message: `保存失败: ${error.message}`,
    });
  }
});

/**
 * 批量保存浏览器数据库数据
 * POST /api/storage/batch-save
 * 
 * 请求体:
 * {
 *   items: Array<{
 *     type: 'projectSchema' | 'products' | 'templates',
 *     key: string,
 *     data: any
 *   }>,
 *   customPath?: string
 * }
 */
app.post('/api/storage/batch-save', async (req, res) => {
  try {
    const { items, customPath } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: items (数组)',
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const item of items) {
      try {
        const { type, key, data } = item;
        
        if (!type || !key || data === undefined) {
          errors.push({
            item,
            error: '缺少必要字段',
          });
          continue;
        }
        
        // 确定保存路径
        const basePath = customPath || DEFAULT_SAVE_PATH;
        const typeFolder = path.join(basePath, type);
        
        // 确保目录存在
        if (!fs.existsSync(typeFolder)) {
          fs.mkdirSync(typeFolder, { recursive: true });
        }
        
        // 生成文件名
        const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
        const fileName = `${sanitizedKey}.json`;
        const filePath = validatePath(path.join(typeFolder, fileName));
        
        // 将数据转换为JSON字符串
        const jsonContent = JSON.stringify(data, null, 2);
        
        // 写入文件
        fs.writeFileSync(filePath, jsonContent, 'utf8');
        
        results.push({
          type,
          key,
          path: filePath,
          size: jsonContent.length,
          success: true,
        });
        
        console.log(`[批量保存] 成功 - ${type}/${key}`);
        
      } catch (itemError) {
        errors.push({
          item,
          error: itemError.message,
        });
        console.error(`[批量保存] 失败 - ${item.type}/${item.key}:`, itemError);
      }
    }
    
    res.json({
      success: true,
      message: `批量保存完成: 成功 ${results.length} 项, 失败 ${errors.length} 项`,
      data: {
        results,
        errors,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('[批量保存失败]', error);
    res.status(500).json({
      success: false,
      message: `批量保存失败: ${error.message}`,
    });
  }
});

/**
 * 读取保存的数据
 * GET /api/storage/load?type=xxx&key=xxx
 */
app.get('/api/storage/load', async (req, res) => {
  try {
    const { type, key, customPath } = req.query;
    
    if (!type || !key) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: type 或 key',
      });
    }
    
    // 确定文件路径
    const basePath = customPath || DEFAULT_SAVE_PATH;
    const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `${sanitizedKey}.json`;
    const filePath = validatePath(path.join(basePath, type, fileName));
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '数据不存在',
      });
    }
    
    // 读取文件
    const jsonContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(jsonContent);
    
    res.json({
      success: true,
      message: '数据加载成功',
      data,
    });
    
  } catch (error) {
    console.error('[加载失败]', error);
    res.status(500).json({
      success: false,
      message: `加载失败: ${error.message}`,
    });
  }
});

/**
 * 列出指定类型的所有保存数据
 * GET /api/storage/list?type=xxx
 */
app.get('/api/storage/list', async (req, res) => {
  try {
    const { type, customPath } = req.query;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: type',
      });
    }
    
    // 确定目录路径
    const basePath = customPath || DEFAULT_SAVE_PATH;
    const typeFolder = path.join(basePath, type);
    
    // 检查目录是否存在
    if (!fs.existsSync(typeFolder)) {
      return res.json({
        success: true,
        message: '目录不存在或为空',
        data: [],
      });
    }
    
    // 读取目录下的所有JSON文件
    const files = fs.readdirSync(typeFolder)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(typeFolder, file);
        const stats = fs.statSync(filePath);
        return {
          key: file.replace('.json', ''),
          fileName: file,
          path: filePath,
          size: stats.size,
          modifiedTime: stats.mtime,
        };
      });
    
    res.json({
      success: true,
      message: `找到 ${files.length} 个文件`,
      data: files,
    });
    
  } catch (error) {
    console.error('[列表失败]', error);
    res.status(500).json({
      success: false,
      message: `列表失败: ${error.message}`,
    });
  }
});

/**
 * 删除保存的数据
 * DELETE /api/storage/delete
 * 
 * 请求体:
 * {
 *   type: string,
 *   key: string,
 *   customPath?: string
 * }
 */
app.delete('/api/storage/delete', async (req, res) => {
  try {
    const { type, key, customPath } = req.body;
    
    if (!type || !key) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: type 或 key',
      });
    }
    
    // 确定文件路径
    const basePath = customPath || DEFAULT_SAVE_PATH;
    const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `${sanitizedKey}.json`;
    const filePath = validatePath(path.join(basePath, type, fileName));
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '数据不存在',
      });
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    console.log(`[删除成功] ${type}/${key}`);
    
    res.json({
      success: true,
      message: '数据删除成功',
      data: {
        type,
        key,
        path: filePath,
      },
    });
    
  } catch (error) {
    console.error('[删除失败]', error);
    res.status(500).json({
      success: false,
      message: `删除失败: ${error.message}`,
    });
  }
});

/**
 * 健康检查接口
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    savePath: DEFAULT_SAVE_PATH,
    timestamp: new Date().toISOString(),
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 后端API服务已启动`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`🔗 发布接口: http://localhost:${PORT}/api/publish`);
  console.log(`💚 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});

/**
 * 使用方法:
 * 
 * 1. 安装依赖:
 *    npm install express cors
 * 
 * 2. 启动服务:
 *    node server/api-server.js
 * 
 * 3. 在前端发布时会自动调用此接口
 */

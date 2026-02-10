/**
 * 后端API服务 - 数据同步与发布
 * 
 * 功能:
 * 1. 发布低代码schema到文件系统
 * 2. 浏览器数据库数据同步到本地文件
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
  console.log(`创建默认保存目录: ${DEFAULT_SAVE_PATH}`);
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
    
    const normalizedPath = path.normalize(savePath);
    if (normalizedPath.includes('..')) {
      return res.status(400).json({
        success: false,
        message: '不允许的文件路径',
      });
    }
    
    const directory = path.dirname(normalizedPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    const jsonContent = JSON.stringify(schema, null, 2);
    fs.writeFileSync(normalizedPath, jsonContent, 'utf8');
    
    console.log(`[发布成功] 产品: ${productName} (${productId})`);
    console.log(`[保存路径] ${normalizedPath}`);
    
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
 */
app.post('/api/storage/save', async (req, res) => {
  try {
    const { type, key, data, customPath } = req.body;
    
    if (!type || !key || data === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: type, key 或 data',
      });
    }
    
    const validTypes = ['projectSchema', 'products', 'templates'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `无效的数据类型，必须是: ${validTypes.join(', ')}`,
      });
    }
    
    const basePath = customPath || DEFAULT_SAVE_PATH;
    const typeFolder = path.join(basePath, type);
    
    if (!fs.existsSync(typeFolder)) {
      fs.mkdirSync(typeFolder, { recursive: true });
    }
    
    const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `${sanitizedKey}.json`;
    const filePath = validatePath(path.join(typeFolder, fileName));
    
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf8');
    
    console.log(`[保存成功] 类型: ${type}, 键: ${key}`);
    console.log(`[保存路径] ${filePath}`);
    
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
        
        const basePath = customPath || DEFAULT_SAVE_PATH;
        const typeFolder = path.join(basePath, type);
        
        if (!fs.existsSync(typeFolder)) {
          fs.mkdirSync(typeFolder, { recursive: true });
        }
        
        const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
        const fileName = `${sanitizedKey}.json`;
        const filePath = validatePath(path.join(typeFolder, fileName));
        
        const jsonContent = JSON.stringify(data, null, 2);
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
 * GET /api/storage/load
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
    
    const basePath = customPath || DEFAULT_SAVE_PATH;
    const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `${sanitizedKey}.json`;
    const filePath = validatePath(path.join(basePath, type, fileName));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '数据不存在',
      });
    }
    
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
 * GET /api/storage/list
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
    
    const basePath = customPath || DEFAULT_SAVE_PATH;
    const typeFolder = path.join(basePath, type);
    
    if (!fs.existsSync(typeFolder)) {
      return res.json({
        success: true,
        message: '目录不存在或为空',
        data: [],
      });
    }
    
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
    
    const basePath = customPath || DEFAULT_SAVE_PATH;
    const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `${sanitizedKey}.json`;
    const filePath = validatePath(path.join(basePath, type, fileName));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '数据不存在',
      });
    }
    
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
  console.log(`后端API服务已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`默认保存路径: ${DEFAULT_SAVE_PATH}`);
  console.log(`发布接口: http://localhost:${PORT}/api/publish`);
  console.log(`存储接口: http://localhost:${PORT}/api/storage/*`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
  console.log(`\n可用的存储API:`);
  console.log(`  POST   /api/storage/save        - 保存单个数据`);
  console.log(`  POST   /api/storage/batch-save  - 批量保存数据`);
  console.log(`  GET    /api/storage/load        - 加载数据`);
  console.log(`  GET    /api/storage/list        - 列出数据`);
  console.log(`  DELETE /api/storage/delete      - 删除数据`);
  console.log(`========================================\n`);
});

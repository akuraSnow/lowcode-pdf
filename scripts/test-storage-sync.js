/**
 * 数据同步服务测试脚本
 * 
 * 用法: node scripts/test-storage-sync.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试用例
const tests = [
  {
    name: '健康检查',
    async run() {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const result = await response.json();
      if (!result.success) throw new Error('健康检查失败');
      log(`  ✓ 服务器响应正常`, 'green');
      log(`  ✓ 保存路径: ${result.savePath}`, 'blue');
      return result;
    },
  },
  {
    name: '保存测试数据',
    async run() {
      const testData = {
        type: 'projectSchema',
        key: 'test_schema',
        data: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          testField: 'This is a test',
        },
      };

      const response = await fetch(`${API_BASE_URL}/api/storage/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      log(`  ✓ 数据保存成功`, 'green');
      log(`  ✓ 文件路径: ${result.data.path}`, 'blue');
      log(`  ✓ 文件大小: ${(result.data.size / 1024).toFixed(2)} KB`, 'blue');
      return result;
    },
  },
  {
    name: '读取测试数据',
    async run() {
      const response = await fetch(
        `${API_BASE_URL}/api/storage/load?type=projectSchema&key=test_schema`
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      log(`  ✓ 数据读取成功`, 'green');
      log(`  ✓ 数据内容: ${JSON.stringify(result.data)}`, 'blue');
      return result;
    },
  },
  {
    name: '批量保存测试',
    async run() {
      const batchData = {
        items: [
          {
            type: 'products',
            key: 'test_product_1',
            data: { name: 'Product 1', price: 100 },
          },
          {
            type: 'products',
            key: 'test_product_2',
            data: { name: 'Product 2', price: 200 },
          },
          {
            type: 'templates',
            key: 'test_template_1',
            data: { name: 'Template 1', content: 'Test content' },
          },
        ],
      };

      const response = await fetch(`${API_BASE_URL}/api/storage/batch-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      log(`  ✓ 批量保存成功`, 'green');
      log(`  ✓ 成功: ${result.data.results.length} 项`, 'blue');
      log(`  ✓ 失败: ${result.data.errors.length} 项`, 'blue');
      return result;
    },
  },
  {
    name: '列出数据',
    async run() {
      const types = ['projectSchema', 'products', 'templates'];
      const results = {};

      for (const type of types) {
        const response = await fetch(
          `${API_BASE_URL}/api/storage/list?type=${type}`
        );
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        results[type] = result.data.length;
      }

      log(`  ✓ 列表获取成功`, 'green');
      log(`  ✓ projectSchema: ${results.projectSchema} 项`, 'blue');
      log(`  ✓ products: ${results.products} 项`, 'blue');
      log(`  ✓ templates: ${results.templates} 项`, 'blue');
      return results;
    },
  },
  {
    name: '删除测试数据',
    async run() {
      const deleteItems = [
        { type: 'projectSchema', key: 'test_schema' },
        { type: 'products', key: 'test_product_1' },
        { type: 'products', key: 'test_product_2' },
        { type: 'templates', key: 'test_template_1' },
      ];

      let successCount = 0;
      for (const item of deleteItems) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/storage/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          const result = await response.json();
          if (result.success) successCount++;
        } catch (error) {
          // 忽略删除失败
        }
      }

      log(`  ✓ 测试数据清理完成`, 'green');
      log(`  ✓ 成功删除: ${successCount} 项`, 'blue');
      return { deleted: successCount };
    },
  },
];

// 运行测试
async function runTests() {
  log('\n========================================', 'blue');
  log('  数据同步服务测试', 'blue');
  log('========================================\n', 'blue');

  log(`测试目标: ${API_BASE_URL}\n`, 'yellow');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      log(`[测试] ${test.name}`, 'yellow');
      await test.run();
      passed++;
      log('');
    } catch (error) {
      failed++;
      log(`  ✗ 失败: ${error.message}`, 'red');
      log('');
    }
  }

  log('========================================', 'blue');
  log('测试结果汇总:', 'blue');
  log(`  ✓ 通过: ${passed} 项`, 'green');
  if (failed > 0) {
    log(`  ✗ 失败: ${failed} 项`, 'red');
  }
  log('========================================\n', 'blue');

  if (failed > 0) {
    log('⚠️  部分测试失败，请检查服务器状态和配置', 'yellow');
    log('提示: 确保服务器已启动 (npm run storage-sync)\n', 'yellow');
    process.exit(1);
  } else {
    log('✅ 所有测试通过！数据同步服务运行正常\n', 'green');
    process.exit(0);
  }
}

// 主函数
(async function main() {
  try {
    await runTests();
  } catch (error) {
    log(`\n✗ 测试运行失败: ${error.message}`, 'red');
    log('提示: 请确保服务器已启动 (npm run storage-sync)\n', 'yellow');
    process.exit(1);
  }
})();

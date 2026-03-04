const fs = require('fs-extra');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

module.exports = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig((config) => {
    config.resolve.plugin('tsconfigpaths').use(TsconfigPathsPlugin, [
      {
        configFile: './tsconfig.json',
      },
    ]);

    config.merge({
      node: {
        fs: 'empty',
      },
    });

    const path = require('path');
    const webpack = require('webpack');
    const reactPath = path.dirname(require.resolve('react/package.json'));
    const reactDomPath = path.dirname(require.resolve('react-dom/package.json'));
    
    // 确保使用单一的 React 实例，解决多实例冲突
    config.resolve.alias
      .set('react', reactPath)
      .set('react-dom', reactDomPath)
      .set('react/jsx-runtime', path.join(reactPath, 'jsx-runtime.js'))
      .set('react/jsx-dev-runtime', path.join(reactPath, 'jsx-dev-runtime.js'))
      .set('scheduler', require.resolve('scheduler'));

    // 使用 NormalModuleReplacementPlugin 确保所有 react 引用都指向同一个实例
    config.plugin('normalModuleReplacement')
      .use(webpack.NormalModuleReplacementPlugin, [
        /^react$/,
        reactPath
      ]);
    
    config.plugin('normalModuleReplacementReactDom')
      .use(webpack.NormalModuleReplacementPlugin, [
        /^react-dom$/,
        reactDomPath
      ]);

    // 根路径 - 显示产品主页
    config
    .plugin('index')
    .use(HtmlWebpackPlugin, [
      {
        inject: true,
        template: require.resolve('./public/index.html'),
        filename: 'index.html',
        chunks: ['home'],
      },
    ]);
    
    // 产品主页
    config
      .plugin('home')
      .use(HtmlWebpackPlugin, [
        {
          inject: true,
          template: require.resolve('./public/home.html'),
          filename: 'home.html',
          chunks: ['home'],
        },
      ]);
    
    // 编辑器页面 - 使用/edit路径
    config
      .plugin('edit')
      .use(HtmlWebpackPlugin, [
        {
          inject: false,
          minify: false,
          templateParameters: {
            version,
          },
          template: require.resolve('./public/index.ejs'),
          filename: 'edit.html',
        },
      ]);
    
    // 保留editor.html以兼容旧链接
    config
      .plugin('editor')
      .use(HtmlWebpackPlugin, [
        {
          inject: false,
          minify: false,
          templateParameters: {
            version,
          },
          template: require.resolve('./public/index.ejs'),
          filename: 'editor.html',
        },
      ]);
    
    config
      .plugin('preview')
      .use(HtmlWebpackPlugin, [
        {
          inject: false,
          templateParameters: {
          },
          template: require.resolve('./public/preview.html'),
          filename: 'preview.html',
        },
      ]);

    config.plugins.delete('hot');
    config.devServer.hot(false);

    // 配置开发服务器代理 - 将前端 /api 请求代理到后端 API 服务器
    config.devServer.proxy({
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
          console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:8080${req.url}`);
        },
        onError: (err, req, res) => {
          console.error('[Proxy Error]', err.message);
        },
      },
    });

    config.module // fixes https://github.com/graphql/graphql-js/issues/1272
      .rule('mjs$')
      .test(/\.mjs$/)
      .include
        .add(/node_modules/)
        .end()
      .type('javascript/auto');

    // Configure SCSS to suppress deprecation warnings
    const sassLoader = config.module.rule('scss').use('sass-loader');
    if (sassLoader) {
      sassLoader.options({
        sassOptions: {
          quietDeps: true, // Suppress warnings from node_modules
          silenceDeprecations: ['legacy-js-api'], // Silence specific deprecations
        },
      });
    }
  });
};

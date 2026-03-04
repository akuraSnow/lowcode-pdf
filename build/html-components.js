/**
 * HTML Components Library for Lowcode Simulator
 * 原生 HTML 表格元素的 React 包装组件
 */
(function (global) {
  'use strict';

  // 确保 React 可用
  if (!global.React) {
    console.error('[HTML Components] React is not available in window');
    return;
  }

  const React = global.React;

  // 创建原生 HTML 元素的 React 包装组件
  const HtmlComponents = {
    table: function (props) {
      return React.createElement('table', props);
    },
    thead: function (props) {
      return React.createElement('thead', props);
    },
    tbody: function (props) {
      return React.createElement('tbody', props);
    },
    tfoot: function (props) {
      return React.createElement('tfoot', props);
    },
    tr: function (props) {
      return React.createElement('tr', props);
    },
    td: function (props) {
      return React.createElement('td', props);
    },
    th: function (props) {
      return React.createElement('th', props);
    },
  };

  // 挂载到全局
  global.HtmlComponents = HtmlComponents;

  console.log('[HTML Components] ✓ 已加载到 window.HtmlComponents', {
    isSimulator: global !== global.parent,
    components: Object.keys(HtmlComponents)
  });
})(typeof window !== 'undefined' ? window : this);

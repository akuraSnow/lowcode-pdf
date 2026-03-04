import React from 'react';
import { IPublicModelPluginContext } from "@alilc/lowcode-types";

/**
 * 原生 HTML Table 组件插件
 * 通过 loadIncrementalAssets 注册到 simulator 画布
 */

// 创建原生 HTML 元素的 React 包装组件
const HtmlComponents = {
  table: (props: any) => React.createElement('table', props),
  thead: (props: any) => React.createElement('thead', props),
  tbody: (props: any) => React.createElement('tbody', props),
  tfoot: (props: any) => React.createElement('tfoot', props),
  tr: (props: any) => React.createElement('tr', props),
  td: (props: any) => React.createElement('td', props),
  th: (props: any) => React.createElement('th', props),
};

// 挂载到全局 window（主窗口和 simulator 都需要）
(window as any).HtmlComponents = HtmlComponents;

console.log('[HTML Table Plugin] ✓ 原生 HTML Table 组件已挂载到 window.HtmlComponents');

const htmlTablePlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      const { material, project } = ctx;
      
      // 使用 loadIncrementalAssets 注册到 simulator
      await material.loadIncrementalAssets({
        version: '1.0.0',
        packages: [{
          package: 'html-components',
          version: '1.0.0',
          library: 'HtmlComponents',
          urls: ['/html-components.js'],
          editUrls: ['/html-components.js'],
        }],
        components: [
          {
            componentName: 'table',
            title: 'HTML Table',
            npm: {
              package: 'html-components',
              version: '1.0.0',
              exportName: 'table',
              destructuring: true,
            },
            snippets: [
              {
                title: 'HTML Table',
                schema: {
                  componentName: 'table',
                  props: {
                    style: {
                      border: 'none',
                      borderCollapse: 'collapse',
                    },
                  },
                },
              },
            ],
            configure: {
              props: [
                {
                  name: 'className',
                  title: '类名',
                  propType: 'string',
                  setter: 'StringSetter',
                },
                {
                  name: 'style',
                  title: '样式',
                  propType: 'object',
                  setter: 'StyleSetter',
                },
                {
                  name: 'border',
                  title: '边框',
                  propType: 'string',
                  setter: 'NumberSetter',
                },
                {
                  name: 'cellPadding',
                  title: '单元格内边距',
                  propType: 'string',
                  setter: 'NumberSetter',
                },
                {
                  name: 'cellSpacing',
                  title: '单元格间距',
                  propType: 'string',
                  setter: 'NumberSetter',
                },
                {
                  name: 'width',
                  title: '宽度',
                  propType: 'string',
                  setter: 'StringSetter',
                },
              ],
              supports: {
                style: true,
                events: [
                  {
                    name: 'onClick',
                    title: '点击事件',
                  },
                  {
                    name: 'onMouseEnter',
                    title: '鼠标进入',
                  },
                  {
                    name: 'onMouseLeave',
                    title: '鼠标离开',
                  },
                ],
              },
              component: {
                isContainer: true,
              },
            },
          },
          {
            componentName: 'thead',
            title: 'HTML THead',
            npm: {
              package: 'html-components',
              version: '1.0.0',
              exportName: 'thead',
              destructuring: true,
            },
            configure: {
              props: [
                {
                  name: 'className',
                  title: '类名',
                  propType: 'string',
                  setter: 'StringSetter',
                },
                {
                  name: 'style',
                  title: '样式',
                  propType: 'object',
                  setter: 'StyleSetter',
                },
              ],
              supports: {
                style: true,
                events: [
                  {
                    name: 'onClick',
                    title: '点击事件',
                  },
                ],
              },
              component: {
                isContainer: true,
              },
            },
          },
          {
            componentName: 'tbody',
            title: 'HTML TBody',
            npm: {
              package: 'html-components',
              version: '1.0.0',
              exportName: 'tbody',
              destructuring: true,
            },
            configure: {
              props: [
                {
                  name: 'className',
                  title: '类名',
                  propType: 'string',
                  setter: 'StringSetter',
                },
                {
                  name: 'style',
                  title: '样式',
                  propType: 'object',
                  setter: 'StyleSetter',
                },
              ],
              supports: {
                style: true,
                events: [
                  {
                    name: 'onClick',
                    title: '点击事件',
                  },
                ],
              },
              component: {
                isContainer: true,
              },
            },
          },
          {
            componentName: 'tfoot',
            title: 'HTML TFoot',
            npm: {
              package: 'html-components',
              version: '1.0.0',
              exportName: 'tfoot',
              destructuring: true,
            },
            configure: {
              props: [
                {
                  name: 'className',
                  title: '类名',
                  propType: 'string',
                  setter: 'StringSetter',
                },
                {
                  name: 'style',
                  title: '样式',
                  propType: 'object',
                  setter: 'StyleSetter',
                },
              ],
              supports: {
                style: true,
                events: [
                  {
                    name: 'onClick',
                    title: '点击事件',
                  },
                ],
              },
              component: {
                isContainer: true,
              },
            },
          },
          {
            componentName: 'tr',
            title: 'HTML TR',
            npm: {
              package: 'html-components',
              version: '1.0.0',
              exportName: 'tr',
              destructuring: true,
            },
            configure: {
              props: [
                {
                  name: 'className',
                  title: '类名',
                  propType: 'string',
                  setter: 'StringSetter',
                },
                {
                  name: 'style',
                  title: '样式',
                  propType: 'object',
                  setter: 'StyleSetter',
                },
              ],
              supports: {
                style: true,
                events: [
                  {
                    name: 'onClick',
                    title: '点击事件',
                  },
                  {
                    name: 'onMouseEnter',
                    title: '鼠标进入',
                  },
                  {
                    name: 'onMouseLeave',
                    title: '鼠标离开',
                  },
                ],
              },
              component: {
                isContainer: true,
              },
            },
          },
          {
            componentName: 'td',
            title: 'HTML TD',
            npm: {
              package: 'html-components',
              version: '1.0.0',
              exportName: 'td',
              destructuring: true,
            },
            snippets: [
              {
                title: 'HTML TD',
                schema: {
                  componentName: 'td',
                  props: {
                    style: {
                      padding: '2px',
                      margin: 0,
                    },
                  },
                },
              },
            ],
            configure: {
              props: [
                {
                  name: 'className',
                  title: '类名',
                  propType: 'string',
                  setter: 'StringSetter',
                },
                {
                  name: 'style',
                  title: '样式',
                  propType: 'object',
                  setter: 'StyleSetter',
                },
                {
                  name: 'colSpan',
                  title: '列合并',
                  propType: 'number',
                  setter: 'NumberSetter',
                },
                {
                  name: 'rowSpan',
                  title: '行合并',
                  propType: 'number',
                  setter: 'NumberSetter',
                },
                {
                  name: 'align',
                  title: '水平对齐',
                  propType: {
                    type: 'oneOf',
                    value: ['left', 'center', 'right'],
                  },
                  setter: {
                    componentName: 'SelectSetter',
                    props: {
                      options: [
                        { title: '左对齐', value: 'left' },
                        { title: '居中', value: 'center' },
                        { title: '右对齐', value: 'right' },
                      ],
                    },
                  },
                },
                {
                  name: 'valign',
                  title: '垂直对齐',
                  propType: {
                    type: 'oneOf',
                    value: ['top', 'middle', 'bottom'],
                  },
                  setter: {
                    componentName: 'SelectSetter',
                    props: {
                      options: [
                        { title: '顶部', value: 'top' },
                        { title: '居中', value: 'middle' },
                        { title: '底部', value: 'bottom' },
                      ],
                    },
                  },
                },
              ],
              supports: {
                style: true,
                events: [
                  {
                    name: 'onClick',
                    title: '点击事件',
                  },
                  {
                    name: 'onMouseEnter',
                    title: '鼠标进入',
                  },
                  {
                    name: 'onMouseLeave',
                    title: '鼠标离开',
                  },
                ],
              },
              component: {
                isContainer: true,
              },
            },
          },
          {
            componentName: 'th',
            title: 'HTML TH',
            npm: {
              package: 'html-components',
              version: '1.0.0',
              exportName: 'th',
              destructuring: true,
            },
            snippets: [
              {
                title: 'HTML TH',
                schema: {
                  componentName: 'th',
                  props: {
                    style: {
                      padding: '2px',
                      margin: 0,
                    },
                  },
                },
              },
            ],
            configure: {
              props: [
                {
                  name: 'className',
                  title: '类名',
                  propType: 'string',
                  setter: 'StringSetter',
                },
                {
                  name: 'style',
                  title: '样式',
                  propType: 'object',
                  setter: 'StyleSetter',
                },
                {
                  name: 'colSpan',
                  title: '列合并',
                  propType: 'number',
                  setter: 'NumberSetter',
                },
                {
                  name: 'rowSpan',
                  title: '行合并',
                  propType: 'number',
                  setter: 'NumberSetter',
                },
                {
                  name: 'scope',
                  title: '作用域',
                  propType: {
                    type: 'oneOf',
                    value: ['col', 'row', 'colgroup', 'rowgroup'],
                  },
                  setter: {
                    componentName: 'SelectSetter',
                    props: {
                      options: [
                        { title: '列', value: 'col' },
                        { title: '行', value: 'row' },
                        { title: '列组', value: 'colgroup' },
                        { title: '行组', value: 'rowgroup' },
                      ],
                    },
                  },
                },
              ],
              supports: {
                style: true,
                events: [
                  {
                    name: 'onClick',
                    title: '点击事件',
                  },
                ],
              },
              component: {
                isContainer: true,
              },
            },
          },
        ],
        componentList: []
      });
      
      console.log('[HTML Table Plugin] ✓ HTML Table 组件已注册到 simulator');
    },
  };
};

htmlTablePlugin.pluginName = 'htmlTablePlugin';
htmlTablePlugin.meta = {
  preferenceDeclaration: {
    title: 'HTML Table 组件插件配置',
    properties: []
  }
};

export default htmlTablePlugin;


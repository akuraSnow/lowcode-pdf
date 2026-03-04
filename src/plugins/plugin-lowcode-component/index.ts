import { IPublicModelPluginContext } from "@alilc/lowcode-types";
import lowcodeSchema from './lowcode-schema.json'
import tableSchema from './table-schema.json'
import tableMeta from './table-meta'
import htmlRendererSchema from './html-renderer-schema.json'
import htmlRendererMeta from './html-renderer-meta'

const lowcodePlugin = (ctx: IPublicModelPluginContext) => {
  return {
    async init() {
      const { material } = ctx;
      material.loadIncrementalAssets({
        version: '',
        components: [
          {
            devMode: 'lowCode',
            componentName: 'LowcodeDemo',
            title: '低代码组件示例',
            group: '低代码组件',
            schema: lowcodeSchema as any,
            snippets: [{
              schema: {
                componentName: 'LowcodeDemo',
                props: {},
                state: {}
              },
            }]
          },
          {
            devMode: 'lowCode',
            componentName: 'SimpleTable',
            title: '简化表格',
            group: '低代码组件',
            category: '表格类',
            schema: tableSchema as any,
            snippets: [{
              title: '简化表格',
              screenshot: '',
              schema: {
                componentName: 'SimpleTable',
                props: {},
                state: {}
              }
            }],
            configure: tableMeta.configure
          },
          {
            devMode: 'lowCode',
            componentName: 'HtmlRenderer',
            title: 'HTML 渲染器',
            group: '低代码组件',
            category: '内容展示',
            schema: htmlRendererSchema as any,
            snippets: [{
              title: 'HTML 渲染器',
              screenshot: '',
              schema: {
                componentName: 'HtmlRenderer',
                props: {
                  htmlContent: '<div style="text-align: center; padding: 20px;"><h2>HTML 渲染器</h2><p>在属性面板中输入 HTML 代码</p></div>'
                },
                state: {}
              }
            }],
            configure: htmlRendererMeta.configure
          }
        ],
      })
    },
  };
}
lowcodePlugin.pluginName = 'lowcodePlugin';
lowcodePlugin.meta = {
};
export default lowcodePlugin;
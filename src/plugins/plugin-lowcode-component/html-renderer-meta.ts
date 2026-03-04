export default {
  configure: {
    props: [
      {
        name: 'htmlContent',
        title: {
          label: 'HTML 内容',
          tip: '输入要渲染的 HTML 代码'
        },
        propType: 'string',
        setter: {
          componentName: 'TextAreaSetter',
          props: {
            rows: 10,
            placeholder: '请输入 HTML 代码，例如：<div><h1>标题</h1><p>段落内容</p></div>'
          }
        },
        supportVariable: true,
        defaultValue: '<div style="text-align: center; padding: 20px;"><h2>HTML 渲染器</h2><p>在这里输入 HTML 代码</p></div>'
      },
      {
        name: 'style',
        title: '容器样式',
        propType: 'object',
        setter: 'StyleSetter',
        defaultValue: {
          width: '100%',
          border: '1px solid #e8e8e8',
          borderRadius: '4px',
          padding: '16px',
          backgroundColor: '#ffffff'
        }
      }
    ],
    supports: {
      style: true,
      className: true,
      events: []
    },
    component: {
      isContainer: false
    }
  }
};

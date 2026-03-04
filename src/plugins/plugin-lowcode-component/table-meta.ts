/**
 * 简化表格组件的 Meta 配置
 * 支持基础表格功能和表头跨列跨行
 */
export default {
  componentName: 'SimpleTable',
  title: '简化表格',
  category: '表格类',
  group: '低代码组件',
  devMode: 'lowCode',
  npm: {
    package: '@alifd/next',
    version: '1.26.4',
    exportName: 'Table',
    main: 'lib/index.js',
    destructuring: true
  },
  configure: {
    props: [
      {
        name: 'dataSource',
        title: {
          label: '数据源',
          tip: '表格的数据源，数组格式'
        },
        propType: 'object',
        setter: 'JsonSetter',
        supportVariable: true
      },
      {
        name: 'columns',
        title: {
          label: '列配置',
          tip: '表格的列配置'
        },
        propType: {
          type: 'arrayOf',
          value: 'object'
        },
        setter: {
          componentName: 'ArraySetter',
          props: {
            itemSetter: {
              componentName: 'ObjectSetter',
              props: {
                config: {
                  items: [
                    {
                      name: 'dataIndex',
                      title: '数据字段',
                      propType: 'string',
                      setter: 'StringSetter',
                      isRequired: true
                    },
                    {
                      name: 'title',
                      title: '列标题',
                      propType: 'string',
                      setter: 'StringSetter',
                      isRequired: true
                    },
                    {
                      name: 'width',
                      title: '列宽度',
                      propType: 'number',
                      setter: 'NumberSetter'
                    },
                    {
                      name: 'align',
                      title: '对齐方式',
                      propType: {
                        type: 'oneOf',
                        value: ['left', 'center', 'right']
                      },
                      setter: {
                        componentName: 'SelectSetter',
                        props: {
                          options: [
                            { title: '左对齐', value: 'left' },
                            { title: '居中', value: 'center' },
                            { title: '右对齐', value: 'right' }
                          ]
                        }
                      },
                      defaultValue: 'left'
                    },
                    {
                      name: 'lock',
                      title: '锁列',
                      propType: {
                        type: 'oneOf',
                        value: ['left', 'right', false]
                      },
                      setter: {
                        componentName: 'SelectSetter',
                        props: {
                          options: [
                            { title: '不锁定', value: false },
                            { title: '左侧锁定', value: 'left' },
                            { title: '右侧锁定', value: 'right' }
                          ]
                        }
                      },
                      defaultValue: false
                    }
                  ]
                }
              }
            }
          }
        },
        supportVariable: true
      },
      {
        name: 'columnGroups',
        title: {
          label: '表头分组',
          tip: '配置多级表头，支持跨列和跨行'
        },
        propType: {
          type: 'arrayOf',
          value: 'object'
        },
        setter: {
          componentName: 'ArraySetter',
          props: {
            itemSetter: {
              componentName: 'ObjectSetter',
              props: {
                config: {
                  items: [
                    {
                      name: 'title',
                      title: '分组标题',
                      propType: 'string',
                      setter: 'StringSetter',
                      isRequired: true
                    },
                    {
                      name: 'colSpan',
                      title: '跨列数',
                      propType: 'number',
                      setter: 'NumberSetter',
                      defaultValue: 1,
                      description: '该分组横跨的列数'
                    },
                    {
                      name: 'align',
                      title: '对齐方式',
                      propType: {
                        type: 'oneOf',
                        value: ['left', 'center', 'right']
                      },
                      setter: {
                        componentName: 'SelectSetter',
                        props: {
                          options: [
                            { title: '左对齐', value: 'left' },
                            { title: '居中', value: 'center' },
                            { title: '右对齐', value: 'right' }
                          ]
                        }
                      },
                      defaultValue: 'center'
                    }
                  ]
                }
              }
            }
          }
        },
        supportVariable: true
      },
      {
        name: 'hasBorder',
        title: {
          label: '显示边框',
          tip: '是否显示表格边框'
        },
        propType: 'bool',
        setter: 'BoolSetter',
        defaultValue: true
      },
      {
        name: 'fixedHeader',
        title: {
          label: '固定表头',
          tip: '是否固定表头'
        },
        propType: 'bool',
        setter: 'BoolSetter',
        defaultValue: false
      },
      {
        name: 'maxBodyHeight',
        title: {
          label: '最大高度',
          tip: '表格最大高度，超出会出现滚动条'
        },
        propType: 'number',
        setter: 'NumberSetter',
        condition: (target: any) => {
          return target.getProps().getPropValue('fixedHeader') === true;
        }
      },
      {
        name: 'size',
        title: {
          label: '表格尺寸',
          tip: '表格的尺寸大小'
        },
        propType: {
          type: 'oneOf',
          value: ['small', 'medium', 'large']
        },
        setter: {
          componentName: 'RadioGroupSetter',
          props: {
            options: [
              { title: '小', value: 'small' },
              { title: '中', value: 'medium' },
              { title: '大', value: 'large' }
            ]
          }
        },
        defaultValue: 'medium'
      },
      {
        name: 'loading',
        title: {
          label: '加载状态',
          tip: '表格是否处于加载状态'
        },
        propType: 'bool',
        setter: 'BoolSetter',
        defaultValue: false,
        supportVariable: true
      },
      {
        name: 'emptyContent',
        title: {
          label: '空数据提示',
          tip: '数据为空时显示的内容'
        },
        propType: 'string',
        setter: 'StringSetter',
        defaultValue: '暂无数据'
      },
      {
        name: 'rowSelection',
        title: {
          label: '行选择',
          tip: '是否支持行选择功能'
        },
        propType: 'object',
        setter: {
          componentName: 'ObjectSetter',
          props: {
            config: {
              items: [
                {
                  name: 'mode',
                  title: '选择模式',
                  propType: {
                    type: 'oneOf',
                    value: ['single', 'multiple']
                  },
                  setter: {
                    componentName: 'RadioGroupSetter',
                    props: {
                      options: [
                        { title: '单选', value: 'single' },
                        { title: '多选', value: 'multiple' }
                      ]
                    }
                  },
                  defaultValue: 'multiple'
                },
                {
                  name: 'selectedRowKeys',
                  title: '选中的行',
                  propType: 'array',
                  setter: 'JsonSetter',
                  supportVariable: true
                }
              ]
            }
          }
        },
        supportVariable: true
      }
    ],
    supports: {
      className: true,
      style: true,
      events: [
        {
          name: 'onRowClick',
          title: {
            label: '行点击事件',
            tip: '点击表格行时触发'
          }
        },
        {
          name: 'onChange',
          title: {
            label: '表格变化事件',
            tip: '表格发生变化时触发'
          }
        },
        {
          name: 'onSort',
          title: {
            label: '排序事件',
            tip: '点击列排序时触发'
          }
        },
        {
          name: 'onFilter',
          title: {
            label: '筛选事件',
            tip: '筛选条件变化时触发'
          }
        }
      ]
    }
  }
};

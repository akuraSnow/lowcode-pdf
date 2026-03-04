import ReactDOM from 'react-dom';
import React, { useState } from 'react';
import { Loading } from '@alifd/next';
import mergeWith from 'lodash/mergeWith';
import isArray from 'lodash/isArray';
import { buildComponents, assetBundle, AssetLevel, AssetLoader } from '@alilc/lowcode-utils';
import ReactRenderer from '@alilc/lowcode-react-renderer';
import { injectComponents } from '@alilc/lowcode-plugin-inject';
import appHelper from './appHelper';
import {
  getProjectSchemaFromLocalStorage,
  getPackagesFromLocalStorage,
  getPreviewLocale,
  setPreviewLocale,
} from './services/mockService';

const getScenarioName = function () {
  if (location.search) {
    return new URLSearchParams(location.search.slice(1)).get('scenarioName') || 'general';
  }
  return 'general';
};

const SamplePreview = () => {
  const [data, setData] = useState({});

  async function init() {
    const scenarioName = getScenarioName();
    const packages = getPackagesFromLocalStorage(scenarioName);
    const projectSchema = getProjectSchemaFromLocalStorage(scenarioName);
    const {
      componentsMap: componentsMapArray,
      componentsTree,
      i18n,
      dataSource: projectDataSource,
    } = projectSchema;
    const componentsMap: any = {};
    componentsMapArray.forEach((component: any) => {
      componentsMap[component.componentName] = component;
    });
    const pageSchema = componentsTree[0];

    const libraryMap = {};
    const libraryAsset = [];
    packages.forEach(({ package: _package, library, urls, renderUrls }) => {
      libraryMap[_package] = library;
      if (renderUrls) {
        libraryAsset.push(renderUrls);
      } else if (urls) {
        libraryAsset.push(urls);
      }
    });

    const vendors = [assetBundle(libraryAsset, AssetLevel.Library)];

    // TODO asset may cause pollution
    const assetLoader = new AssetLoader();
    await assetLoader.load(libraryAsset);
    
    // injectComponents 的使用一般在开发环境做调试注入使用（详细见文档），一般纯净的预览环境是不依赖此插件（即预览渲染态理论上是不需要依赖任何引擎及其相关的插件等资源，PS: 一些 utils 和 types 忽略）
    // The use of injectComponents is generally used for debugging and injection in the development environment (see the documentation for details). The generally destroyed preview environment does not rely on this plug-in.
    // const components = await injectComponents(buildComponents(libraryMap, componentsMap));
    const components = buildComponents(libraryMap, componentsMap);
    
    // 手动注入原生 HTML Table 组件
    if ((window as any).HtmlComponents) {
      Object.assign(components, (window as any).HtmlComponents);
      console.log('[Preview] ✓ 已注入原生 HTML Table 组件');
    }
    
    // 手动注入 Fusion Next 组件的所有子组件
    if ((window as any).Next) {
      const Next = (window as any).Next;
      
      // Table 子组件
      if (Next.Table) {
        const subComponents = [
          'Column', 'ColumnGroup', 'Header', 'Body', 'Footer', 
          'GroupHeader', 'GroupFooter', 'StickyLock'
        ];
        subComponents.forEach(subComp => {
          if (Next.Table[subComp]) {
            components[`Table.${subComp}`] = Next.Table[subComp];
          }
        });
        console.log('[Preview] ✓ 已注入 Fusion Table 子组件');
      }
      
      // Form 子组件
      if (Next.Form) {
        const formSubComponents = ['Item', 'Submit', 'Reset', 'Error'];
        formSubComponents.forEach(subComp => {
          if (Next.Form[subComp]) {
            components[`Form.${subComp}`] = Next.Form[subComp];
          }
        });
      }
      
      // Select 子组件
      if (Next.Select) {
        if (Next.Select.Option) {
          components['Select.Option'] = Next.Select.Option;
        }
        if (Next.Select.OptionGroup) {
          components['Select.OptionGroup'] = Next.Select.OptionGroup;
        }
      }
      
      // Radio 子组件
      if (Next.Radio && Next.Radio.Group) {
        components['Radio.Group'] = Next.Radio.Group;
      }
      
      // Checkbox 子组件
      if (Next.Checkbox && Next.Checkbox.Group) {
        components['Checkbox.Group'] = Next.Checkbox.Group;
      }
      
      // Menu 子组件
      if (Next.Menu) {
        const menuSubComponents = ['Item', 'Group', 'SubMenu', 'Divider'];
        menuSubComponents.forEach(subComp => {
          if (Next.Menu[subComp]) {
            components[`Menu.${subComp}`] = Next.Menu[subComp];
          }
        });
      }
      
      // Nav 子组件
      if (Next.Nav) {
        const navSubComponents = ['Item', 'Group', 'SubNav', 'PopupItem'];
        navSubComponents.forEach(subComp => {
          if (Next.Nav[subComp]) {
            components[`Nav.${subComp}`] = Next.Nav[subComp];
          }
        });
      }
      
      // Tab 子组件
      if (Next.Tab && Next.Tab.Item) {
        components['Tab.Item'] = Next.Tab.Item;
      }
      
      // Step 子组件
      if (Next.Step && Next.Step.Item) {
        components['Step.Item'] = Next.Step.Item;
      }
      
      // Timeline 子组件
      if (Next.Timeline && Next.Timeline.Item) {
        components['Timeline.Item'] = Next.Timeline.Item;
      }
      
      // Card 子组件
      if (Next.Card) {
        const cardSubComponents = ['Header', 'Content', 'Actions', 'Divider', 'Media', 'BulletHeader'];
        cardSubComponents.forEach(subComp => {
          if (Next.Card[subComp]) {
            components[`Card.${subComp}`] = Next.Card[subComp];
          }
        });
      }
      
      console.log('[Preview] ✓ 已注入所有 Fusion Next 子组件');
    }
    
    setData({
      schema: pageSchema,
      components,
      i18n,
      projectDataSource,
    });
  }

  const { schema, components, i18n = {}, projectDataSource = {} } = data as any;

  if (!schema || !components) {
    init();
    return <Loading fullScreen />;
  }
  const currentLocale = getPreviewLocale(getScenarioName());

  if (!(window as any).setPreviewLocale) {
    // for demo use only, can use this in console to switch language for i18n test
    // 在控制台 window.setPreviewLocale('en-US') 或 window.setPreviewLocale('zh-CN') 查看切换效果
    (window as any).setPreviewLocale = (locale: string) =>
      setPreviewLocale(getScenarioName(), locale);
  }

  function customizer(objValue: [], srcValue: []) {
    if (isArray(objValue)) {
      return objValue.concat(srcValue || []);
    }
  }

  return (
    <div className="lowcode-plugin-sample-preview">
      <ReactRenderer
        className="lowcode-plugin-sample-preview-content"
        schema={{
          ...schema,
          dataSource: mergeWith(schema.dataSource, projectDataSource, customizer),
        }}
        components={components}
        locale={currentLocale}
        messages={i18n}
        appHelper={appHelper}
      />
    </div>
  );
};

ReactDOM.render(<SamplePreview />, document.getElementById('ice-container'));

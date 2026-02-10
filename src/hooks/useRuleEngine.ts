/**
 * 逻辑规则引擎 Hook
 */

import { useCallback } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { useDataStore } from '../stores/dataStore';
import type {
  LogicRule,
  Condition,
  Action,
  Component,
  ComparisonOperator,
} from '../types';
import { getValueByPath } from '../utils';

export function useRuleEngine() {
  const updateComponent = useEditorStore((state) => state.updateComponent);
  const getComponentById = useEditorStore((state) => state.getComponentById);
  const pageData = useDataStore((state) => state.pageData);
  const getPageDataByPath = useDataStore((state) => state.getPageDataByPath);
  const updatePageData = useDataStore((state) => state.updatePageData);
  const executeAPI = useDataStore((state) => state.executeAPI);

  /**
   * 执行规则
   */
  const executeRule = useCallback(
    async (rule: LogicRule, componentId?: string) => {
      if (!rule.enabled) {
        return;
      }

      if (rule.type === 'code' && rule.code) {
        // 执行代码形式的规则
        await executeCodeRule(rule.code, componentId);
      } else if (rule.type === 'visual' && rule.conditions && rule.actions) {
        // 执行可视化配置的规则
        await executeVisualRule(rule, componentId);
      }
    },
    [pageData]
  );

  /**
   * 执行代码规则
   */
  const executeCodeRule = useCallback(
    async (code: string, componentId?: string) => {
      try {
        const context = {
          getComponent: getComponentById,
          updateComponent,
          pageData,
          updatePageData,
          console: console,
          executeAPI,
          componentId,
        };

        const func = new Function(
          'getComponent',
          'updateComponent',
          'pageData',
          'updatePageData',
          'console',
          'executeAPI',
          'componentId',
          code
        );

        await func(
          context.getComponent,
          context.updateComponent,
          context.pageData,
          context.updatePageData,
          context.console,
          context.executeAPI,
          context.componentId
        );
      } catch (error) {
        console.error('Rule code execution error:', error);
      }
    },
    [getComponentById, updateComponent, pageData, updatePageData, executeAPI]
  );

  /**
   * 执行可视化规则
   */
  const executeVisualRule = useCallback(
    async (rule: LogicRule, componentId?: string) => {
      // 检查条件
      const conditionsmet = evaluateConditions(
        rule.conditions!,
        rule.conditionLogic || 'AND'
      );

      // 如果条件满足，执行动作
      if (conditionsmet) {
        for (const action of rule.actions!) {
          await executeAction(action, componentId);
        }
      }
    },
    [pageData]
  );

  /**
   * 评估条件
   */
  const evaluateConditions = useCallback(
    (conditions: Condition[], logic: 'AND' | 'OR'): boolean => {
      if (conditions.length === 0) {
        return true;
      }

      const results = conditions.map((condition) =>
        evaluateCondition(condition)
      );

      if (logic === 'AND') {
        return results.every((result) => result);
      } else {
        return results.some((result) => result);
      }
    },
    [pageData]
  );

  /**
   * 评估单个条件
   */
  const evaluateCondition = useCallback(
    (condition: Condition): boolean => {
      let fieldValue: any;

      // 获取字段值
      if (condition.fieldType === 'pageData') {
        fieldValue = getPageDataByPath(condition.fieldPath);
      } else if (condition.fieldType === 'component') {
        const [componentId, propertyPath] = condition.fieldPath.split('.');
        const component = getComponentById(componentId);
        if (component && propertyPath) {
          fieldValue = getValueByPath(component, propertyPath);
        }
      } else if (condition.fieldType === 'expression') {
        try {
          const func = new Function('pageData', `return ${condition.fieldPath}`);
          fieldValue = func(pageData);
        } catch (error) {
          console.error('Expression evaluation error:', error);
          return false;
        }
      }

      // 获取比较值
      let compareValue: any;
      if (condition.valueType === 'static') {
        compareValue = condition.value;
      } else if (condition.valueType === 'pageData') {
        compareValue = getPageDataByPath(condition.value);
      } else if (condition.valueType === 'dynamic') {
        const [componentId, propertyPath] = condition.value.split('.');
        const component = getComponentById(componentId);
        if (component && propertyPath) {
          compareValue = getValueByPath(component, propertyPath);
        }
      }

      // 执行比较
      return compare(fieldValue, condition.operator, compareValue);
    },
    [pageData, getPageDataByPath, getComponentById]
  );

  /**
   * 比较两个值
   */
  const compare = (
    value1: any,
    operator: ComparisonOperator,
    value2: any
  ): boolean => {
    switch (operator) {
      case 'equals':
        return value1 === value2;
      case 'notEquals':
        return value1 !== value2;
      case 'greaterThan':
        return value1 > value2;
      case 'lessThan':
        return value1 < value2;
      case 'greaterEqual':
        return value1 >= value2;
      case 'lessEqual':
        return value1 <= value2;
      case 'contains':
        return String(value1).includes(String(value2));
      case 'notContains':
        return !String(value1).includes(String(value2));
      case 'isEmpty':
        return (
          value1 === null ||
          value1 === undefined ||
          value1 === '' ||
          (Array.isArray(value1) && value1.length === 0)
        );
      case 'isNotEmpty':
        return !(
          value1 === null ||
          value1 === undefined ||
          value1 === '' ||
          (Array.isArray(value1) && value1.length === 0)
        );
      default:
        return false;
    }
  };

  /**
   * 执行动作
   */
  const executeAction = useCallback(
    async (action: Action, contextComponentId?: string) => {
      const targetId = action.target || contextComponentId;

      switch (action.type) {
        case 'show':
          if (targetId) {
            updateComponent(targetId, {
              style: { ...getComponentById(targetId)?.style, display: 'block' },
            });
          }
          break;

        case 'hide':
          if (targetId) {
            updateComponent(targetId, {
              style: { ...getComponentById(targetId)?.style, display: 'none' },
            });
          }
          break;

        case 'enable':
          if (targetId) {
            updateComponent(targetId, {
              style: { ...getComponentById(targetId)?.style, pointerEvents: 'auto', opacity: 1 },
            });
          }
          break;

        case 'disable':
          if (targetId) {
            updateComponent(targetId, {
              style: { ...getComponentById(targetId)?.style, pointerEvents: 'none', opacity: 0.5 },
            });
          }
          break;

        case 'setValue':
          if (targetId) {
            let value: any;
            if (action.valueType === 'static') {
              value = action.value;
            } else if (action.valueType === 'pageData') {
              value = getPageDataByPath(action.value);
            } else if (action.valueType === 'dynamic') {
              const [compId, path] = action.value.split('.');
              const comp = getComponentById(compId);
              if (comp && path) {
                value = getValueByPath(comp, path);
              }
            }

            // 根据组件类型设置不同的属性
            const component = getComponentById(targetId);
            if (component) {
              if (component.type === 'text') {
                updateComponent(targetId, { content: value });
              } else if (component.type === 'table') {
                updateComponent(targetId, { dataSource: value });
              } else if (component.type === 'chart') {
                updateComponent(targetId, { data: value });
              }
            }
          }
          break;

        case 'setStyle':
          if (targetId && action.params) {
            const component = getComponentById(targetId);
            updateComponent(targetId, {
              style: { ...component?.style, ...action.params },
            });
          }
          break;

        case 'alert':
          if (action.value) {
            // 支持模板字符串
            let message = action.value;
            try {
              const func = new Function('pageData', `return \`${message}\``);
              message = func(pageData);
            } catch (error) {
              // 如果不是模板字符串，使用原始值
            }
            alert(message);
          }
          break;

        case 'navigate':
          if (action.value) {
            window.location.href = action.value;
          }
          break;

        case 'apiCall':
          if (action.value) {
            try {
              await executeAPI(action.value);
            } catch (error) {
              console.error('API call error:', error);
            }
          }
          break;

        default:
          console.warn('Unknown action type:', action.type);
      }
    },
    [
      updateComponent,
      getComponentById,
      getPageDataByPath,
      pageData,
      executeAPI,
    ]
  );

  /**
   * 批量执行规则
   */
  const executeRules = useCallback(
    async (rules: LogicRule[], componentId?: string) => {
      for (const rule of rules) {
        await executeRule(rule, componentId);
      }
    },
    [executeRule]
  );

  /**
   * 执行组件的所有规则
   */
  const executeComponentRules = useCallback(
    async (component: Component) => {
      if (component.rules && component.rules.length > 0) {
        await executeRules(component.rules, component.id);
      }
    },
    [executeRules]
  );

  return {
    executeRule,
    executeRules,
    executeComponentRules,
    evaluateConditions,
    executeAction,
  };
}

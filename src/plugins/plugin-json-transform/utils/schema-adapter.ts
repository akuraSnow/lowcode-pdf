import { JsonValue } from '../json-transform.types';

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasComponentsTree(value: JsonValue): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.componentsTree);
}

function hasComponentName(value: JsonValue): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.componentName === 'string';
}

export function extractImportableSchema(value: JsonValue): JsonValue | null {
  if (hasComponentsTree(value)) {
    return value;
  }

  if (isRecord(value) && value.projectSchema && hasComponentsTree(value.projectSchema)) {
    return value.projectSchema;
  }

  if (isRecord(value) && value.schema && hasComponentsTree(value.schema)) {
    return value.schema;
  }

  if (hasComponentName(value)) {
    return {
      componentsTree: [value],
      componentsMap: [],
      version: '1.0.0',
      i18n: {
        'zh-CN': {},
        'en-US': {},
      },
    };
  }

  return null;
}

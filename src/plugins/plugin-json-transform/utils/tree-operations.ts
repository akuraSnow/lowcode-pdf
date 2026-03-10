import { TransformNode, TransformStep, NodeFunctionMode } from '../json-transform.types';

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createNode(name: string): TransformNode {
  return {
    id: randomId('node'),
    name,
    children: [],
    transformStep: null,
    mode: 'directPath',
    directPath: '',
  };
}

function mapNodes(nodes: TransformNode[], nodeId: string, updater: (node: TransformNode) => TransformNode): TransformNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }

    if (node.children.length === 0) {
      return node;
    }

    return {
      ...node,
      children: mapNodes(node.children, nodeId, updater),
    };
  });
}

export function updateNodeName(nodes: TransformNode[], nodeId: string, name: string): TransformNode[] {
  return mapNodes(nodes, nodeId, (node) => ({ ...node, name }));
}

export function updateNodeTransformStep(
  nodes: TransformNode[],
  nodeId: string,
  transformStep: TransformStep | null
): TransformNode[] {
  return mapNodes(nodes, nodeId, (node) => ({ ...node, transformStep }));
}

export function addChildNode(nodes: TransformNode[], parentId: string): TransformNode[] {
  return mapNodes(nodes, parentId, (node) => ({
    ...node,
    children: [...node.children, createNode('新子节点')],
  }));
}

function addSiblingToList(nodes: TransformNode[], targetId: string): TransformNode[] {
  const targetIndex = nodes.findIndex((node) => node.id === targetId);
  if (targetIndex !== -1) {
    const siblingNode = createNode('新兄弟节点');
    const cloned = [...nodes];
    cloned.splice(targetIndex + 1, 0, siblingNode);
    return cloned;
  }

  return nodes.map((node) => ({
    ...node,
    children: addSiblingToList(node.children, targetId),
  }));
}

export function addSiblingNode(nodes: TransformNode[], targetId: string): TransformNode[] {
  return addSiblingToList(nodes, targetId);
}

function deleteNodeFromList(nodes: TransformNode[], targetId: string): TransformNode[] {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => ({
      ...node,
      children: deleteNodeFromList(node.children, targetId),
    }));
}

export function deleteNode(nodes: TransformNode[], targetId: string): TransformNode[] {
  return deleteNodeFromList(nodes, targetId);
}

export function getNodeById(nodes: TransformNode[], targetId: string): TransformNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }

    const child = getNodeById(node.children, targetId);
    if (child) {
      return child;
    }
  }

  return null;
}

export function updateNodeMode(
  nodes: TransformNode[],
  nodeId: string,
  mode: NodeFunctionMode
): TransformNode[] {
  return mapNodes(nodes, nodeId, (node) => ({ ...node, mode }));
}

export function updateNodeDirectPath(
  nodes: TransformNode[],
  nodeId: string,
  directPath: string
): TransformNode[] {
  return mapNodes(nodes, nodeId, (node) => ({ ...node, directPath }));
}

export function updateNodeCustomFunction(
  nodes: TransformNode[],
  nodeId: string,
  jsFileName: string,
  functionName: string
): TransformNode[] {
  return mapNodes(nodes, nodeId, (node) => ({ ...node, jsFileName, functionName }));
}

export function updateNodesCustomFunction(
  nodes: TransformNode[],
  nodeIds: string[],
  jsFileName: string,
  functionName: string
): TransformNode[] {
  let result = nodes;
  for (const id of nodeIds) {
    result = updateNodeCustomFunction(result, id, jsFileName, functionName);
  }
  return result;
}

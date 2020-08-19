import { FocusState, Id, NodeHierarchy, Orientation } from '../types';

interface GetParentsOptions {
  focusState: FocusState;
  nodeId: Id;
  currentFocusHierarchy?: NodeHierarchy;
}

export function getParents({
  focusState,
  nodeId,
  currentFocusHierarchy = [],
}: GetParentsOptions): NodeHierarchy {
  const node = focusState.nodes[nodeId];

  if (!node) {
    return [];
  }

  const parentId = node.parentId;

  if (parentId === null) {
    return currentFocusHierarchy;
  } else {
    return getParents({
      focusState,
      nodeId: parentId,
      currentFocusHierarchy: [parentId, ...currentFocusHierarchy],
    });
  }
}

interface GetChildrenOptions extends GetParentsOptions {
  orientation?: Orientation;
  preferEnd?: boolean;
  preferredChildren?: NodeHierarchy;
}

export function getChildren({
  focusState,
  nodeId,
  currentFocusHierarchy = [],
  orientation,
  preferEnd,
  preferredChildren,
}: GetChildrenOptions): Id[] {
  const node = focusState.nodes[nodeId];

  if (!node) {
    return [];
  }

  const nodeChildren = node.children.filter((childId) => {
    const node = focusState.nodes[childId];

    const isEnabled = node && !node.disabled && !node.isExiting;
    return isEnabled;
  });

  let nextPreferredChildren: NodeHierarchy = [];

  if (nodeChildren.length === 0) {
    return currentFocusHierarchy;
  } else {
    if (node.navigationStyle === 'grid') {
      const preferredRowIndex = node.defaultFocusRow ?? 0;
      const rowIndex = Math.max(preferredRowIndex, node.children.length - 1);
      const rowId = node.children[rowIndex];

      const row = focusState.nodes[rowId];

      if (!row || row.children.length === 0) {
        return [...currentFocusHierarchy, rowId];
      }

      const preferredColumnIndex = node.defaultFocusColumn ?? 0;
      const columnIndex = Math.max(
        preferredColumnIndex,
        row.children.length - 1
      );
      const columnId = row.children[columnIndex];

      return [...currentFocusHierarchy, rowId, columnId];
    }

    let nextChildId = nodeChildren[0];

    if (preferredChildren && preferredChildren.length) {
      const possibleId = preferredChildren[0];

      if (focusState.nodes[possibleId]) {
        nextChildId = possibleId;
        nextPreferredChildren = preferredChildren.slice(1);
      }
    }

    if (orientation && orientation === node.orientation) {
      // TODO: leaving this here in the event that I refactor the
      // preferred column/row implementation above, even though
      // it is currently redundant.
      // @ts-ignore
      const isGridNavigation = node.navigationStyle === 'grid';
      const useLastNode = !isGridNavigation && preferEnd;

      const lastIndex = Math.max(0, nodeChildren.length - 1);
      const index = useLastNode ? lastIndex : 0;
      nextChildId = nodeChildren[index];
    }

    return getChildren({
      focusState,
      nodeId: nextChildId,
      currentFocusHierarchy: [...currentFocusHierarchy, nextChildId],
      preferredChildren: nextPreferredChildren,
    });
  }
}

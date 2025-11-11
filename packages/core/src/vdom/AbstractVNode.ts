import { elementsToFragment } from "./dom-utils";
import { RootVNode } from "./RootVNode";
import { VNode } from "./types";

export type PatchOperation =
  | {
      type: "add";
      elm: Node | Node[];
    }
  | {
      type: "replace";
      oldElm: Node | Node[];
      newElm: Node | Node[];
    }
  | {
      type: "remove";
      elm: Node | Node[];
    };

export abstract class AbstractVNode {
  key?: string;
  parent?: VNode;
  root?: RootVNode;
  elm?: Node;
  children?: VNode[];
  abstract mount(parent?: VNode): Node | Node[];
  abstract patch(oldNode: VNode): void;
  abstract unmount(): void;
  abstract rerender(operations?: PatchOperation[]): void;
  protected getHTMLElement() {
    if (!this.elm || !(this.elm instanceof HTMLElement)) {
      throw new Error("This VNode does not have an HTMLElement");
    }

    return this.elm;
  }
  /**
   * A VNode can represent multiple elements (fragment of component)
   */
  getElements(): Node[] {
    if (this.elm) {
      return [this.elm];
    }

    if (!this.children) {
      throw new Error("This VNode has no element or children");
    }

    return this.children.map((child) => child.getElements()).flat();
  }
  getParentElement(): HTMLElement {
    let parent = this.parent;

    // This VNode might not have an element, but relies
    // on a parent for it. So we make sure that we get
    // the actual parent of the element related to this VNode
    while (parent) {
      if (parent.elm instanceof HTMLElement) {
        // This will always be an HTMLElement as text nodes has no children
        return parent.elm as HTMLElement;
      }

      parent = parent.parent;
    }

    throw new Error("There is no parent element for this VNode");
  }
  protected canPatch(oldNode: VNode, newNode: VNode): boolean {
    // Must be same constructor type
    if (oldNode.constructor !== newNode.constructor) {
      return false;
    }

    // For ElementVNodes, must have same tag
    if ("tag" in oldNode && "tag" in newNode) {
      return (oldNode as any).tag === (newNode as any).tag;
    }

    // For ComponentVNodes, must have same component function
    if ("component" in oldNode && "component" in newNode) {
      return (oldNode as any).component === (newNode as any).component;
    }

    // TextVNodes and FragmentVNodes can always patch
    return true;
  }

  patchChildren(newChildren: VNode[]): {
    children: VNode[];
    hasChangedStructure: boolean;
    operations: PatchOperation[];
  } {
    const prevChildren = this.children!;

    // When there are only new children, we just mount them
    if (newChildren && prevChildren.length === 0) {
      newChildren.forEach((child) => child.mount(this as any));

      return {
        children: newChildren,
        hasChangedStructure: true,
        operations: [],
      };
    }

    // If we want to remove all children, we just unmount the previous ones
    if (!newChildren.length && prevChildren.length) {
      prevChildren.forEach((child) => child.unmount());

      return { children: [], hasChangedStructure: true, operations: [] };
    }

    const oldKeys: Record<string, { vnode: VNode; index: number }> = {};

    prevChildren.forEach((prevChild, index) => {
      oldKeys[prevChild.key || index] = {
        vnode: prevChild,
        index,
      };
    });

    // Build result array in the NEW order
    const result: VNode[] = [];
    const operations: PatchOperation[] = [];

    // Track indices of reused nodes in their original order
    const reusedOldIndices: number[] = [];
    // Track which result positions contain new nodes (not reused/replaced)
    const isNewNode: boolean[] = [];

    let forceStructuralChange = false;

    newChildren.forEach((newChild, index) => {
      const key = newChild.key || index;
      const prevChild = oldKeys[key];

      if (!prevChild) {
        // New child - mount and add to result
        const elm = newChild.mount(this as any);
        result.push(newChild);
        isNewNode.push(true);
        operations.push({ type: "add", elm });
      } else if (prevChild?.vnode === newChild) {
        // Same instance - no patching needed, just reuse
        result.push(prevChild.vnode);
        isNewNode.push(false);
        reusedOldIndices.push(prevChild.index);
        delete oldKeys[key];
      } else if (this.canPatch(prevChild.vnode, newChild)) {
        // Compatible types - patch and reuse old VNode
        prevChild.vnode.patch(newChild as any);
        result.push(prevChild.vnode);
        isNewNode.push(false);
        reusedOldIndices.push(prevChild.index);
        delete oldKeys[key];
      } else {
        // Incompatible types - replace completely
        const newElm = newChild.mount(this as any);
        prevChild.vnode.unmount();
        result.push(newChild);
        isNewNode.push(false); // Replacement, not an insertion
        delete oldKeys[key];

        const oldElm = prevChild.vnode.getElements();

        // We need to fall back to structural change when the old node does
        // not have any elements. This can happen when a component returns null,
        // throws an error etc.
        if (!oldElm.length) {
          forceStructuralChange = true;
          return;
        }

        operations.push({
          type: "replace",
          oldElm,
          newElm,
        });
      }
    });

    // Unmount any old children that weren't reused
    for (const key in oldKeys) {
      oldKeys[key].vnode.unmount();
      operations.push({
        type: "remove",
        elm: oldKeys[key].vnode.getElements(),
      });
    }

    // Detect structural changes:
    // 1. Reordering: reused nodes are not in their original relative order
    // 2. Insertion in middle: new nodes inserted before existing nodes

    let hasReordering = false;
    let hasInsertionInMiddle = false;

    if (!forceStructuralChange) {
      for (let i = 1; i < reusedOldIndices.length; i++) {
        if (reusedOldIndices[i] < reusedOldIndices[i - 1]) {
          hasReordering = true;
          break;
        }
      }
    }

    if (!hasReordering) {
      // Find the last position that contains a reused/replaced node
      let lastReusedResultIndex = -1;
      for (let i = result.length - 1; i >= 0; i--) {
        if (!isNewNode[i]) {
          lastReusedResultIndex = i;
          break;
        }
      }

      // Check if any new nodes were inserted before the last reused/replaced node

      if (lastReusedResultIndex >= 0) {
        for (let i = 0; i < lastReusedResultIndex; i++) {
          if (isNewNode[i]) {
            hasInsertionInMiddle = true;
            break;
          }
        }
      }
    }

    const hasChangedStructure =
      forceStructuralChange || hasReordering || hasInsertionInMiddle;

    if (hasChangedStructure) {
      operations.length = 0;
    }

    return { children: result, hasChangedStructure, operations };
  }
  applyPatchOperations(target: HTMLElement, operations: PatchOperation[]) {
    operations.forEach((operation) => {
      switch (operation.type) {
        case "add": {
          target.appendChild(elementsToFragment(operation.elm));
          break;
        }
        case "remove": {
          if (Array.isArray(operation.elm)) {
            const range = new Range();
            range.setStartBefore(operation.elm[0]);
            range.setEndAfter(operation.elm[operation.elm.length - 1]);
            range.deleteContents();
          } else {
            target.removeChild(operation.elm);
          }
          break;
        }
        case "replace": {
          if (Array.isArray(operation.oldElm)) {
            const range = new Range();

            range.setStartBefore(operation.oldElm[0]);
            range.setEndAfter(operation.oldElm[operation.oldElm.length - 1]);
            range.deleteContents();
            range.insertNode(elementsToFragment(operation.newElm));
          } else {
            target.replaceChild(
              elementsToFragment(operation.newElm),
              operation.oldElm
            );
          }
          break;
        }
      }
    });
  }
  /**
   * Intelligently sync DOM to match children VNode order.
   * Only performs DOM operations when elements are out of position.
   * This is used by both patch() and rerender() to efficiently update children.
   */
  protected syncDOMChildren() {
    if (!this.children) {
      return;
    }

    const elm = this.elm as HTMLElement;
    let currentDomChild = elm.firstChild;

    for (const child of this.children) {
      const childNodes = child.getElements();

      for (const node of childNodes) {
        if (currentDomChild === node) {
          // Already in correct position, advance pointer
          currentDomChild = currentDomChild.nextSibling;
        } else {
          // Insert (or move if it exists elsewhere in DOM)
          elm.insertBefore(node, currentDomChild);
        }
      }
    }

    // Remove any leftover nodes (shouldn't happen if unmount works correctly)
    while (currentDomChild) {
      const next = currentDomChild.nextSibling;
      elm.removeChild(currentDomChild);
      currentDomChild = next;
    }
  }
}

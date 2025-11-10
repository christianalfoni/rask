import { RootVNode } from "./RootVNode";
import { VNode } from "./types";

export abstract class AbstractVNode {
  key?: string;
  parent?: VNode;
  root?: RootVNode;
  elm?: Node;
  children?: VNode[];
  abstract mount(parent?: VNode): Node | Node[];
  abstract patch(oldNode: VNode): void;
  abstract unmount(): void;
  abstract rerender(): void;
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
  } {
    const prevChildren = this.children!;

    // When there are only new children, we just mount them
    if (newChildren && prevChildren.length === 0) {
      newChildren.forEach((child) => child.mount(this as any));

      return { children: newChildren, hasChangedStructure: true };
    }

    // If we want to remove all children, we just unmount the previous ones
    if (!newChildren.length && prevChildren.length) {
      prevChildren.forEach((child) => child.unmount());

      return { children: [], hasChangedStructure: true };
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

    let hasChangedStructure = false;

    newChildren.forEach((newChild, index) => {
      const key = newChild.key || index;
      const prevChild = oldKeys[key];

      if (!prevChild) {
        // New child - mount and add to result
        newChild.mount(this as any);
        result.push(newChild);
        hasChangedStructure = true;
      } else if (prevChild?.vnode === newChild) {
        // Same instance - no patching needed, just reuse
        result.push(prevChild.vnode);
        delete oldKeys[key];
        hasChangedStructure = hasChangedStructure || prevChild.index !== index;
      } else if (this.canPatch(prevChild.vnode, newChild)) {
        // Compatible types - patch and reuse old VNode
        prevChild.vnode.patch(newChild as any);
        result.push(prevChild.vnode);
        delete oldKeys[key];
        hasChangedStructure = hasChangedStructure || prevChild.index !== index;
      } else {
        // Incompatible types - replace completely
        newChild.mount(this as any);
        prevChild.vnode.unmount();
        result.push(newChild);
        delete oldKeys[key];
        hasChangedStructure = true;
      }
    });

    // Unmount any old children that weren't reused
    for (const key in oldKeys) {
      oldKeys[key].vnode.unmount();
      hasChangedStructure = true;
    }

    return { children: result, hasChangedStructure };
  }
}

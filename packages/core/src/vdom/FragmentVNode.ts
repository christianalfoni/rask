import { AbstractVNode, PatchOperation } from "./AbstractVNode";
import { ComponentVNode } from "./ComponentVNode";
import { ElementVNode } from "./ElementVNode";
import { RootVNode } from "./RootVNode";
import { TextVNode } from "./TextVNode";
import { VNode } from "./types";

export const Fragment = Symbol("Fragment");

export class FragmentVNode extends AbstractVNode {
  children: VNode[];
  key?: string;

  constructor(children: VNode[], key?: string) {
    super();
    this.children = children;
    this.key = key;
  }
  mount(parent?: VNode): Node[] {
    this.parent = parent;

    if (parent instanceof RootVNode) {
      this.root = parent;
    } else {
      this.root = parent?.root;
    }

    return this.children.map((child) => child.mount(this)).flat();
  }
  rerender(operations?: PatchOperation[]): void {
    this.parent?.rerender(operations);
  }
  patch(newNode: FragmentVNode) {
    const { children, hasChangedStructure, operations } = this.patchChildren(
      newNode.children
    );
    this.children = children;

    // So we can safely pass remove/replace operations up to the parent, but add
    // is very tricky as parent has potentially other children as well. This can be
    // handled with some additional detection, changing it to insertBefore. This can be
    // done by passing this vnode up to the parent
    this.rerender(
      hasChangedStructure ||
        operations.some((operation) => operation.type === "add")
        ? undefined
        : operations
    );
  }
  unmount() {
    this.children.forEach((child) => child.unmount());
    this.root?.queueUnmount(() => {
      delete this.parent;
    });
  }
}

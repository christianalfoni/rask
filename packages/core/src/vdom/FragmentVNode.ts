import { AbstractVNode } from "./AbstractVNode";
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
  rerender(): void {
    this.parent?.rerender();
  }
  patch(newNode: FragmentVNode) {
    const { children, hasChangedStructure } = this.patchChildren(
      newNode.children
    );
    this.children = children;
    if (hasChangedStructure) {
      this.rerender();
    }
  }
  unmount() {
    this.children.forEach((child) => child.unmount());
    this.root?.queueUnmount(() => {
      delete this.parent;
    });
  }
}

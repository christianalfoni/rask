import { AbstractVNode } from "./AbstractVNode";
import { RootVNode } from "./RootVNode";

import { Props, VNode } from "./types";
import {
  isEventProp,
  setElementAttr,
  setElementProp,
  setElementStyle,
  setElementClass,
} from "./dom-utils";
import { diffObjectKeys } from "./utils";

export class ElementVNode extends AbstractVNode {
  tag: string;
  props: Props;
  children: VNode[];
  key?: string;
  private ref?: <U extends HTMLElement>(node: U) => (() => void) | void;
  private eventListeners?: Record<string, () => void>;
  constructor(
    tag: string,
    { ref, ...props }: Props,
    children: VNode[],
    key?: string
  ) {
    super();
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.key = key;
    this.ref = ref as any;
  }
  rerender(): void {
    this.syncDOMChildren();
  }
  mount(parent?: VNode): Node {
    this.parent = parent;

    if (parent instanceof RootVNode) {
      this.root = parent;
    } else {
      this.root = parent?.root;
    }

    const elm = (this.elm = document.createElement(this.tag));

    for (const prop in this.props) {
      this.setProp(prop, this.props[prop]);
    }

    if (this.ref) {
      const ref = this.ref;
      this.root?.queueMount(() => {
        ref(elm);
      });
    }

    this.children.forEach((child) => {
      const childrenElms = child.mount(this);

      if (Array.isArray(childrenElms)) {
        childrenElms.forEach((node) => this.elm!.appendChild(node));
      } else {
        elm.appendChild(childrenElms);
      }
    });

    return elm;
  }
  /**
   * An ELEMENT patch goes through three operations
   * - Patch or replace the element
   * - Patch the children
   */
  patch(newNode: ElementVNode) {
    this.patchProps(newNode.props);
    this.props = newNode.props;
    const { children, hasChangedStructure } = this.patchChildren(
      newNode.children
    );
    this.children = children;

    if (hasChangedStructure) {
      this.syncDOMChildren();
    }
  }
  unmount() {
    this.children.forEach((child) => child.unmount());
    this.root?.queueUnmount(() => {
      if (this.eventListeners) {
        for (const type in this.eventListeners) {
          this.elm!.removeEventListener(type, this.eventListeners[type]);
        }
      }
      delete this.elm;
      delete this.parent;
    });
  }
  private setProp = (prop: string, value: any) => {
    const elm = this.getHTMLElement();

    if (prop === "children") {
      return;
    }

    if (prop === "class") {
      setElementClass(elm, value as string | Record<string, boolean>);
      return;
    }

    // Skip className if class is present (class takes precedence)
    if (prop === "className" && "class" in this.props) {
      return;
    }

    if (prop === "style") {
      setElementStyle(elm, value);
      return;
    }

    if (prop.startsWith("data-") || prop.startsWith("aria-")) {
      setElementAttr(elm, prop, value as string);
      return;
    }

    if (isEventProp(prop)) {
      this.addEventListener(
        prop.slice(2).toLowerCase(),
        value as (() => void) | null
      );
      return;
    }

    setElementProp(elm, prop, value);
  };
  private patchProps(newProps: Props) {
    diffObjectKeys(this.props, newProps, this.setProp);
  }
  private addEventListener(type: string, cb: (() => void) | null) {
    if (!this.eventListeners) {
      this.eventListeners = {};
    }

    if (this.eventListeners[type]) {
      this.elm!.removeEventListener(type, this.eventListeners[type]);
    }

    if (typeof cb === "function") {
      this.elm!.addEventListener(type, cb);
      this.eventListeners[type] = cb;
    } else {
      delete this.eventListeners[type];
    }
  }
  /**
   * Intelligently sync DOM to match children VNode order.
   * Only performs DOM operations when elements are out of position.
   * This is used by both patch() and rerender() to efficiently update children.
   */
  private syncDOMChildren() {
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

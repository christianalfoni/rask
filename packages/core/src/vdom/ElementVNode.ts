import {
  AbstractVNode,
  flushPendingLifecycle,
  queueUnmount,
} from "./AbstractVNode";
import { ComponentVNode } from "./ComponentVNode";
import { FragmentVNode } from "./FragmentVNode";

import { Props, VNode } from "./types";
import {
  elementsToFragment,
  isEventProp,
  setElementAttr,
  setElementProp,
  setElementStyle,
} from "./dom-utils";
import { diffObjectKeys } from "./utils";
import { TextVNode } from "./TextVNode";

export class ElementVNode extends AbstractVNode {
  tag: string;
  props: Props;
  children: VNode[];
  key?: string;
  private eventListeners?: Record<string, () => void>;
  constructor(tag: string, props: Props, children: VNode[], key?: string) {
    super();
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.key = key;
  }
  updateChildren(prevNode: VNode, newNode: VNode): void {
    this.children.splice(this.children.indexOf(prevNode), 1, newNode);
    const childrenElms = this.children
      .map((child) => child.getElements())
      .flat();

    (this.elm as HTMLElement).replaceChildren(...childrenElms);
  }
  mount(parent?: VNode): Node {
    this.parent = parent;
    const elm = (this.elm = document.createElement(this.tag));

    // Apply props during mount
    this.patchProps({});

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
  patch(prevNode: VNode, isRootPatch: boolean = true) {
    if (prevNode === this) {
      return;
    }

    this.parent = prevNode.parent;

    if (prevNode instanceof ElementVNode) {
      if (prevNode.tag !== this.tag) {
        const elm = (this.elm = document.createElement(this.tag));
        this.patchProps({});
        const childrenElms = this.patchChildren(prevNode.children);

        elm.appendChild(elementsToFragment(childrenElms));

        prevNode.getParentElement().replaceChild(elm, prevNode.elm!);
        prevNode.unmount();
      } else {
        this.elm = prevNode.elm!;
        this.patchProps(prevNode.props);

        const childrenElms = this.patchChildren(prevNode.children);

        (this.elm as HTMLElement).replaceChildren(...childrenElms);

        prevNode.unmount();
      }
    } else {
      const elm = (this.elm = document.createElement(this.tag));
      this.patchProps({});
      const childrenElms = this.patchChildren(prevNode.children);
      elm.appendChild(elementsToFragment(childrenElms));

      if (prevNode instanceof TextVNode) {
        prevNode.getParentElement().replaceChild(elm, prevNode.elm!);
      } else {
        // What if previous was a component or fragment?
      }

      prevNode.unmount();
    }

    if (isRootPatch) {
      flushPendingLifecycle();
    }
  }
  unmount() {
    queueUnmount(() => {
      if (this.eventListeners) {
        for (const type in this.eventListeners) {
          this.elm!.removeEventListener(type, this.eventListeners[type]);
        }
      }
      delete this.elm;
      delete this.parent;
    });
  }
  private patchProps(prevProps: Props) {
    const elm = this.getHTMLElement();

    diffObjectKeys(prevProps, this.props, (prop, value) => {
      if (prop === "children") {
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
        this.addEventListener(prop.slice(2).toLowerCase(), value as () => void);
        return;
      }

      setElementProp(elm, prop, value);
    });
  }
  private addEventListener(type: string, cb: () => void) {
    if (!this.eventListeners) {
      this.eventListeners = {};
    }

    if (this.eventListeners[type]) {
      this.elm!.removeEventListener(type, this.eventListeners[type]);
    }

    this.elm!.addEventListener(type, cb);
    this.eventListeners[type] = cb;
  }
}

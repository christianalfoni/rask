import { createState } from "../createState";
import { getCurrentObserver, Observer, Signal } from "../observation";
import {
  AbstractVNode,
  flushPendingLifecycle,
  queueUnmount,
} from "./AbstractVNode";
import { ElementVNode } from "./ElementVNode";
import { FragmentVNode } from "./FragmentVNode";
import { Props, VNode } from "./types";
import { normalizeChildren } from "./utils";

export type ComponentChild =
  | VNode
  | string
  | null
  | number
  | undefined
  | boolean;
export type ComponentChildren = ComponentChild | ComponentChild[];

/**
 * Component function type. Components receive reactive props that should not be destructured.
 *
 * @warning **Do not destructure props!** Props are wrapped in a reactive proxy, and destructuring
 * breaks reactivity. This is the same rule as Solid.js.
 *
 * @example
 * // ❌ Bad - destructuring props loses reactivity
 * function MyComponent({ count, name }) {
 *   return () => <div>{count} {name}</div>; // Won't update!
 * }
 *
 * // ✅ Good - access props directly in render
 * function MyComponent(props) {
 *   return () => <div>{props.count} {props.name}</div>; // Reactive!
 * }
 */
export type Component<P extends Props> =
  | ((props: P) => () => ComponentChildren)
  | (() => () => ComponentChildren);

export type ComponentInstance = {
  parent?: VNode;
  contexts: Map<object, object> | null;
  onCleanups: Array<() => void>;
  observer: Observer;
  reactiveProps: object;
  error: unknown;
  notifyError(error: unknown): void;
};

const componentStack: ComponentInstance[] = [];

export function getCurrentComponent() {
  return componentStack[0] || null;
}

export function onCleanup(cb: () => void) {
  const current = componentStack[0];

  if (!current) {
    throw new Error("Only use onCleanup in component setup");
  }

  current.onCleanups.push(cb);
}

export class ComponentVNode extends AbstractVNode {
  component: Component<any>;
  props: Props;
  // These are the actual current children returned by component
  children: VNode[] = [];
  instance?: ComponentInstance;
  constructor(
    component: Component<any>,
    props: Props,
    children: VNode[],
    key?: string
  ) {
    super();
    this.component = component;
    this.props = {
      ...props,
      children,
    };
    this.children = [];
    this.key = key;
  }
  updateChildren(prevNode: VNode, nextNode: VNode): void {
    this.children.splice(this.children.indexOf(prevNode), 1, nextNode);
    this.parent?.updateChildren(this, this);
  }
  mount(parent?: VNode): Node[] {
    this.parent = parent;

    let errorSignal: Signal | undefined;
    let error: unknown;

    const executeRender = (): VNode[] => {
      const stopObserving = instance.observer.observe();
      let renderResult: ComponentChildren = new FragmentVNode([]);
      try {
        renderResult = render();
      } catch (error) {
        instance.notifyError(error);
      } finally {
        stopObserving();
      }

      return normalizeChildren(renderResult);
    };

    const instance = (this.instance = {
      parent,
      contexts: null,
      onCleanups: [],
      observer: new Observer(() => {
        const prevChildren = this.children;
        this.children = executeRender();
        this.patchChildren(prevChildren);
        this.parent?.updateChildren(this, this);
        flushPendingLifecycle();
      }),
      reactiveProps: createState(this.props),
      get error() {
        if (!errorSignal) {
          errorSignal = new Signal();
        }
        const observer = getCurrentObserver();
        if (observer) {
          observer.subscribeSignal(errorSignal);
        }
        return error;
      },
      notifyError(childError) {
        if (errorSignal) {
          error = childError;
          errorSignal.notify();
        } else if (instance.parent) {
          let parent: VNode | undefined = instance.parent;

          while (!(parent instanceof ComponentVNode)) {
            parent = parent?.parent;
          }

          parent.instance?.notifyError(childError);
        } else {
          throw childError;
        }
      },
    });

    componentStack.unshift(instance);
    const render = this.component(instance.reactiveProps);
    this.children = executeRender();

    return this.children.map((child) => child.mount(this)).flat();
  }
  patch(prevNode: VNode, isRootPatch: boolean = true) {
    if (prevNode === this) {
      return;
    }

    this.parent = prevNode.parent;

    componentStack.unshift(this.instance!);

    if (prevNode instanceof ElementVNode) {
      this.mount(this.parent);
      prevNode.unmount();
    } else if (prevNode instanceof FragmentVNode) {
      this.mount(this.parent);
      prevNode.unmount();
    } else if (
      prevNode instanceof ComponentVNode &&
      this.component === prevNode.component
    ) {
      this.instance = prevNode.instance;
      this.children = prevNode.children;
      for (const prop in this.props) {
        (this.instance!.reactiveProps as any)[prop] = this.props[prop];
      }
    } else if (prevNode instanceof ComponentVNode) {
      this.mount(this.parent);
      prevNode.unmount();
    }

    componentStack.shift();

    if (isRootPatch) {
      flushPendingLifecycle();
    }
  }
  unmount() {
    this.children.forEach((child) => child.unmount());
    queueUnmount(() => {
      this.instance!.onCleanups.forEach((cb) => cb());
    });
  }
}

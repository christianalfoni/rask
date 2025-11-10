import { getCurrentObserver, Observer, Signal } from "../observation";
import { AbstractVNode } from "./AbstractVNode";
import { FragmentVNode } from "./FragmentVNode";
import { RootVNode } from "./RootVNode";
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
  contexts: Map<object, unknown> | null;
  onMounts: Array<() => void>;
  onCleanups: Array<() => void>;
  observer: Observer;
  reactiveProps: object;
  error: unknown;
  notifyError(error: unknown): void;
};

import { currentRoot } from "./RootVNode";
import { ElementVNode } from "./ElementVNode";

export function getCurrentComponent() {
  if (!currentRoot) {
    throw new Error("No current root");
  }

  const currentComponent = currentRoot.componentStack[0];

  if (!currentComponent) {
    throw new Error("No current component");
  }

  return currentComponent;
}

export function onMount(cb: () => void) {
  if (!currentRoot) {
    throw new Error("Only use onCleanup in component setup");
  }

  const current = currentRoot.componentStack[0];

  if (!current) {
    throw new Error("Only use onCleanup in component setup");
  }

  current.onMounts.push(cb);
}

export function onCleanup(cb: () => void) {
  if (!currentRoot) {
    throw new Error("Only use onCleanup in component setup");
  }

  const current = currentRoot.componentStack[0];

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
  rerender(): void {
    this.parent?.rerender();
  }
  mount(parent?: VNode): Node[] {
    this.parent = parent;

    if (parent instanceof RootVNode) {
      this.root = parent;
    } else {
      this.root = parent?.root;
    }

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

    let isObserverQueued = false;

    const instance = (this.instance = {
      parent,
      contexts: null,
      onCleanups: [],
      onMounts: [],
      observer: new Observer(() => {
        if (isObserverQueued) {
          return;
        }

        isObserverQueued = true;

        this.root?.queueObserver(() => {
          if (instance.observer.isDisposed) {
            return;
          }

          isObserverQueued = false;

          this.root?.setAsCurrent();
          const newChildren = executeRender();
          const prevChildren = this.children;
          const { children, hasChangedStructure } =
            this.patchChildren(newChildren);

          this.children = children;

          if (hasChangedStructure) {
            this.parent?.rerender();
          }

          this.root?.clearCurrent();
        });
      }),
      reactiveProps: createReactiveProps(this.props),
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

          while (parent && !(parent instanceof ComponentVNode)) {
            parent = parent?.parent;
          }

          // Only call notifyError if we found a ComponentVNode parent
          if (parent instanceof ComponentVNode) {
            parent.instance?.notifyError(childError);
          }
          // Otherwise there's no ErrorBoundary, so do nothing
        } else {
          throw childError;
        }
      },
    });

    this.root?.setAsCurrent();
    this.root?.pushComponent(instance);
    const render = this.component(instance.reactiveProps);

    // Validate that render is a function
    if (typeof render !== "function") {
      const initError = new Error(
        `Component must return a render function, but got ${
          (render as any) instanceof AbstractVNode ? "JSX" : typeof render
        }. ` +
          `Components should return a function that returns JSX: \`return () => <div>...</div>\``
      );
      console.error("Error initializing component:", initError);
      error = initError;
      instance.notifyError(initError);
      this.root?.popComponent();
      this.root?.clearCurrent();
      return [];
    }

    this.children = executeRender();
    this.root?.popComponent();
    this.root?.clearCurrent();

    const childElements = this.children
      .map((child) => child.mount(this))
      .flat();

    // Queue onMount callbacks after children are mounted
    // This ensures refs and other child lifecycle hooks run before parent onMount
    instance.onMounts.forEach((cb) => {
      this.root?.queueMount(cb);
    });

    return childElements;
  }
  patch(newNode: ComponentVNode) {
    this.root?.setAsCurrent();
    this.root?.pushComponent(this.instance!);

    for (const prop in newNode.props) {
      (this.instance!.reactiveProps as any)[prop] = newNode.props[prop];
    }

    this.root?.popComponent();
    this.root?.clearCurrent();
  }
  unmount() {
    this.instance!.observer.dispose();
    this.children.forEach((child) => child.unmount());
    this.root?.queueUnmount(() => {
      this.instance!.onCleanups.forEach((cb) => {
        try {
          cb();
        } catch (error) {
          // Log error but continue executing remaining cleanups
          console.error("Error during cleanup:", error);
        }
      });
    });
  }
}

function createReactiveProps(props: Record<string, unknown>) {
  const reactiveProps = {} as any;

  for (const prop in props) {
    const signal = new Signal();
    Object.defineProperty(reactiveProps, prop, {
      get() {
        const observer = getCurrentObserver();

        if (observer) {
          observer.subscribeSignal(signal);
        }

        return props[prop];
      },
      set(value) {
        if (props[prop] !== value) {
          props[prop] = value;
          signal.notify();
        }
      },
    });
  }

  return reactiveProps;
}

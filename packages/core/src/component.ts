import { thunk, type VNode, type VNodeData } from "snabbdom";

import { getCurrentObserver, Observer, Signal } from "./observation";
import { jsx, patch, ChildNode } from "./render";
import { createState } from "./createState";

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
export type Component<P> = ((props: P) => () => VNode) | (() => () => VNode);

export type ComponentInstance = {
  parent: ComponentInstance | null;
  component: Component<any>;
  contexts: Map<object, object> | null;
  onMounts: Array<() => void>;
  onCleanups: Array<() => void>;
  hostNode?: VNode;
  observer: Observer;
  reactiveProps: object;
  error: unknown;
  notifyError(error: unknown): void;
};

const componentStack: ComponentInstance[] = [];

export function getCurrentComponent() {
  return componentStack[0] || null;
}

export function onMount(cb: () => void) {
  const current = componentStack[0];

  if (!current) {
    throw new Error("Only use onMount in component setup");
  }

  current.onMounts.push(cb);
}

export function onCleanup(cb: () => void) {
  const current = componentStack[0];

  if (!current) {
    throw new Error("Only use onCleanup in component setup");
  }

  current.onCleanups.push(cb);
}

const hook = {
  insert(vnode: VNode & { data: { componentInstance: ComponentInstance } }) {
    componentStack.shift();
    vnode.data.componentInstance.onMounts.forEach((cb) => cb());
  },
  destroy(vnode: VNode & { data: { componentInstance: ComponentInstance } }) {
    vnode.data.componentInstance.onCleanups.forEach((cb) => cb());
  },
  prepatch(oldVnode: VNode, thunk: VNode): void {
    copyToThunk(oldVnode, thunk);
    componentStack.unshift(thunk.data!.componentInstance);
  },
  postpatch(_: VNode, newNode: VNode) {
    const componentInstance = newNode.data!.componentInstance;
    componentStack.shift();
    const props = newNode.data!.args![0];
    const children = newNode.data!.args![1];

    for (const key in props) {
      componentInstance.reactiveProps[key] = props[key];
    }

    componentInstance.reactiveProps.children = children;
  },
  init(thunk: VNode) {
    const component = thunk.data!.fn! as unknown as Component<any>;
    const args = thunk.data!.args!;
    let errorSignal: Signal | undefined;
    let error: unknown;

    const executeRender = () => {
      const stopObserving = instance.observer.observe();
      let renderResult = null;
      try {
        renderResult = render();
      } catch (error) {
        instance.notifyError(error);
      } finally {
        stopObserving();
      }

      return jsx(
        "component",
        {
          hook: {
            insert: hook.insert,
            destroy: hook.destroy,
          },
          "data-name": component.name,
        },
        Array.isArray(renderResult) ? renderResult : [renderResult]
      );
    };

    const instance: ComponentInstance = {
      parent: thunk.data!.parentComponent || null,
      component,
      contexts: null,
      onMounts: [],
      onCleanups: [],
      observer: new Observer(() => {
        const renderResult = executeRender();

        instance.hostNode = patch(instance.hostNode!, renderResult);
      }),
      reactiveProps: createState({
        ...args![0],
        children: args![1],
      }),
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
          instance.parent.notifyError(childError);
        } else {
          throw childError;
        }
      },
    };

    componentStack.unshift(instance);
    const render = component(instance.reactiveProps);
    const renderResult = executeRender();

    renderResult.data!.componentInstance = instance;
    copyToThunk(renderResult, thunk);
    instance.hostNode = thunk;
  },
};

export function createComponent(
  component: Component<any>,
  props: Record<string, unknown>,
  children: ChildNode[] | ChildNode
) {
  const thunkNode = thunk("component", props.key, component, [props, children]);

  Object.assign(thunkNode.data.hook!, hook);

  // Capture the parent component at vnode creation time (during render)
  // rather than at init time, to ensure correct parent relationships
  thunkNode.data.parentComponent = getCurrentComponent();

  return thunkNode;
}

function copyToThunk(vnode: VNode, thunk: VNode): void {
  (vnode.data as VNodeData).fn = (thunk.data as VNodeData).fn;
  (vnode.data as VNodeData).args = (thunk.data as VNodeData).args;
  thunk.data = vnode.data;
  thunk.children = vnode.children;
  thunk.text = vnode.text;
  thunk.elm = vnode.elm;
}

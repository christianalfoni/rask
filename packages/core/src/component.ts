import { thunk, type VNode, type VNodeData } from "snabbdom";

import { getCurrentObserver, Observer, Signal } from "./observation";
import { jsx, patch } from "./render";
import { createState } from "./createState";

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
  renderError: unknown;
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
    console.log("INSERT", vnode.data.componentInstance.component.name);
    componentStack.shift();
    vnode.data.componentInstance.onMounts.forEach((cb) => cb());
  },
  destroy(vnode: VNode & { data: { componentInstance: ComponentInstance } }) {
    console.log("DESTROY", vnode.data.componentInstance.component.name);
    componentStack.shift();
    vnode.data.componentInstance.onCleanups.forEach((cb) => cb());
  },
  prepatch(oldVnode: VNode, thunk: VNode): void {
    copyToThunk(oldVnode, thunk);
    console.log("PREPATCH", thunk.data!.componentInstance.component.name);
    componentStack.unshift(thunk.data!.componentInstance);
  },
  postpatch(_: VNode, newNode: VNode) {
    const componentInstance = newNode.data!.componentInstance;
    console.log("POSTPATCH", componentInstance.component.name);
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
    // Implement a value to signals, then optionally create an error signal
    const renderErrorSignal = new Signal();
    let renderError: boolean = false;

    const executeRender = () => {
      const stopObserving = instance.observer.observe();
      const renderResult = render();
      stopObserving();

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
      parent: getCurrentComponent(),
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
      get renderError() {
        const observer = getCurrentObserver();
        if (observer) {
          observer.subscribeSignal(renderErrorSignal);
        }
        return renderError;
      },
      set renderError(value) {
        renderError = value;
        renderErrorSignal.notify();
      },
    };

    componentStack.unshift(instance);
    const render = component(instance.reactiveProps);
    instance.hostNode = executeRender();

    instance.hostNode!.data!.componentInstance = instance;

    copyToThunk(instance.hostNode!, thunk);
  },
};

export function createComponent(
  component: Component<any>,
  props: Record<string, unknown>,
  children: VNode[] | VNode
) {
  const thunkNode = thunk("component", props.key, component, [props, children]);

  Object.assign(thunkNode.data.hook!, hook);

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

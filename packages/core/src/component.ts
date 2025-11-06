import { thunk, type VNode, type VNodeData } from "snabbdom";

import { Observer } from "./observation";
import { jsx, patch } from "./render";
import { createState } from "./createState";
import { SuspensePromise } from "./suspense";

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
  notifyAsync: (promise: SuspensePromise<any>) => void;
  onAsync: (cb: (promise: SuspensePromise<any>) => void) => void;
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
    console.log("PREPATCH", thunk.data!.componentInstance.component.name);
    componentStack.unshift(thunk.data!.componentInstance);
    copyToThunk(oldVnode, thunk);
  },
  postpatch(_: VNode, newNode: VNode) {
    console.log("POSTPATCH", newNode.data!.componentInstance.component.name);
    componentStack.shift();
    const props = newNode.data!.args![0];

    for (const key in props) {
      newNode.data!.componentInstance.reactiveProps[key] = props[key];
    }
  },
  init(thunk: VNode) {
    const component = thunk.data!.fn! as unknown as Component<any>;
    const args = thunk.data!.args!;
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
        },
        Array.isArray(renderResult) ? renderResult : [renderResult]
      );
    };
    let asyncListener: ((promise: SuspensePromise<any>) => void) | undefined;
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
      notifyAsync(promise) {
        if (asyncListener) {
          asyncListener(promise);
        } else if (this.parent) {
          this.parent.notifyAsync(promise);
        } else {
          throw new Error("No suspense boundary found");
        }
      },
      onAsync(cb) {
        asyncListener = cb;
      },
    };
    console.log(
      "INIT",
      instance.component.name,
      getCurrentComponent()?.component.name
    );
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

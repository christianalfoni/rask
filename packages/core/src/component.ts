import {
  createComponentVNode,
  VNode,
  Component,
  Props,
  InfernoNode,
} from "inferno";
import { VNodeFlags } from "inferno-vnode-flags";
import { getCurrentObserver, Observer, Signal } from "./observation";

let currentComponent: RaskComponent<any> | undefined;

export function getCurrentComponent() {
  if (!currentComponent) {
    throw new Error("No current component");
  }

  return currentComponent;
}

export function onMount(cb: () => void) {
  if (!currentComponent) {
    throw new Error("Only use onCleanup in component setup");
  }

  currentComponent.onMounts.push(cb);
}

export function onCleanup(cb: () => void) {
  if (!currentComponent) {
    throw new Error("Only use onCleanup in component setup");
  }

  currentComponent.onCleanups.push(cb);
}

export type RaskFunctionComponent<P extends Props<any>> =
  | (() => () => VNode)
  | ((props: P) => () => VNode);

class RaskComponent<P extends Props<any>> extends Component<
  P & { __component: RaskFunctionComponent<P> }
> {
  private renderFn?: () => VNode;
  private reactiveProps?: Props<any>;
  private prevChildren: any;
  private observer = new Observer(() => {
    this.forceUpdate();
  });
  contexts = new Map();
  getChildContext() {
    const parentGetContext = this.context.getContext;

    return {
      ...this.context,
      getContext: (context: any) => {
        return this.contexts.get(context) || parentGetContext(context);
      },
    };
  }
  onMounts: Array<() => void> = [];
  onCleanups: Array<() => void> = [];
  componentDidMount(): void {
    this.onMounts.forEach((cb) => cb());
  }
  componentWillReceiveProps(
    nextProps: Readonly<
      { children?: InfernoNode } & P & { __component: RaskFunctionComponent<P> }
    >
  ): void {
    if (this.props.children === nextProps.children) {
      for (const prop in nextProps) {
        if (prop === "children") {
          continue;
        }
        // @ts-ignore
        this.reactiveProps[prop] = nextProps[prop];
      }
    } else {
      this.prevChildren = this.props.children;
    }
  }
  componentWillUnmount(): void {
    this.onCleanups.forEach((cb) => cb());
  }
  shouldComponentUpdate(): boolean {
    return this.prevChildren !== this.props.children;
  }
  render() {
    if (!this.renderFn) {
      this.reactiveProps = createReactiveProps(this.props);
      currentComponent = this;
      try {
        this.renderFn = this.props.__component(this.reactiveProps as any);

        if (typeof this.renderFn !== "function") {
          throw new Error("Component must return a render function");
        }
      } catch (error) {
        if (typeof this.context.notifyError !== "function") {
          throw error;
        }

        this.context.notifyError(error);

        return null;
      }
      currentComponent = undefined;
    }

    const stopObserving = this.observer.observe();
    let result: any = null;

    try {
      result = this.renderFn();
    } catch (error) {
      if (typeof this.context.notifyError !== "function") {
        throw error;
      }

      this.context.notifyError(error);
    } finally {
      stopObserving();
    }

    return result;
  }
}

export function createComponent(props: Props<any>, key?: string) {
  console.log(props);
  return createComponentVNode(
    VNodeFlags.ComponentClass,
    RaskComponent,
    props as any,
    key
  );
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

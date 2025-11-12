import { createComponentVNode, VNode, Component, Props } from "inferno";
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
  private observer = new Observer(() => {
    this.forceUpdate();
  });
  private isRendering = false;
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
  private createReactiveProps() {
    const reactiveProps = {} as any;
    const self = this;
    for (const prop in this.props) {
      const signal = new Signal();
      // @ts-ignore
      let reactiveValue = this.props[prop];
      Object.defineProperty(reactiveProps, prop, {
        get() {
          if (!self.isRendering) {
            const observer = getCurrentObserver();

            if (observer) {
              observer.subscribeSignal(signal);
            }
          }

          // @ts-ignore
          return self.props[prop];
        },
        set(value) {
          if (reactiveValue !== value) {
            reactiveValue = value;
            signal.notify();
          }
        },
      });
    }

    return reactiveProps;
  }

  componentDidMount(): void {
    this.onMounts.forEach((cb) => cb());
  }
  componentWillUnmount(): void {
    this.onCleanups.forEach((cb) => cb());
  }
  componentDidUpdate() {
    for (const prop in this.props) {
      if (prop === "__component" || prop === "children") {
        continue;
      }

      // @ts-ignore
      this.reactiveProps[prop] = this.props[prop];
    }
  }
  shouldComponentUpdate(nextProps: Props<any>): boolean {
    // Shallow comparison of props, excluding internal props
    for (const prop in nextProps) {
      if (prop === "__component") {
        continue;
      }

      // @ts-ignore
      if (this.props[prop] !== nextProps[prop]) {
        return true;
      }
    }

    return false;
  }
  render() {
    if (!this.renderFn) {
      this.reactiveProps = this.createReactiveProps();
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
      this.isRendering = true;
      result = this.renderFn();
      this.isRendering = false;
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
  return createComponentVNode(
    VNodeFlags.ComponentClass,
    RaskComponent,
    props as any,
    key
  );
}

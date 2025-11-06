import { VNode } from "snabbdom";
import { getCurrentComponent } from "./component";
import { createState } from "./createState";
import { getCurrentObserver, Signal } from "./observation";

export function createSuspense<T extends Record<string, Promise<any>>>(
  promises: T
): {
  [K in keyof T]: Awaited<T[K]>;
} {
  let currentComponent = getCurrentComponent();

  if (!currentComponent) {
    throw new Error("createSuspense must be used in the setup of a component");
  }

  const proxy = {} as any;

  for (const key in promises) {
    const promise = promises[key];
    const suspensePromise = isSuspensePromise(promise)
      ? promise
      : createSuspensePromise(promise);
    currentComponent.notifyAsync(suspensePromise);
    Object.defineProperty(proxy, key, {
      get() {
        return suspensePromise.value;
      },
    });
  }

  return proxy;
}

function isSuspensePromise<T>(
  promise: Promise<T>
): promise is SuspensePromise<T> {
  return "status" in promise;
}

export function Suspense(props: {
  fallback: VNode;
  children: VNode | VNode[];
}) {
  const currentComponent = getCurrentComponent();
  const state = createState<{ suspendingPromises: SuspensePromise<any>[] }>({
    suspendingPromises: [],
  });

  currentComponent.onAsync((promise) => {
    state.suspendingPromises = state.suspendingPromises.concat(promise);
  });

  return () => {
    const isAllResolved = state.suspendingPromises.every(
      (promise) => promise.status === "resolved"
    );

    console.log(isAllResolved);

    return isAllResolved ? props.children : props.fallback;
  };
}

type SuspensePromiseState<T> =
  | {
      status: "pending";
      value: null;
      error: null;
    }
  | {
      status: "resolved";
      value: T;
      error: null;
    }
  | {
      status: "rejected";
      value: null;
      error: string;
    };

export type SuspensePromise<T> = Promise<T> & SuspensePromiseState<T>;

export function createSuspensePromise<T>(
  promise: Promise<T>
): SuspensePromise<T> {
  const signal = new Signal();
  const state: SuspensePromiseState<T> = {
    error: null,
    status: "pending",
    value: null,
  };
  Object.defineProperty(promise, "value", {
    get() {
      const observer = getCurrentObserver();

      if (observer) {
        observer.subscribeSignal(signal);
      }

      return state.value;
    },
    set(newValue) {
      state.value = newValue;
      signal.notify();
    },
  });
  Object.defineProperty(promise, "error", {
    get() {
      const observer = getCurrentObserver();

      if (observer) {
        observer.subscribeSignal(signal);
      }

      return state.error;
    },
  });
  Object.defineProperty(promise, "status", {
    get() {
      const observer = getCurrentObserver();

      if (observer) {
        observer.subscribeSignal(signal);
      }

      return state.status;
    },
  });

  promise
    .then((value) => {
      Object.assign(state, {
        value,
        error: null,
        status: "resolved",
      });
      signal.notify();
    })
    .catch((error) => {
      Object.assign(state, {
        value: null,
        error: String(error),
        status: "rejected",
      });
      signal.notify();
    });

  return promise as any;
}

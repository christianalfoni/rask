import { getCurrentObserver, Signal } from "./observation";

export function createState<T extends object>(state: T): T {
  const proxy = {} as any;
  for (const key in state) {
    const signal = new Signal();
    Object.defineProperty(proxy, key, {
      get() {
        const observer = getCurrentObserver();

        if (observer) {
          observer.subscribeSignal(signal);
        }

        return state[key];
      },
      set(value) {
        state[key] = value;
        signal.notify();
      },
    });
  }

  return proxy;
}

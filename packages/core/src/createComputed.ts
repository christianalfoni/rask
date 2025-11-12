import { getCurrentComponent, onCleanup } from "./component";
import { getCurrentObserver, Observer, Signal } from "./observation";

export function createComputed<T extends Record<string, () => any>>(
  computed: T
): {
  [K in keyof T]: ReturnType<T[K]>;
} {
  const currentComponent = getCurrentComponent();
  const proxy = {};

  for (const prop in computed) {
    let isDirty = true;
    let value: any;
    const signal = new Signal();
    const observer = new Observer(() => {
      isDirty = true;
      signal.notify();
    });

    if (currentComponent) {
      onCleanup(() => observer.dispose());
    }

    Object.defineProperty(proxy, prop, {
      get() {
        const observer = getCurrentObserver();

        if (observer) {
          observer.subscribeSignal(signal);
        }

        if (isDirty) {
          const stopObserving = observer.observe();
          value = computed[prop]();
          stopObserving();
          return value;
        }

        return value;
      },
    });
  }

  return proxy as any;
}

import { getCurrentObserver, Signal } from "./observation";

/**
 * Creates a reactive state object that tracks property access and notifies observers on changes.
 *
 * @warning **Do not destructure the returned reactive object!** Destructuring breaks reactivity
 * because it extracts plain values instead of maintaining proxy access. This is the same rule
 * as Solid.js signals.
 *
 * @example
 * // ❌ Bad - destructuring loses reactivity
 * function Component(props) {
 *   const state = createState({ count: 0, name: "foo" });
 *   const { count, name } = state; // Don't do this!
 *   return () => <div>{count} {name}</div>; // Won't update!
 * }
 *
 * // ✅ Good - access properties directly in render
 * function Component(props) {
 *   const state = createState({ count: 0, name: "foo" });
 *   return () => <div>{state.count} {state.name}</div>; // Reactive!
 * }
 *
 * @param state - The initial state object to make reactive
 * @returns A reactive proxy of the state object
 */
export function createState<T extends object>(state: T): T {
  return getProxy(state) as any;
}

const proxyCache = new WeakMap<any, any>();
const PROXY_MARKER = Symbol("isProxy");

function getProxy(value: object) {
  // Check if already a proxy to avoid double-wrapping
  if (PROXY_MARKER in value) {
    return value;
  }

  if (proxyCache.has(value)) {
    return proxyCache.get(value);
  }

  const signals: Record<string, Signal> = {};

  const proxy = new Proxy(value, {
    has(target, key) {
      // Support the "in" operator check for PROXY_MARKER
      if (key === PROXY_MARKER) {
        return true;
      }
      return Reflect.has(target, key);
    },
    get(target, key) {
      // Mark this as a proxy to prevent double-wrapping
      if (key === PROXY_MARKER) {
        return true;
      }

      const value = Reflect.get(target, key);

      if (typeof key === "symbol" || typeof value === "function") {
        return value;
      }

      const observer = getCurrentObserver();

      if (observer) {
        const signal = (signals[key] = signals[key] || new Signal());

        observer.subscribeSignal(signal);
      }

      if (
        Array.isArray(value) ||
        (typeof value === "object" && value !== null)
      ) {
        return getProxy(value);
      }

      return value;
    },
    set(target, key, newValue) {
      if (typeof key === "symbol") {
        return Reflect.set(target, key, newValue);
      }

      const oldValue = Reflect.get(target, key);

      const setResult = Reflect.set(target, key, newValue);
      // We only notify if actual change, though array length actually updates under the hood
      if (newValue !== oldValue || (Array.isArray(value) && key === "length")) {
        const signal = signals[key];
        signal?.notify();
      }

      return setResult;
    },
    deleteProperty(target, key) {
      if (typeof key === "symbol") {
        return Reflect.deleteProperty(target, key);
      }

      const signal = signals[key];

      signal?.notify();

      delete signals[key];

      return Reflect.deleteProperty(target, key);
    },
  });

  proxyCache.set(value, proxy);

  return proxy;
}

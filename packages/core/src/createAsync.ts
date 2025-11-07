import { createState } from "./createState";

type AsyncState<T> =
  | {
      isPending: true;
      value: null;
      error: null;
    }
  | {
      isPending: false;
      value: T;
      error: null;
    }
  | {
      isPending: false;
      value: null;
      error: string;
    };

/**
 * Creates a reactive async state that tracks the lifecycle of a promise.
 *
 * @warning **Do not destructure the returned reactive object!** Destructuring breaks reactivity.
 * Access properties directly in your render function instead.
 *
 * @example
 * // ❌ Bad - destructuring loses reactivity
 * function Component() {
 *   const async = createAsync(fetchData());
 *   const { isPending, value, error } = async; // Don't do this!
 *   return () => <div>{isPending ? "Loading..." : value}</div>; // Won't update!
 * }
 *
 * // ✅ Good - access properties directly
 * function Component() {
 *   const async = createAsync(fetchData());
 *   return () => <div>{async.isPending ? "Loading..." : async.value}</div>;
 * }
 *
 * @param promise - The promise to track
 * @returns Reactive state with isPending, value, and error properties
 */
export function createAsync<T>(promise: Promise<T>) {
  const state = createState<AsyncState<T>>({
    isPending: true,
    error: null,
    value: null,
  });

  promise
    .then((value) => {
      Object.assign(state, {
        value,
        error: null,
        isPending: false,
      });
    })
    .catch((error) => {
      Object.assign(state, {
        value: null,
        error: String(error),
        isPending: false,
      });
    });

  return state;
}

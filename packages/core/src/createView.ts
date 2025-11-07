type Simplify<T> = { [K in keyof T]: T[K] } & {};

type MergeTwo<A extends object, B extends object> = Simplify<
  Omit<A, keyof B> & B
>;

type MergeMany<T extends readonly object[]> = T extends [
  infer H extends object,
  ...infer R extends object[]
]
  ? MergeTwo<H, MergeMany<R>>
  : {};

/**
 * Creates a view that merges multiple objects (reactive or not) into a single object while
 * maintaining reactivity through getters. Properties from later arguments override earlier ones.
 *
 * @warning **Do not destructure the returned view object!** Destructuring breaks reactivity
 * because it extracts plain values instead of maintaining getter access. This is the same rule
 * as other reactive primitives.
 *
 * @example
 * // ❌ Bad - destructuring loses reactivity
 * function Component() {
 *   const state = createState({ count: 0 });
 *   const helpers = { increment: () => state.count++ };
 *   const view = createView(state, helpers);
 *   const { count, increment } = view; // Don't do this!
 *   return () => <button onClick={increment}>{count}</button>; // Won't update!
 * }
 *
 * // ✅ Good - access properties directly in render
 * function Component() {
 *   const state = createState({ count: 0 });
 *   const helpers = { increment: () => state.count++ };
 *   const view = createView(state, helpers);
 *   return () => <button onClick={view.increment}>{view.count}</button>; // Reactive!
 * }
 *
 * @example
 * // Merge multiple reactive objects
 * const state = createState({ count: 0 });
 * const user = createState({ name: "Alice" });
 * const view = createView(state, user);
 * // view has both count and name properties, maintaining reactivity
 *
 * @example
 * // Later arguments override earlier ones
 * const a = { x: 1, y: 2 };
 * const b = { y: 3, z: 4 };
 * const view = createView(a, b);
 * // view.x === 1, view.y === 3, view.z === 4
 *
 * @param args - Objects to merge (reactive or plain objects)
 * @returns A view object with getters for all properties, maintaining reactivity
 */
export function createView<T extends readonly object[]>(
  ...args: T
): MergeMany<T> {
  const result: any = {};
  const seen = new Set<PropertyKey>();

  for (let i = args.length - 1; i >= 0; i--) {
    const src = args[i];
    // mimic Object.assign: only enumerable own property keys
    for (const key of Reflect.ownKeys(src)) {
      if (seen.has(key)) continue;
      const desc = Object.getOwnPropertyDescriptor(src, key as any);
      if (!desc || !desc.enumerable) continue;

      // Capture the current source for this key (last write wins).
      Object.defineProperty(result, key, {
        enumerable: true,
        configurable: true,
        get: () => (src as any)[key as any],
        // Optional write-through (commented out by default):
        // set: (value) => { (src as any)[key as any] = value; },
      });

      seen.add(key);
    }
  }

  return result as MergeMany<T>;
}

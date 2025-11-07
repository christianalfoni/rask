import { getCurrentComponent, type ComponentInstance } from "./component";

/**
 * Creates a context object for providing and consuming values across component trees.
 *
 * @warning **Do not destructure context values returned by context.get()!** The returned
 * value may be a reactive object, and destructuring breaks reactivity.
 *
 * @example
 * // ❌ Bad - destructuring context value
 * const ThemeContext = createContext<{ color: string }>();
 *
 * function Consumer() {
 *   const theme = ThemeContext.get();
 *   const { color } = theme; // Don't do this!
 *   return () => <div style={{ color }}>Text</div>; // Won't update!
 * }
 *
 * // ✅ Good - access properties directly
 * function Consumer() {
 *   const theme = ThemeContext.get();
 *   return () => <div style={{ color: theme.color }}>Text</div>;
 * }
 *
 * @returns Context object with inject() and get() methods
 */
export function createContext<T extends object>() {
  const context = {
    inject(value: T) {
      const currentComponent = getCurrentComponent();

      if (!currentComponent) {
        throw new Error("You can not inject context outside component setup");
      }

      if (!currentComponent.contexts) {
        currentComponent.contexts = new Map();
      }

      currentComponent.contexts.set(context, value);
    },
    get(): T {
      let currentComponent: ComponentInstance | null = getCurrentComponent();

      if (!currentComponent) {
        throw new Error("You can not get context outside component setup");
      }

      while (currentComponent) {
        if (currentComponent.contexts?.has(context)) {
          return currentComponent.contexts.get(context) as T;
        }
        currentComponent = currentComponent.parent;
      }

      throw new Error("Could not find context in parent components");
    },
  };

  return context;
}

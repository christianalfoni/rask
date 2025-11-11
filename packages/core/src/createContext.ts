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

import { getCurrentComponent } from "./component";

export function createContext<T>() {
  const context = {
    inject(value: T) {
      const currentComponent = getCurrentComponent();

      if (!currentComponent) {
        throw new Error("You can not inject context outside component setup");
      }

      currentComponent.contexts.set(context, value);
    },
    get(): T {
      let currentComponent = getCurrentComponent();

      if (!currentComponent) {
        throw new Error("You can not get context outside component setup");
      }

      if (typeof (currentComponent.context as any).getContext !== "function") {
        throw new Error("There is no parent context");
      }

      const contextValue = (currentComponent.context as any).getContext(
        context
      );

      if (!contextValue) {
        throw new Error(
          "There is a parent context, but not the one you are using"
        );
      }

      return contextValue;
    },
  };

  return context;
}

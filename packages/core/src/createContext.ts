import { getCurrentComponent, type ComponentInstance } from "./component";

export function createContext<T extends object>() {
  const context = {
    set(value: T) {
      const currentComponent = getCurrentComponent();

      if (!currentComponent) {
        throw new Error("You can not set context out component setup");
      }

      if (!currentComponent.contexts) {
        currentComponent.contexts = new Map();
      }

      currentComponent.contexts.set(context, value);
    },
    get(): T {
      let currentComponent: ComponentInstance | null = getCurrentComponent();

      if (!currentComponent) {
        throw new Error("You can not set context out component setup");
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

import { describe, it, expect, vi } from "vitest";
import { onCleanup } from "./ComponentVNode";
import { jsx, render } from "./index";
import { createState } from "../createState";

describe("Component Cleanup", () => {
  it("should call onCleanup callback when component unmounts", async () => {
    const container = document.createElement("div");
    const cleanupFn = vi.fn();
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      onCleanup(cleanupFn);
      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () =>
        state.show ? jsx(MyComponent, {}) : jsx("div", { children: "Empty" });
    };

    render(jsx(App, {}), container);

    expect(cleanupFn).not.toHaveBeenCalled();

    // Hide component to trigger unmount
    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it("should call multiple onCleanup callbacks in order", async () => {
    const container = document.createElement("div");
    const calls: number[] = [];
    const cleanup1 = vi.fn(() => calls.push(1));
    const cleanup2 = vi.fn(() => calls.push(2));
    const cleanup3 = vi.fn(() => calls.push(3));
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      onCleanup(cleanup1);
      onCleanup(cleanup2);
      onCleanup(cleanup3);
      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(MyComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).toHaveBeenCalledTimes(1);
    expect(cleanup3).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([1, 2, 3]);
  });

  it("should cleanup event listeners", async () => {
    const container = document.createElement("div");
    const cleanupFn = vi.fn();
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      const button = document.createElement("button");
      button.addEventListener("click", cleanupFn);

      onCleanup(() => {
        button.removeEventListener("click", cleanupFn);
        cleanupFn();
      });

      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(MyComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    expect(cleanupFn).not.toHaveBeenCalled();

    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Cleanup function should be called
    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it("should cleanup intervals", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    const callback = vi.fn();
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      const intervalId = setInterval(callback, 1000);

      onCleanup(() => {
        clearInterval(intervalId);
      });

      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(MyComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2);

    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // After cleanup, interval should be cleared
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2); // Still 2, not 4

    vi.useRealTimers();
  });

  it("should cleanup timeouts", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    const callback = vi.fn();
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      const timeoutId = setTimeout(callback, 1000);

      onCleanup(() => {
        clearTimeout(timeoutId);
      });

      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(MyComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // After cleanup, timeout should be cleared
    vi.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should cleanup subscriptions", async () => {
    const container = document.createElement("div");
    const unsubscribe = vi.fn();
    const subscribe = vi.fn(() => unsubscribe);
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      const subscription = subscribe();

      onCleanup(() => {
        subscription();
      });

      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(MyComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();

    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should not call cleanup when component is still mounted", () => {
    const container = document.createElement("div");
    const cleanupFn = vi.fn();

    const MyComponent = () => {
      onCleanup(cleanupFn);
      return () => jsx("div", { children: "Component" });
    };

    render(jsx(MyComponent, {}), container);

    expect(cleanupFn).not.toHaveBeenCalled();
  });

  it("should call cleanup when component is replaced with different component", async () => {
    const container = document.createElement("div");
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();
    let stateFn: { showFirst: boolean } | undefined;

    const Component1 = () => {
      onCleanup(cleanup1);
      return () => jsx("div", { children: "Component 1" });
    };

    const Component2 = () => {
      onCleanup(cleanup2);
      return () => jsx("div", { children: "Component 2" });
    };

    const App = () => {
      const state = createState({ showFirst: true });
      stateFn = state;

      return () =>
        state.showFirst ? jsx(Component1, {}) : jsx(Component2, {});
    };

    render(jsx(App, {}), container);

    expect(cleanup1).not.toHaveBeenCalled();

    stateFn!.showFirst = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Component1 should be cleaned up when replaced with Component2
    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).not.toHaveBeenCalled();
  });

  it("should throw error when onCleanup is called outside component setup", () => {
    expect(() => {
      onCleanup(() => {});
    }).toThrow("Only use onCleanup in component setup");
  });

  it("should cleanup nested resources", async () => {
    const container = document.createElement("div");
    const outerCleanup = vi.fn();
    const innerCleanup = vi.fn();
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      const resource1 = { close: outerCleanup };
      onCleanup(() => resource1.close());

      const resource2 = { dispose: innerCleanup };
      onCleanup(() => resource2.dispose());

      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(MyComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(outerCleanup).toHaveBeenCalledTimes(1);
    expect(innerCleanup).toHaveBeenCalledTimes(1);
  });

  it("should handle cleanup errors gracefully", async () => {
    const container = document.createElement("div");
    const cleanup1 = vi.fn(() => {
      throw new Error("Cleanup error");
    });
    const cleanup2 = vi.fn();
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      onCleanup(cleanup1);
      onCleanup(cleanup2);
      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(MyComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    // Should throw when cleanup errors occur
    stateFn!.show = false;
    await expect(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }).rejects.toThrow("Cleanup error");

    expect(cleanup1).toHaveBeenCalledTimes(1);
  });

  it("should cleanup component with state and effects", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    const updateCallback = vi.fn();
    const cleanupFn = vi.fn();
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      const intervalId = setInterval(updateCallback, 100);

      onCleanup(() => {
        clearInterval(intervalId);
        cleanupFn();
      });

      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(MyComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    vi.advanceTimersByTime(500);
    expect(updateCallback).toHaveBeenCalledTimes(5);

    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(cleanupFn).toHaveBeenCalledTimes(1);

    // After cleanup, no more updates
    vi.advanceTimersByTime(500);
    expect(updateCallback).toHaveBeenCalledTimes(5);

    vi.useRealTimers();
  });

  it("should allow cleanup to access component closure variables", async () => {
    const container = document.createElement("div");
    let capturedValue: number | undefined;
    let stateFn: { show: boolean } | undefined;

    const MyComponent = () => {
      const value = 42;

      onCleanup(() => {
        capturedValue = value;
      });

      return () => jsx("div", { children: "Component" });
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(MyComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(capturedValue).toBe(42);
  });

  it.only("should cleanup parent and child components", async () => {
    const container = document.createElement("div");
    const parentCleanup = vi.fn();
    const childCleanup = vi.fn();
    let stateFn: { show: boolean } | undefined;

    const ChildComponent = () => {
      onCleanup(childCleanup);
      return () => jsx("span", { children: "Child" });
    };

    const ParentComponent = () => {
      onCleanup(parentCleanup);
      return () => jsx(ChildComponent, {});
    };

    const App = () => {
      const state = createState({ show: true });
      stateFn = state;

      return () => (state.show ? jsx(ParentComponent, {}) : null);
    };

    render(jsx(App, {}), container);

    expect(parentCleanup).not.toHaveBeenCalled();
    expect(childCleanup).not.toHaveBeenCalled();

    stateFn!.show = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(parentCleanup).toHaveBeenCalledTimes(1);
    expect(childCleanup).toHaveBeenCalledTimes(1);
  });
});

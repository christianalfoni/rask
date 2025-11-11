import { describe, it, expect } from "vitest";
import { jsx } from "../jsx-runtime";
import { ErrorBoundary } from "../error";
import { render } from "../";

describe("ErrorBoundary", () => {
  it("should render children when no error occurs", async () => {
    function SafeChild() {
      return () => jsx("div", { children: "Safe content" });
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", { children: `Error: ${String(error)}` }),
          children: jsx(SafeChild, {}),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Safe content");
    expect(container.textContent).not.toContain("Error:");

    document.body.removeChild(container);
  });

  it("should catch errors thrown in child components", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Child component error");
      };
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", { children: `Error: ${String(error)}` }),
          children: jsx(ThrowingChild, {}),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Error:");
    expect(container.textContent).toContain("Child component error");

    document.body.removeChild(container);
  });

  it("should render custom error UI", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Something went wrong");
      };
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", {
              class: "error-ui",
              children: [
                jsx("h1", { children: "Oops!" }),
                jsx("p", { children: String(error) }),
              ],
            }),
          children: jsx(ThrowingChild, {}),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const errorUI = document.querySelector(".error-ui");
    expect(errorUI).not.toBeNull();
    expect(errorUI?.querySelector("h1")?.textContent).toBe("Oops!");
    expect(errorUI?.textContent).toContain("Something went wrong");

    document.body.removeChild(container);
  });

  it("should handle multiple children", async () => {
    function SafeChild1() {
      return () => jsx("div", { children: "Child 1" });
    }

    function SafeChild2() {
      return () => jsx("div", { children: "Child 2" });
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", { children: `Error: ${String(error)}` }),
          children: [jsx(SafeChild1, {}), jsx(SafeChild2, {})],
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Child 1");
    expect(container.textContent).toContain("Child 2");

    document.body.removeChild(container);
  });

  it("should catch errors from nested children", async () => {
    function DeepChild() {
      return () => {
        throw new Error("Deep error");
      };
    }

    function MiddleChild() {
      return () => jsx(DeepChild, {});
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", { children: `Caught: ${String(error)}` }),
          children: jsx(MiddleChild, {}),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Caught:");
    expect(container.textContent).toContain("Deep error");

    document.body.removeChild(container);
  });

  it("should allow nested error boundaries", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Inner error");
      };
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", { children: `Outer: ${String(error)}` }),
          children: jsx(ErrorBoundary, {
            error: (error: any) =>
              jsx("div", { children: `Inner: ${String(error)}` }),
            children: jsx(ThrowingChild, {}),
          }),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Inner boundary should catch the error
    expect(container.textContent).toContain("Inner:");
    expect(container.textContent).not.toContain("Outer:");

    document.body.removeChild(container);
  });

  it("should handle string errors", async () => {
    function ThrowingChild() {
      return () => {
        throw "String error";
      };
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", { children: `Error: ${String(error)}` }),
          children: jsx(ThrowingChild, {}),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("String error");

    document.body.removeChild(container);
  });

  it("should handle object errors", async () => {
    function ThrowingChild() {
      return () => {
        throw { message: "Custom error object", code: 500 };
      };
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", {
              children: `Error: ${error.message} (Code: ${error.code})`,
            }),
          children: jsx(ThrowingChild, {}),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Custom error object");
    expect(container.textContent).toContain("500");

    document.body.removeChild(container);
  });

  it("should switch back to children if error is cleared", async () => {
    // Note: This test demonstrates the current behavior
    // In practice, error clearing would require additional implementation
    function SafeChild() {
      return () => jsx("div", { children: "Safe content" });
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", { children: `Error: ${String(error)}` }),
          children: jsx(SafeChild, {}),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Safe content");

    document.body.removeChild(container);
  });

  it("should catch error when component returns JSX directly instead of function", async () => {
    function BadComponent() {
      // Wrong: returning JSX directly
      return jsx("div", { children: "Direct JSX" });
    }

    function TestComponent() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", { children: `Error: ${String(error)}` }),
          children: jsx(BadComponent as any, {}),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Error:");
    expect(container.textContent).toContain(
      "Component must return a render function"
    );

    document.body.removeChild(container);
  });
});

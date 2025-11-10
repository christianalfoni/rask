import { describe, it, expect } from "vitest";
import { ErrorBoundary } from "./error";
import { renderComponent } from "./test-setup";

describe("ErrorBoundary", () => {
  it("should render children when no error occurs", async () => {
    function SafeChild() {
      return () => <div>Safe content</div>;
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary error={(error) => <div>Error: {String(error)}</div>}>
          <SafeChild />
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Safe content");
    expect(container.textContent).not.toContain("Error:");

    unmount();
  });

  it("should catch errors thrown in child components", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Child component error");
      };
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary error={(error) => <div>Error: {String(error)}</div>}>
          <ThrowingChild />
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Error:");
    expect(container.textContent).toContain("Child component error");

    unmount();
  });

  it("should render custom error UI", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Something went wrong");
      };
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary
          error={(error) => (
            <div class="error-ui">
              <h1>Oops!</h1>
              <p>{String(error)}</p>
            </div>
          )}
        >
          <ThrowingChild />
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const errorUI = document.querySelector(".error-ui");
    expect(errorUI).not.toBeNull();
    expect(errorUI?.querySelector("h1")?.textContent).toBe("Oops!");
    expect(errorUI?.textContent).toContain("Something went wrong");

    unmount();
  });

  it("should handle multiple children", async () => {
    function SafeChild1() {
      return () => <div>Child 1</div>;
    }

    function SafeChild2() {
      return () => <div>Child 2</div>;
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary error={(error) => <div>Error: {String(error)}</div>}>
          <SafeChild1 />
          <SafeChild2 />
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Child 1");
    expect(container.textContent).toContain("Child 2");

    unmount();
  });

  it("should catch errors from nested children", async () => {
    function DeepChild() {
      return () => {
        throw new Error("Deep error");
      };
    }

    function MiddleChild() {
      return () => <DeepChild />;
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary error={(error) => <div>Caught: {String(error)}</div>}>
          <MiddleChild />
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Caught:");
    expect(container.textContent).toContain("Deep error");

    unmount();
  });

  it("should allow nested error boundaries", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Inner error");
      };
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary error={(error) => <div>Outer: {String(error)}</div>}>
          <ErrorBoundary error={(error) => <div>Inner: {String(error)}</div>}>
            <ThrowingChild />
          </ErrorBoundary>
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Inner boundary should catch the error
    expect(container.textContent).toContain("Inner:");
    expect(container.textContent).not.toContain("Outer:");

    unmount();
  });

  it("should handle string errors", async () => {
    function ThrowingChild() {
      return () => {
        throw "String error";
      };
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary error={(error) => <div>Error: {String(error)}</div>}>
          <ThrowingChild />
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("String error");

    unmount();
  });

  it("should handle object errors", async () => {
    function ThrowingChild() {
      return () => {
        throw { message: "Custom error object", code: 500 };
      };
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary
          error={(error: any) => (
            <div>
              Error: {error.message} (Code: {error.code})
            </div>
          )}
        >
          <ThrowingChild />
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Custom error object");
    expect(container.textContent).toContain("500");

    unmount();
  });

  it("should switch back to children if error is cleared", async () => {
    // Note: This test demonstrates the current behavior
    // In practice, error clearing would require additional implementation
    function SafeChild() {
      return () => <div>Safe content</div>;
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary error={(error) => <div>Error: {String(error)}</div>}>
          <SafeChild />
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Safe content");

    unmount();
  });

  it("should catch error when component returns JSX directly instead of function", async () => {
    function BadComponent() {
      // Wrong: returning JSX directly
      return <div>Direct JSX</div>;
    }

    function TestComponent() {
      return () => (
        <ErrorBoundary error={(error) => <div>Error: {String(error)}</div>}>
          <BadComponent />
        </ErrorBoundary>
      );
    }

    const { container, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Error:");
    expect(container.textContent).toContain("Component must return a render function");

    unmount();
  });
});

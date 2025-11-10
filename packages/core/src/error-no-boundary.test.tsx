import { describe, it, expect } from "vitest";
import { renderComponent } from "./test-setup";

describe("Error handling without ErrorBoundary", () => {
  it("should not infinite loop when component throws during render without ErrorBoundary", async () => {
    let renderCount = 0;

    function ThrowingComponent() {
      renderCount++;

      if (renderCount > 20) {
        throw new Error("Infinite loop detected - rendered more than 20 times!");
      }

      return () => {
        throw new Error("Component throws in render function");
      };
    }

    const { container, unmount } = renderComponent(<ThrowingComponent />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should only attempt initialization once, not loop
    expect(renderCount).toBe(1);
    // Should render empty content gracefully
    expect(container.textContent).toBe("");

    unmount();
  });

  it("should not infinite loop when component returns JSX directly without ErrorBoundary", async () => {
    let renderCount = 0;

    function BadComponent() {
      renderCount++;

      if (renderCount > 20) {
        throw new Error("Infinite loop detected - rendered more than 20 times!");
      }

      // Directly return JSX instead of a function
      return <div>Direct JSX</div>;
    }

    const { container, unmount } = renderComponent(<BadComponent />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should only attempt initialization once, not loop
    expect(renderCount).toBe(1);
    // Should render empty content gracefully (because of error)
    expect(container.textContent).toBe("");

    unmount();
  });

  it("should handle state changes that cause errors without ErrorBoundary", async () => {
    let initCount = 0;
    let renderCount = 0;

    function ComponentWithState() {
      initCount++;

      if (initCount > 20) {
        throw new Error("Infinite loop detected - initialized more than 20 times!");
      }

      return () => {
        renderCount++;

        if (renderCount > 20) {
          throw new Error("Infinite loop detected - rendered more than 20 times!");
        }

        throw new Error("Render error");
      };
    }

    const { container, unmount } = renderComponent(<ComponentWithState />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should only initialize once
    expect(initCount).toBe(1);
    // Should render empty without looping
    expect(renderCount).toBeLessThan(20);

    unmount();
  });

  it("should handle nested component returning JSX directly (child error, parent ok)", async () => {
    let parentRenderCount = 0;
    let childInitCount = 0;

    function BadChild() {
      childInitCount++;

      if (childInitCount > 20) {
        throw new Error("Infinite loop detected in child!");
      }

      // Directly return JSX instead of a function
      return <span>Direct JSX from child</span>;
    }

    function GoodParent() {
      parentRenderCount++;

      if (parentRenderCount > 20) {
        throw new Error("Infinite loop detected in parent!");
      }

      return () => (
        <div>
          <h1>Parent</h1>
          <BadChild />
        </div>
      );
    }

    const { container, unmount } = renderComponent(<GoodParent />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Parent should initialize once
    expect(parentRenderCount).toBe(1);
    // Child should only attempt to initialize once
    expect(childInitCount).toBe(1);
    // Parent should render but child error shouldn't show
    expect(container.textContent).toContain("Parent");
    expect(container.textContent).not.toContain("Direct JSX");

    unmount();
  });

  it("should handle nested component throwing during render (child error, parent ok)", async () => {
    let parentRenderCount = 0;
    let childInitCount = 0;
    let childRenderAttempts = 0;

    function BadChild() {
      childInitCount++;

      if (childInitCount > 20) {
        throw new Error("Infinite loop detected in child!");
      }

      return () => {
        childRenderAttempts++;
        throw new Error("Child render error");
      };
    }

    function GoodParent() {
      parentRenderCount++;

      if (parentRenderCount > 20) {
        throw new Error("Infinite loop detected in parent!");
      }

      return () => (
        <div>
          <h1>Parent</h1>
          <BadChild />
        </div>
      );
    }

    const { container, unmount } = renderComponent(<GoodParent />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Parent should initialize once
    expect(parentRenderCount).toBe(1);
    // Child should only initialize once
    expect(childInitCount).toBe(1);
    // Child render should be attempted but parent should still render
    expect(childRenderAttempts).toBeGreaterThan(0);
    expect(childRenderAttempts).toBeLessThan(20);
    expect(container.textContent).toContain("Parent");

    unmount();
  });

  it("should handle multiple nested bad children without looping", async () => {
    let parentRenderCount = 0;
    let child1InitCount = 0;
    let child2InitCount = 0;

    function BadChild1() {
      child1InitCount++;
      if (child1InitCount > 20) throw new Error("Child1 loop!");
      return <div>Direct JSX 1</div>;
    }

    function BadChild2() {
      child2InitCount++;
      if (child2InitCount > 20) throw new Error("Child2 loop!");
      return <span>Direct JSX 2</span>;
    }

    function GoodParent() {
      parentRenderCount++;
      if (parentRenderCount > 20) throw new Error("Parent loop!");

      return () => (
        <div>
          <h1>Parent</h1>
          <BadChild1 />
          <BadChild2 />
        </div>
      );
    }

    const { container, unmount } = renderComponent(<GoodParent />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Parent initializes once
    expect(parentRenderCount).toBe(1);
    // Each child initializes once
    expect(child1InitCount).toBe(1);
    expect(child2InitCount).toBe(1);
    // Parent renders successfully despite child errors
    expect(container.textContent).toContain("Parent");

    unmount();
  });
});

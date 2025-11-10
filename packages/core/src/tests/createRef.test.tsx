import { describe, it, expect } from "vitest";
import { createRef } from "../createRef";
import { jsx, render } from "../vdom";

describe("createRef", () => {
  it("should create a ref with null initial value", () => {
    const ref = createRef<HTMLDivElement>();
    expect(ref.current).toBeNull();
  });

  it("should be callable as a function", () => {
    const ref = createRef<HTMLDivElement>();
    expect(typeof ref).toBe("function");
  });

  it("should update current when called with a node", () => {
    const ref = createRef<HTMLDivElement>();
    const element = document.createElement("div");

    ref(element);

    expect(ref.current).toBe(element);
  });

  it("should update current when called with null", () => {
    const ref = createRef<HTMLDivElement>();
    const element = document.createElement("div");

    ref(element);
    expect(ref.current).toBe(element);

    ref(null);
    expect(ref.current).toBeNull();
  });

  it("should work with JSX ref attribute", async () => {
    const ref = createRef<HTMLDivElement>();

    function TestComponent() {
      return () => jsx("div", { ref, children: "Hello" });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    const vnode = render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("DIV");
    expect(ref.current?.textContent).toBe("Hello");

    document.body.removeChild(vnode.elm as HTMLElement);
  });

  it("should handle multiple ref updates", () => {
    const ref = createRef<HTMLElement>();

    const div = document.createElement("div");
    const span = document.createElement("span");

    ref(div);
    expect(ref.current).toBe(div);

    ref(span);
    expect(ref.current).toBe(span);

    ref(null);
    expect(ref.current).toBeNull();
  });

  it("should work with different element types", async () => {
    const inputRef = createRef<HTMLInputElement>();
    const buttonRef = createRef<HTMLButtonElement>();

    function TestComponent() {
      return () =>
        jsx("div", {
          children: [
            jsx("input", { ref: inputRef, type: "text" }),
            jsx("button", { ref: buttonRef, children: "Click" }),
          ],
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    const vnode = render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(inputRef.current?.tagName).toBe("INPUT");
    expect(buttonRef.current?.tagName).toBe("BUTTON");

    document.body.removeChild(vnode.elm as HTMLElement);
  });

  it("should allow accessing DOM properties", async () => {
    const ref = createRef<HTMLInputElement>();

    function TestComponent() {
      return () => jsx("input", { ref, type: "text", value: "test" });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    const vnode = render(jsx(TestComponent, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ref.current?.value).toBe("test");
    expect(ref.current?.type).toBe("text");

    document.body.removeChild(vnode.elm as HTMLElement);
  });
});

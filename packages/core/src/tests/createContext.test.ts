import { describe, it, expect } from "vitest";
import { createContext } from "../createContext";
import { jsx } from "../jsx-runtime";
import { render } from "../";

describe("createContext", () => {
  it("should create a context object", () => {
    const context = createContext<{ value: string }>();
    expect(context).toHaveProperty("inject");
    expect(context).toHaveProperty("get");
  });

  it("should allow setting and getting context values", () => {
    const ThemeContext = createContext<{ theme: string }>();

    function Parent() {
      ThemeContext.inject({ theme: "dark" });
      return () => jsx(Child, {});
    }

    function Child() {
      const theme = ThemeContext.get();
      return () => jsx("div", { children: theme.theme });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(Parent, {}), container);

    expect(container.textContent).toContain("dark");

    document.body.removeChild(container);
  });

  it("should traverse parent components to find context", () => {
    const ThemeContext = createContext<{ theme: string }>();

    function GrandParent() {
      ThemeContext.inject({ theme: "light" });
      return () => jsx(Parent, {});
    }

    function Parent() {
      return () => jsx(Child, {});
    }

    function Child() {
      const theme = ThemeContext.get();
      return () => jsx("div", { children: theme.theme });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(GrandParent, {}), container);

    expect(container.textContent).toContain("light");

    document.body.removeChild(container);
  });

  it("should throw error when context is not found", () => {
    const ThemeContext = createContext<{ theme: string }>();

    function Child() {
      expect(() => {
        ThemeContext.get();
      }).toThrow("There is no parent context");
      return () => jsx("div", { children: "Child" });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(Child, {}), container);

    document.body.removeChild(container);
  });

  it("should throw error when setting context outside component", () => {
    const ThemeContext = createContext<{ theme: string }>();

    expect(() => {
      ThemeContext.inject({ theme: "dark" });
    }).toThrow("No current component");
  });

  it("should throw error when getting context outside component", () => {
    const ThemeContext = createContext<{ theme: string }>();

    expect(() => {
      ThemeContext.get();
    }).toThrow("No current component");
  });

  it("should allow overriding context in nested components", () => {
    const ThemeContext = createContext<{ theme: string }>();

    function GrandParent() {
      ThemeContext.inject({ theme: "light" });
      return () =>
        jsx("div", {
          children: [jsx(Parent, {}), jsx(ChildOfGrandParent, {})],
        });
    }

    function Parent() {
      ThemeContext.inject({ theme: "dark" });
      return () => jsx(ChildOfParent, {});
    }

    function ChildOfParent() {
      const theme = ThemeContext.get();
      return () =>
        jsx("div", { class: "child-of-parent", children: theme.theme });
    }

    function ChildOfGrandParent() {
      const theme = ThemeContext.get();
      return () =>
        jsx("div", { class: "child-of-grandparent", children: theme.theme });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(GrandParent, {}), container);

    const childOfParent = document.querySelector(".child-of-parent");
    const childOfGrandParent = document.querySelector(".child-of-grandparent");

    expect(childOfParent?.textContent).toBe("dark");
    expect(childOfGrandParent?.textContent).toBe("light");

    document.body.removeChild(container);
  });

  it("should support multiple different contexts", () => {
    const ThemeContext = createContext<{ theme: string }>();
    const UserContext = createContext<{ name: string }>();

    function Parent() {
      ThemeContext.inject({ theme: "dark" });
      UserContext.inject({ name: "Alice" });
      return () => jsx(Child, {});
    }

    function Child() {
      const theme = ThemeContext.get();
      const user = UserContext.get();
      return () =>
        jsx("div", {
          children: `${theme.theme} - ${user.name}`,
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(Parent, {}), container);

    expect(container.textContent).toContain("dark - Alice");

    document.body.removeChild(container);
  });

  it("should handle context values of different types", () => {
    const NumberContext = createContext<number>();
    const ArrayContext = createContext<string[]>();

    function Parent() {
      NumberContext.inject(42);
      ArrayContext.inject(["a", "b", "c"]);
      return () => jsx(Child, {});
    }

    function Child() {
      const num = NumberContext.get();
      const arr = ArrayContext.get();
      return () =>
        jsx("div", {
          children: `${num} - ${arr.join(",")}`,
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(Parent, {}), container);

    expect(container.textContent).toContain("42 - a,b,c");

    document.body.removeChild(container);
  });
});

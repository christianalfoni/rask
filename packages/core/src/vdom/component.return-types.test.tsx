import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";
import { createState } from "../createState";
import { Fragment } from "./FragmentVNode";

describe("Component Return Types", () => {
  describe("Static Return Values", () => {
    it("should handle component returning a single element", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => jsx("div", { children: "Hello" });
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children).toHaveLength(1);
      expect(container.children[0]).toBeInstanceOf(HTMLDivElement);
      expect(container.children[0].textContent).toBe("Hello");
    });

    it("should handle component returning a text string", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => "Hello World";
      };

      render(jsx(MyComponent, {}), container);

      expect(container.childNodes).toHaveLength(1);
      expect(container.childNodes[0]).toBeInstanceOf(Text);
      expect(container.textContent).toBe("Hello World");
    });

    it("should handle component returning a number", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => 42;
      };

      render(jsx(MyComponent, {}), container);

      expect(container.childNodes).toHaveLength(1);
      expect(container.textContent).toBe("42");
    });

    it("should handle component returning null", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => null;
      };

      render(jsx(MyComponent, {}), container);

      // Null should render as empty fragment or empty array
      expect(container.childNodes.length).toBe(0);
    });

    it("should handle component returning undefined", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => undefined;
      };

      render(jsx(MyComponent, {}), container);

      // Undefined should render as empty fragment or empty array
      expect(container.childNodes.length).toBe(0);
    });

    it("should handle component returning a fragment with multiple children", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () =>
          jsx(Fragment, {
            children: [
              jsx("div", { children: "First" }),
              jsx("div", { children: "Second" }),
              jsx("div", { children: "Third" }),
            ],
          });
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle component returning an array of elements", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => [
          jsx("span", { children: "A" }),
          jsx("span", { children: "B" }),
          jsx("span", { children: "C" }),
        ];
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle component returning nested components", () => {
      const container = document.createElement("div");

      const InnerComponent = () => {
        return () => jsx("span", { children: "Inner" });
      };

      const OuterComponent = () => {
        return () => jsx(InnerComponent, {});
      };

      render(jsx(OuterComponent, {}), container);

      expect(container.children).toHaveLength(1);
      expect(container.textContent).toBe("Inner");
    });

    it("should handle component returning boolean false", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => false;
      };

      render(jsx(MyComponent, {}), container);

      // False should render as empty or be filtered out
      expect(container.childNodes.length).toBe(0);
    });

    it("should handle component returning boolean true", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => true;
      };

      render(jsx(MyComponent, {}), container);

      // True should render as empty or be filtered out
      expect(container.childNodes.length).toBe(0);
    });
  });

  describe("Dynamic Return Values", () => {
    it("should handle component switching from element to string", async () => {
      const container = document.createElement("div");
      let stateFn: { showElement: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ showElement: true });
        stateFn = state;

        return () =>
          state.showElement ? jsx("div", { children: "Element" }) : "Just text";
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children[0]).toBeInstanceOf(HTMLDivElement);

      stateFn!.showElement = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.childNodes[0]).toBeInstanceOf(Text);
      expect(container.textContent).toBe("Just text");
    });

    it("should handle component switching from null to element", async () => {
      const container = document.createElement("div");
      let stateFn: { show: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ show: false });
        stateFn = state;

        return () => (state.show ? jsx("div", { children: "Visible" }) : null);
      };

      render(jsx(MyComponent, {}), container);

      expect(container.childNodes.length).toBe(0);

      stateFn!.show = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.textContent).toBe("Visible");
    });

    it("should handle component switching from element to null", async () => {
      const container = document.createElement("div");
      let stateFn: { show: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ show: true });
        stateFn = state;

        return () => (state.show ? jsx("div", { children: "Visible" }) : null);
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children.length).toBe(1);

      stateFn!.show = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.childNodes.length).toBe(0);
    });

    it("should handle component switching between different element types", async () => {
      const container = document.createElement("div");
      let stateFn: { type: "div" | "span" | "p" } | undefined;

      const MyComponent = () => {
        const state = createState<{ type: "div" | "span" | "p" }>({
          type: "div",
        });
        stateFn = state;

        return () => jsx(state.type, { children: "Content" });
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children[0]).toBeInstanceOf(HTMLDivElement);

      stateFn!.type = "span";
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children[0]).toBeInstanceOf(HTMLSpanElement);

      stateFn!.type = "p";
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children[0]).toBeInstanceOf(HTMLParagraphElement);
    });

    it("should handle component switching from single element to array", async () => {
      const container = document.createElement("div");
      let stateFn: { multiple: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ multiple: false });
        stateFn = state;

        return () =>
          state.multiple
            ? [
                jsx("div", { children: "First" }),
                jsx("div", { children: "Second" }),
              ]
            : jsx("div", { children: "Single" });
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children.length).toBe(1);

      stateFn!.multiple = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle component switching from array to single element", async () => {
      const container = document.createElement("div");
      let stateFn: { multiple: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ multiple: true });
        stateFn = state;

        return () =>
          state.multiple
            ? [
                jsx("div", { children: "First" }),
                jsx("div", { children: "Second" }),
              ]
            : jsx("div", { children: "Single" });
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children.length).toBe(2);

      stateFn!.multiple = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children).toHaveLength(1);
      expect(container.textContent).toBe("Single");
    });

    it("should handle component dynamically changing array length", async () => {
      const container = document.createElement("div");
      let stateFn: { count: number } | undefined;

      const MyComponent = () => {
        const state = createState({ count: 2 });
        stateFn = state;

        return () =>
          Array.from({ length: state.count }, (_, i) =>
            jsx("div", { children: `Item ${i}` })
          );
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children.length).toBe(2);

      stateFn!.count = 5;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children.length).toBe(5);

      stateFn!.count = 1;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children.length).toBe(1);
    });

    it("should handle component switching between string and number", async () => {
      const container = document.createElement("div");
      let stateFn: { value: string | number } | undefined;

      const MyComponent = () => {
        const state = createState<{ value: string | number }>({
          value: "Hello",
        });
        stateFn = state;

        return () => state.value;
      };

      render(jsx(MyComponent, {}), container);

      expect(container.textContent).toBe("Hello");

      stateFn!.value = 42;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.textContent).toBe("42");
    });

    it("should handle component conditionally returning component or element", async () => {
      const container = document.createElement("div");
      let stateFn: { useComponent: boolean } | undefined;

      const InnerComponent = () => {
        return () => jsx("span", { children: "Component" });
      };

      const MyComponent = () => {
        const state = createState({ useComponent: true });
        stateFn = state;

        return () =>
          state.useComponent
            ? jsx(InnerComponent, {})
            : jsx("div", { children: "Element" });
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children[0]).toBeInstanceOf(HTMLSpanElement);
      expect(container.textContent).toBe("Component");

      stateFn!.useComponent = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children[0]).toBeInstanceOf(HTMLDivElement);
      expect(container.textContent).toBe("Element");
    });

    it("should handle rapid switching between return types", async () => {
      const container = document.createElement("div");
      let stateFn: { type: "element" | "string" | "null" } | undefined;

      const MyComponent = () => {
        const state = createState<{ type: "element" | "string" | "null" }>({
          type: "element",
        });
        stateFn = state;

        return () => {
          if (state.type === "element") {
            return jsx("div", { children: "Element" });
          }
          if (state.type === "string") {
            return "String";
          }
          return null;
        };
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children.length).toBe(1);

      stateFn!.type = "string";
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.textContent).toBe("String");

      stateFn!.type = "null";
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.childNodes.length).toBe(0);

      stateFn!.type = "element";
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children.length).toBe(1);
      expect(container.textContent).toBe("Element");
    });
  });

  describe("Edge Cases", () => {
    it("should handle component returning empty array", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => [];
      };

      render(jsx(MyComponent, {}), container);

      expect(container.childNodes.length).toBe(0);
    });

    it("should handle component returning array with nulls", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => [
          jsx("div", { children: "First" }),
          null,
          jsx("div", { children: "Third" }),
        ];
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle component returning mixed array types", () => {
      const container = document.createElement("div");

      const MyComponent = () => {
        return () => [
          jsx("div", { children: "Element" }),
          "String",
          42,
          jsx("span", { children: "Another" }),
        ];
      };

      render(jsx(MyComponent, {}), container);

      expect(container.childNodes.length).toBeGreaterThan(0);
    });

    it("should handle deeply nested return values", () => {
      const container = document.createElement("div");

      const Level3 = () => () => jsx("span", { children: "Deep" });
      const Level2 = () => () => jsx(Level3, {});
      const Level1 = () => () => jsx(Level2, {});

      render(jsx(Level1, {}), container);

      expect(container.textContent).toBe("Deep");
    });

    it("should handle component switching from empty array to elements", async () => {
      const container = document.createElement("div");
      let stateFn: { items: string[] } | undefined;

      const MyComponent = () => {
        const state = createState({ items: [] as string[] });
        stateFn = state;

        return () => state.items.map((item) => jsx("div", { children: item }));
      };

      render(jsx(MyComponent, {}), container);

      expect(container.children.length).toBe(0);

      stateFn!.items = ["A", "B", "C"];
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.children.length).toBeGreaterThanOrEqual(3);
    });
  });
});

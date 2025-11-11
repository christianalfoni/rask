import { describe, it, expect, vi } from "vitest";
import { jsx, render } from "../vdom/index";
import { Fragment } from "../vdom/FragmentVNode";
import { createState } from "../createState";

describe("VDOM Edge Cases", () => {
  describe("Text Node Patching", () => {
    it("should patch element to text node", async () => {
      const container = document.createElement("div");
      let stateFn: { showElement: boolean } | undefined;

      const App = () => {
        const state = createState({ showElement: true });
        stateFn = state;

        return () =>
          jsx("div", {
            children: state.showElement
              ? [jsx("span", { children: ["Element"] })]
              : ["Text"],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].tagName).toBe("SPAN");

      stateFn!.showElement = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.childNodes.length).toBe(1);
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(wrapper.textContent).toBe("Text");
    });

    it("should patch text node to element", async () => {
      const container = document.createElement("div");
      let stateFn: { showText: boolean } | undefined;

      const App = () => {
        const state = createState({ showText: true });
        stateFn = state;

        return () =>
          jsx("div", {
            children: state.showText
              ? ["Text"]
              : [jsx("span", { children: ["Element"] })],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);

      stateFn!.showText = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].tagName).toBe("SPAN");
    });

    it("should patch text node with different text", async () => {
      const container = document.createElement("div");
      let stateFn: { text: string } | undefined;

      const App = () => {
        const state = createState({ text: "Old Text" });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [state.text],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.textContent).toBe("Old Text");

      stateFn!.text = "New Text";
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.textContent).toBe("New Text");
      expect(wrapper.childNodes.length).toBe(1);
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    });

    it("should patch multiple text nodes", async () => {
      const container = document.createElement("div");
      let stateFn: { texts: string[] } | undefined;

      const App = () => {
        const state = createState({ texts: ["First", "Second"] });
        stateFn = state;

        return () =>
          jsx("div", {
            children: state.texts,
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(2);

      stateFn!.texts = ["Updated", "Text", "Nodes"];
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.childNodes.length).toBe(3);
      expect(wrapper.childNodes[0].textContent).toBe("Updated");
      expect(wrapper.childNodes[1].textContent).toBe("Text");
      expect(wrapper.childNodes[2].textContent).toBe("Nodes");
    });
  });

  describe("Mixed Content Patching", () => {
    it("should patch mixed elements and text nodes", async () => {
      const container = document.createElement("div");
      let stateFn: { version: number } | undefined;

      const App = () => {
        const state = createState({ version: 1 });
        stateFn = state;

        return () =>
          jsx("div", {
            children:
              state.version === 1
                ? ["Text", jsx("span", { children: ["Span"] }), "More text"]
                : [
                    jsx("div", { children: ["Div"] }),
                    "Middle",
                    jsx("button", { children: ["Button"] }),
                  ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(3);

      stateFn!.version = 2;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.childNodes.length).toBe(3);
      expect((wrapper.childNodes[0] as HTMLElement).tagName).toBe("DIV");
      expect(wrapper.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(wrapper.childNodes[1].textContent).toBe("Middle");
      expect((wrapper.childNodes[2] as HTMLElement).tagName).toBe("BUTTON");
    });

    it("should patch from all text to all elements", async () => {
      const container = document.createElement("div");
      let stateFn: { showElements: boolean } | undefined;

      const App = () => {
        const state = createState({ showElements: false });
        stateFn = state;

        return () =>
          jsx("div", {
            children: state.showElements
              ? [
                  jsx("span", { children: ["A"] }),
                  jsx("span", { children: ["B"] }),
                  jsx("span", { children: ["C"] }),
                ]
              : ["One", "Two", "Three"],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(3);
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);

      stateFn!.showElements = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.children.length).toBe(3);
      expect(wrapper.children[0].tagName).toBe("SPAN");
      expect(wrapper.children[1].tagName).toBe("SPAN");
      expect(wrapper.children[2].tagName).toBe("SPAN");
    });

    it("should patch from all elements to all text", async () => {
      const container = document.createElement("div");
      let stateFn: { showElements: boolean } | undefined;

      const App = () => {
        const state = createState({ showElements: true });
        stateFn = state;

        return () =>
          jsx("div", {
            children: state.showElements
              ? [
                  jsx("span", { children: ["A"] }),
                  jsx("span", { children: ["B"] }),
                  jsx("span", { children: ["C"] }),
                ]
              : ["One", "Two", "Three"],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(3);

      stateFn!.showElements = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.childNodes.length).toBe(3);
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(wrapper.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(wrapper.childNodes[2].nodeType).toBe(Node.TEXT_NODE);
    });
  });

  describe("Fragment Edge Cases", () => {
    it("should patch fragment with text nodes", async () => {
      const container = document.createElement("div");
      let stateFn: { showElement: boolean } | undefined;

      const App = () => {
        const state = createState({ showElement: true });
        stateFn = state;

        return () =>
          jsx(Fragment, {
            children: state.showElement
              ? [jsx("span", { children: ["Element"] })]
              : ["Text 1", "Text 2"],
          });
      };

      render(jsx(App, {}), container);

      expect(container.children.length).toBe(1);
      expect(container.children[0].tagName).toBe("SPAN");

      stateFn!.showElement = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[0].textContent).toBe("Text 1");
      expect(container.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[1].textContent).toBe("Text 2");
    });

    it("should patch fragment with mixed content", async () => {
      const container = document.createElement("div");
      let stateFn: { showMixed: boolean } | undefined;

      const App = () => {
        const state = createState({ showMixed: false });
        stateFn = state;

        return () =>
          jsx(Fragment, {
            children: state.showMixed
              ? ["Text", jsx("div", { children: ["Element"] }), "More text"]
              : [jsx("span", { children: ["A"] })],
          });
      };

      render(jsx(App, {}), container);

      stateFn!.showMixed = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.childNodes.length).toBe(3);
      expect(container.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[0].textContent).toBe("Text");
      expect((container.childNodes[1] as HTMLElement).tagName).toBe("DIV");
      expect(container.childNodes[2].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[2].textContent).toBe("More text");
    });

    it("should patch empty fragment to non-empty", async () => {
      const container = document.createElement("div");
      let stateFn: { isEmpty: boolean } | undefined;

      const App = () => {
        const state = createState({ isEmpty: true });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              jsx(Fragment, {
                children: state.isEmpty
                  ? []
                  : [
                      jsx("span", { children: ["A"] }),
                      jsx("span", { children: ["B"] }),
                    ],
              }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(0);

      stateFn!.isEmpty = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("A");
      expect(wrapper.children[1].textContent).toBe("B");
    });

    it("should patch non-empty fragment to empty", async () => {
      const container = document.createElement("div");
      let stateFn: { isEmpty: boolean } | undefined;

      const App = () => {
        const state = createState({ isEmpty: false });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              jsx(Fragment, {
                children: state.isEmpty
                  ? []
                  : [
                      jsx("span", { children: ["A"] }),
                      jsx("span", { children: ["B"] }),
                    ],
              }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);

      stateFn!.isEmpty = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.childNodes.length).toBe(0);
    });
  });

  describe("Property Edge Cases", () => {
    it("should patch null attribute to string", async () => {
      const container = document.createElement("div");
      let stateFn: { dataValue: string | null } | undefined;

      const App = () => {
        const state = createState<{ dataValue: string | null }>({
          dataValue: null,
        });
        stateFn = state;

        return () =>
          jsx("div", {
            "data-value": state.dataValue,
          });
      };

      render(jsx(App, {}), container);

      const div = container.children[0] as HTMLElement;
      expect(div.getAttribute("data-value")).toBeNull();

      stateFn!.dataValue = "test";
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(div.getAttribute("data-value")).toBe("test");
    });

    it("should patch string attribute to null", async () => {
      const container = document.createElement("div");
      let stateFn: { dataValue: string | null } | undefined;

      const App = () => {
        const state = createState<{ dataValue: string | null }>({
          dataValue: "test",
        });
        stateFn = state;

        return () =>
          jsx("div", {
            "data-value": state.dataValue,
          });
      };

      render(jsx(App, {}), container);

      const div = container.children[0] as HTMLElement;
      expect(div.getAttribute("data-value")).toBe("test");

      stateFn!.dataValue = null;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(div.getAttribute("data-value")).toBeNull();
    });

    it("should remove event listener when patching to null", async () => {
      const container = document.createElement("div");
      let stateFn: { doClick: boolean } | undefined;

      const handler = vi.fn();

      const App = () => {
        const state = createState({
          doClick: true,
        });
        stateFn = state;

        return () =>
          jsx("button", {
            onClick: state.doClick ? handler : null,
          });
      };

      render(jsx(App, {}), container);

      const button = container.children[0] as HTMLButtonElement;
      button.click();
      expect(handler).toHaveBeenCalledTimes(1);

      stateFn!.doClick = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      button.click();
      // Should still be 1, not 2
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle className changes", async () => {
      const container = document.createElement("div");
      let stateFn: { className: string } | undefined;

      const App = () => {
        const state = createState({ className: "old-class" });
        stateFn = state;

        return () =>
          jsx("div", {
            className: state.className,
          });
      };

      render(jsx(App, {}), container);

      const div = container.children[0] as HTMLElement;
      expect(div.className).toBe("old-class");

      stateFn!.className = "new-class another-class";
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(div.className).toBe("new-class another-class");
    });

    it("should handle style object changes", async () => {
      const container = document.createElement("div");
      let stateFn:
        | { style: { color?: string; fontSize?: string; fontWeight?: string } }
        | undefined;

      const App = () => {
        const state = createState<{
          style: { color?: string; fontSize?: string; fontWeight?: string };
        }>({
          style: { color: "red", fontSize: "16px" },
        });
        stateFn = state;

        return () =>
          jsx("div", {
            style: state.style,
          });
      };

      render(jsx(App, {}), container);

      const div = container.children[0] as HTMLElement;
      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("16px");

      stateFn!.style = { color: "blue", fontWeight: "bold" };
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(div.style.color).toBe("blue");
      expect(div.style.fontWeight).toBe("bold");
      // fontSize should be removed or remain - depends on your implementation
    });
  });

  describe("Keys Edge Cases", () => {
    it("should handle keys with mixed text and elements", async () => {
      const container = document.createElement("div");
      let stateFn: { order: string } | undefined;

      const App = () => {
        const state = createState({ order: "initial" });
        stateFn = state;

        return () =>
          jsx("div", {
            children:
              state.order === "initial"
                ? [
                    "Text",
                    jsx("span", { children: ["A"] }, "a"),
                    jsx("span", { children: ["B"] }, "b"),
                  ]
                : [
                    jsx("span", { children: ["B"] }, "b"),
                    "Text",
                    jsx("span", { children: ["A"] }, "a"),
                  ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      const initialSpanA = wrapper.children[0];
      const initialSpanB = wrapper.children[1];

      stateFn!.order = "reordered";
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.childNodes.length).toBe(3);
      expect(wrapper.children[0]).toBe(initialSpanB);
      expect(wrapper.children[1]).toBe(initialSpanA);
    });

    it("should handle duplicate keys gracefully", async () => {
      const container = document.createElement("div");
      let stateFn: { version: number } | undefined;

      const App = () => {
        const state = createState({ version: 1 });
        stateFn = state;

        return () =>
          jsx("div", {
            children:
              state.version === 1
                ? [
                    jsx("span", { children: ["A"] }, "key"),
                    jsx("span", { children: ["B"] }, "key"), // duplicate key
                  ]
                : [
                    jsx("span", { children: ["C"] }, "key"),
                    jsx("span", { children: ["D"] }, "other"),
                  ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);

      stateFn!.version = 2;
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should handle this without crashing
      expect(wrapper.children.length).toBe(3);
    });

    it("should handle numeric keys", async () => {
      const container = document.createElement("div");
      let stateFn: { reorder: boolean } | undefined;

      const App = () => {
        const state = createState({ reorder: false });
        stateFn = state;

        return () =>
          jsx("div", {
            children: state.reorder
              ? [
                  jsx("span", { children: ["2"] }, "2"),
                  jsx("span", { children: ["0"] }, "0"),
                  jsx("span", { children: ["1"] }, "1"),
                ]
              : [
                  jsx("span", { children: ["0"] }, "0"),
                  jsx("span", { children: ["1"] }, "1"),
                  jsx("span", { children: ["2"] }, "2"),
                ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      const initialChildren = Array.from(wrapper.children);

      stateFn!.reorder = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const newChildren = Array.from(wrapper.children);
      expect(newChildren[0]).toBe(initialChildren[2]);
      expect(newChildren[1]).toBe(initialChildren[0]);
      expect(newChildren[2]).toBe(initialChildren[1]);
    });
  });

  describe("Empty and Null Cases", () => {
    it("should patch from children to no children", async () => {
      const container = document.createElement("div");
      let stateFn: { hasChildren: boolean } | undefined;

      const App = () => {
        const state = createState({ hasChildren: true });
        stateFn = state;

        return () =>
          jsx("div", {
            children: state.hasChildren
              ? [
                  jsx("span", { children: ["A"] }),
                  jsx("span", { children: ["B"] }),
                ]
              : undefined,
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);

      stateFn!.hasChildren = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.childNodes.length).toBe(0);
    });

    it("should patch from no children to children", async () => {
      const container = document.createElement("div");
      let stateFn: { hasChildren: boolean } | undefined;

      const App = () => {
        const state = createState({ hasChildren: false });
        stateFn = state;

        return () =>
          jsx("div", {
            children: state.hasChildren
              ? [
                  jsx("span", { children: ["A"] }),
                  jsx("span", { children: ["B"] }),
                ]
              : undefined,
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(0);

      stateFn!.hasChildren = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.children.length).toBe(2);
    });

    it("should handle null and undefined in children array", async () => {
      const container = document.createElement("div");
      let stateFn: { version: number } | undefined;

      const App = () => {
        const state = createState({ version: 1 });
        stateFn = state;

        return () =>
          jsx("div", {
            children:
              state.version === 1
                ? [null, jsx("span", { children: ["A"] }), undefined]
                : [
                    jsx("span", { children: ["B"] }),
                    null,
                    jsx("span", { children: ["C"] }),
                  ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].textContent).toBe("A");

      stateFn!.version = 2;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("B");
      expect(wrapper.children[1].textContent).toBe("C");
    });
  });

  describe("Deeply Nested Patching", () => {
    it("should patch deeply nested structure with tag changes", async () => {
      const container = document.createElement("div");
      let stateFn: { version: number } | undefined;

      const App = () => {
        const state = createState({ version: 1 });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              jsx("section", {
                children: [
                  jsx("article", {
                    children:
                      state.version === 1
                        ? [
                            jsx("p", {
                              children: [
                                jsx("span", { children: ["Deep text"] }),
                              ],
                            }),
                          ]
                        : [
                            jsx("div", {
                              children: [
                                jsx("strong", { children: ["Updated text"] }),
                              ],
                            }),
                          ],
                  }),
                ],
              }),
            ],
          });
      };

      render(jsx(App, {}), container);

      stateFn!.version = 2;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const wrapper = container.children[0] as HTMLElement;
      const section = wrapper.children[0];
      const article = section.children[0];
      const div = article.children[0];
      expect(div.tagName).toBe("DIV");
      expect(div.children[0].tagName).toBe("STRONG");
      expect(div.children[0].textContent).toBe("Updated text");
    });

    it("should patch with alternating fragments and elements", async () => {
      const container = document.createElement("div");
      let stateFn: { version: number } | undefined;

      const App = () => {
        const state = createState({ version: 1 });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              jsx(Fragment, {
                children: [
                  jsx("span", {
                    children: [
                      jsx(Fragment, {
                        children:
                          state.version === 1
                            ? [jsx("em", { children: ["Nested"] })]
                            : [
                                jsx("em", { children: ["Updated"] }),
                                jsx("strong", { children: ["Added"] }),
                              ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          });
      };

      render(jsx(App, {}), container);

      stateFn!.version = 2;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const wrapper = container.children[0] as HTMLElement;
      const span = wrapper.children[0];
      expect(span.children.length).toBe(2);
      expect(span.children[0].tagName).toBe("EM");
      expect(span.children[0].textContent).toBe("Updated");
      expect(span.children[1].tagName).toBe("STRONG");
      expect(span.children[1].textContent).toBe("Added");
    });
  });

  describe("Same Node Patching", () => {
    it("should handle patching node with itself", async () => {
      const container = document.createElement("div");
      let stateFn: { counter: number } | undefined;

      const App = () => {
        const state = createState({ counter: 0 });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [jsx("span", { children: ["Text"] })],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      const initialContent = wrapper.innerHTML;

      // Trigger re-render - should be a no-op since nothing changed
      stateFn!.counter = 1;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.innerHTML).toBe(initialContent);
    });
  });
});

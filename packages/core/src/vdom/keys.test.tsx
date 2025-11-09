import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";
import { createState } from "../createState";

const waitForUpdate = () => new Promise((resolve) => setTimeout(resolve, 10));

describe("VDOM Keys", () => {
  it("should preserve elements when reordering with keys", async () => {
    const container = document.createElement("div");
    let stateFn: ReturnType<typeof createState<{ order: string[] }>>;

    const App = () => {
      const state = createState({ order: ["a", "b", "c"] });
      stateFn = state;
      return () =>
        jsx("ul", {
          children: state.order.map((key) =>
            jsx("li", { children: `Item ${key.toUpperCase()}` }, key)
          ),
        });
    };

    render(jsx(App, {}), container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    // Store references to the original DOM elements
    const itemA = initialChildren[0];
    const itemB = initialChildren[1];
    const itemC = initialChildren[2];

    expect(itemA.textContent).toBe("Item A");
    expect(itemB.textContent).toBe("Item B");
    expect(itemC.textContent).toBe("Item C");

    // Reorder to C, A, B
    stateFn!.order = ["c", "a", "b"];
    await waitForUpdate();

    const newChildren = Array.from(ul.children);

    // Verify elements were reordered, not recreated
    // The DOM elements should be the same instances, just moved
    expect(newChildren[0]).toBe(itemC); // C is now first
    expect(newChildren[1]).toBe(itemA); // A is now second
    expect(newChildren[2]).toBe(itemB); // B is now third

    expect(newChildren[0].textContent).toBe("Item C");
    expect(newChildren[1].textContent).toBe("Item A");
    expect(newChildren[2].textContent).toBe("Item B");
  });

  it("should not preserve elements when reordering without keys", async () => {
    const container = document.createElement("div");
    let stateFn: ReturnType<typeof createState<{ items: string[] }>>;

    const App = () => {
      const state = createState({ items: ["Item A", "Item B", "Item C"] });
      stateFn = state;
      return () =>
        jsx("ul", {
          children: state.items.map((text) => jsx("li", { children: text })),
        });
    };

    render(jsx(App, {}), container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    // Store references to the original DOM elements
    const itemA = initialChildren[0];
    const itemB = initialChildren[1];
    const itemC = initialChildren[2];

    // Reorder to C, A, B
    stateFn!.items = ["Item C", "Item A", "Item B"];
    await waitForUpdate();

    const newChildren = Array.from(ul.children);

    // Without keys, the DOM elements are reused in place and just updated
    // So the DOM nodes remain the same, but their content is changed
    expect(newChildren[0]).toBe(itemA); // Same DOM node, but content changed to "Item C"
    expect(newChildren[1]).toBe(itemB); // Same DOM node, but content changed to "Item A"
    expect(newChildren[2]).toBe(itemC); // Same DOM node, but content changed to "Item B"

    expect(newChildren[0].textContent).toBe("Item C");
    expect(newChildren[1].textContent).toBe("Item A");
    expect(newChildren[2].textContent).toBe("Item B");
  });

  it("should preserve element state when reordering with keys", async () => {
    const container = document.createElement("div");
    let stateFn: ReturnType<
      typeof createState<{ order: string[]; values: Record<string, string> }>
    >;

    const App = () => {
      const state = createState({
        order: ["first", "second", "third"],
        values: { first: "First", second: "Second", third: "Third" } as Record<string, string>,
      });
      stateFn = state;
      return () =>
        jsx("div", {
          children: state.order.map((key) =>
            jsx("input", { value: state.values[key] }, key)
          ),
        });
    };

    render(jsx(App, {}), container);

    const div = container.children[0] as HTMLElement;
    const initialInputs = Array.from(div.children) as HTMLInputElement[];

    // User "types" in the inputs (simulating user interaction)
    initialInputs[0].value = "Modified First";
    initialInputs[1].value = "Modified Second";
    initialInputs[2].value = "Modified Third";

    // Store references
    const input1 = initialInputs[0];
    const input2 = initialInputs[1];
    const input3 = initialInputs[2];

    // Reorder to third, first, second
    stateFn!.order = ["third", "first", "second"];
    await waitForUpdate();

    const newInputs = Array.from(div.children) as HTMLInputElement[];

    // Verify elements were moved (not recreated) so user modifications are preserved
    expect(newInputs[0]).toBe(input3);
    expect(newInputs[1]).toBe(input1);
    expect(newInputs[2]).toBe(input2);

    // The user's modifications should be preserved because the DOM elements were moved
    expect(newInputs[0].value).toBe("Modified Third");
    expect(newInputs[1].value).toBe("Modified First");
    expect(newInputs[2].value).toBe("Modified Second");
  });

  it("should handle adding new items with keys", async () => {
    const container = document.createElement("div");
    let stateFn: ReturnType<typeof createState<{ items: string[] }>>;

    const App = () => {
      const state = createState({ items: ["a", "b"] });
      stateFn = state;
      return () =>
        jsx("ul", {
          children: state.items.map((key) =>
            jsx("li", { children: `Item ${key.toUpperCase()}` }, key)
          ),
        });
    };

    render(jsx(App, {}), container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(2);

    // Store references
    const itemA = initialChildren[0];
    const itemB = initialChildren[1];

    // Add a new item in the middle
    stateFn!.items = ["a", "c", "b"];
    await waitForUpdate();

    const newChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(3);

    // Original elements should be preserved
    expect(newChildren[0]).toBe(itemA);
    expect(newChildren[2]).toBe(itemB);

    // New element in the middle
    expect(newChildren[1]).not.toBe(itemA);
    expect(newChildren[1]).not.toBe(itemB);
    expect(newChildren[1].textContent).toBe("Item C");
  });

  it("should handle removing items with keys", async () => {
    const container = document.createElement("div");
    let stateFn: ReturnType<typeof createState<{ items: string[] }>>;

    const App = () => {
      const state = createState({ items: ["a", "b", "c"] });
      stateFn = state;
      return () =>
        jsx("ul", {
          children: state.items.map((key) =>
            jsx("li", { children: `Item ${key.toUpperCase()}` }, key)
          ),
        });
    };

    render(jsx(App, {}), container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(3);

    // Store references
    const itemA = initialChildren[0];
    const itemC = initialChildren[2];

    // Remove the middle item
    stateFn!.items = ["a", "c"];
    await waitForUpdate();

    const newChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(2);

    // Remaining elements should be preserved
    expect(newChildren[0]).toBe(itemA);
    expect(newChildren[1]).toBe(itemC);
  });

  it("should handle replacing all items with different keys", async () => {
    const container = document.createElement("div");
    let stateFn: ReturnType<typeof createState<{ items: string[] }>>;

    const App = () => {
      const state = createState({ items: ["a", "b", "c"] });
      stateFn = state;
      return () =>
        jsx("ul", {
          children: state.items.map((key) =>
            jsx("li", { children: `Item ${key.toUpperCase()}` }, key)
          ),
        });
    };

    render(jsx(App, {}), container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    // Store references
    const itemA = initialChildren[0];
    const itemB = initialChildren[1];
    const itemC = initialChildren[2];

    // Replace all items with new keys
    stateFn!.items = ["x", "y", "z"];
    await waitForUpdate();

    const newChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(3);

    // All elements should be new instances
    expect(newChildren[0]).not.toBe(itemA);
    expect(newChildren[1]).not.toBe(itemB);
    expect(newChildren[2]).not.toBe(itemC);

    expect(newChildren[0].textContent).toBe("Item X");
    expect(newChildren[1].textContent).toBe("Item Y");
    expect(newChildren[2].textContent).toBe("Item Z");
  });

  it("should handle complex reordering scenario with keys", async () => {
    const container = document.createElement("div");
    let stateFn: ReturnType<typeof createState<{ items: string[] }>>;

    const App = () => {
      const state = createState({ items: ["a", "b", "c", "d", "e"] });
      stateFn = state;
      return () =>
        jsx("ul", {
          children: state.items.map((key) =>
            jsx("li", { children: key.toUpperCase() }, key)
          ),
        });
    };

    render(jsx(App, {}), container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    const [itemA, itemB, itemC, itemD, itemE] = initialChildren;

    // Complex reorder: remove C, add F, reorder to [E, A, F, D, B]
    stateFn!.items = ["e", "a", "f", "d", "b"];
    await waitForUpdate();

    const newChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(5);

    // Verify preserved elements are in correct positions
    expect(newChildren[0]).toBe(itemE);
    expect(newChildren[1]).toBe(itemA);
    expect(newChildren[3]).toBe(itemD);
    expect(newChildren[4]).toBe(itemB);

    // F is new
    expect(newChildren[2]).not.toBe(itemA);
    expect(newChildren[2]).not.toBe(itemB);
    expect(newChildren[2]).not.toBe(itemC);
    expect(newChildren[2]).not.toBe(itemD);
    expect(newChildren[2]).not.toBe(itemE);
    expect(newChildren[2].textContent).toBe("F");

    // C should not be in the list
    expect(newChildren.includes(itemC)).toBe(false);
  });

  it("should handle nested elements with keys", async () => {
    const container = document.createElement("div");
    let stateFn: ReturnType<typeof createState<{ order: string[] }>>;

    const App = () => {
      const state = createState({ order: ["section1", "section2"] });
      stateFn = state;
      return () =>
        jsx("div", {
          children: state.order.map((key) => {
            const num = key === "section1" ? "1" : "2";
            return jsx(
              "section",
              {
                children: [
                  jsx("h2", { children: `Section ${num}` }),
                  jsx("p", { children: `Content ${num}` }),
                ],
              },
              key
            );
          }),
        });
    };

    render(jsx(App, {}), container);

    const div = container.children[0] as HTMLElement;
    const initialSections = Array.from(div.children);

    const section1 = initialSections[0];
    const section2 = initialSections[1];

    // Reorder sections
    stateFn!.order = ["section2", "section1"];
    await waitForUpdate();

    const newSections = Array.from(div.children);

    // Verify sections were moved, not recreated
    expect(newSections[0]).toBe(section2);
    expect(newSections[1]).toBe(section1);

    expect(newSections[0].children[0].textContent).toBe("Section 2");
    expect(newSections[1].children[0].textContent).toBe("Section 1");
  });

  it("should handle mixed keys and non-keyed elements", async () => {
    const container = document.createElement("div");
    let stateFn: ReturnType<
      typeof createState<{ items: Array<{ key?: string; text: string }> }>
    >;

    const App = () => {
      const state = createState({
        items: [
          { key: "a", text: "Item A" },
          { text: "Item B" },
          { key: "c", text: "Item C" },
        ],
      });
      stateFn = state;
      return () =>
        jsx("ul", {
          children: state.items.map((item) =>
            jsx("li", { children: item.text }, item.key)
          ),
        });
    };

    render(jsx(App, {}), container);

    const ul = container.children[0] as HTMLElement;

    expect(ul.children.length).toBe(3);
    expect(ul.children[0].textContent).toBe("Item A");
    expect(ul.children[1].textContent).toBe("Item B");
    expect(ul.children[2].textContent).toBe("Item C");

    // Reorder with mixed keys
    stateFn!.items = [
      { key: "c", text: "Item C" },
      { text: "Item B Modified" },
      { key: "a", text: "Item A" },
    ];
    await waitForUpdate();

    expect(ul.children.length).toBe(3);
    expect(ul.children[0].textContent).toBe("Item C");
    expect(ul.children[1].textContent).toBe("Item B Modified");
    expect(ul.children[2].textContent).toBe("Item A");
  });
});

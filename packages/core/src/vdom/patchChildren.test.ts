import { describe, it, expect, vi } from "vitest";
import { AbstractVNode } from "./AbstractVNode";
import { VNode } from "./types";

// Helper to convert MockVNode arrays to VNode arrays
const toVNodes = (nodes: MockVNode[]): VNode[] => nodes as unknown as VNode[];

// Mock VNode for testing
class MockVNode extends AbstractVNode {
  public mountCalls = 0;
  public patchCalls = 0;
  public unmountCalls = 0;
  public patchedWith?: VNode;

  constructor(key?: string) {
    super();
    this.key = key;
  }

  mount(parent?: VNode): Node {
    this.mountCalls++;
    this.parent = parent;
    this.elm = document.createTextNode(`mock-${this.key || "no-key"}`);
    return this.elm;
  }

  patch(newNode: VNode): void {
    this.patchCalls++;
    this.patchedWith = newNode;
    // In real implementation, old node updates itself from new node
    // but keeps the same object reference
  }

  unmount(): void {
    this.unmountCalls++;
    delete this.elm;
    delete this.parent;
  }

  rerender(): void {
    // No-op for mock
  }
}

// Parent mock that has children
class MockParentVNode extends MockVNode {
  constructor(initialChildren?: MockVNode[], key?: string) {
    super(key);
    this.children = (initialChildren || []) as unknown as VNode[];
  }
}

describe("patchChildren (new approach: keep old, patch in new)", () => {
  describe("Edge cases", () => {
    it("should mount all new children when starting with empty", () => {
      const newChild1 = new MockVNode("a");
      const newChild2 = new MockVNode("b");
      const parent = new MockParentVNode([]);

      const result = parent.patchChildren(toVNodes([newChild1, newChild2]));

      // New children should be mounted
      expect(newChild1.mountCalls).toBe(1);
      expect(newChild2.mountCalls).toBe(1);
      expect(newChild1.parent).toBe(parent);
      expect(newChild2.parent).toBe(parent);

      // Result should be the new children (since old was empty)
      expect(result).toEqual([newChild1, newChild2]);
    });

    it("should unmount all old children when new is empty", () => {
      const oldChild1 = new MockVNode("a");
      const oldChild2 = new MockVNode("b");
      const parent = new MockParentVNode([oldChild1, oldChild2]);

      const result = parent.patchChildren(toVNodes([]));

      // Old children should be unmounted
      expect(oldChild1.unmountCalls).toBe(1);
      expect(oldChild2.unmountCalls).toBe(1);

      // Result should be empty
      expect(result).toEqual([]);
    });
  });

  describe("Patching with keys", () => {
    it("should reuse old VNodes when keys match", () => {
      const oldChild1 = new MockVNode("a");
      const oldChild2 = new MockVNode("b");
      const oldChild3 = new MockVNode("c");
      const parent = new MockParentVNode([oldChild1, oldChild2, oldChild3]);

      const newChild1 = new MockVNode("a");
      const newChild2 = new MockVNode("b");
      const newChild3 = new MockVNode("c");

      const result = parent.patchChildren(toVNodes([newChild1, newChild2, newChild3]));

      // OLD children should be patched with new children
      expect(oldChild1.patchCalls).toBe(1);
      expect(oldChild2.patchCalls).toBe(1);
      expect(oldChild3.patchCalls).toBe(1);

      expect(oldChild1.patchedWith).toBe(newChild1);
      expect(oldChild2.patchedWith).toBe(newChild2);
      expect(oldChild3.patchedWith).toBe(newChild3);

      // NEW children should NOT be mounted
      expect(newChild1.mountCalls).toBe(0);
      expect(newChild2.mountCalls).toBe(0);
      expect(newChild3.mountCalls).toBe(0);

      // OLD children should NOT be unmounted
      expect(oldChild1.unmountCalls).toBe(0);
      expect(oldChild2.unmountCalls).toBe(0);
      expect(oldChild3.unmountCalls).toBe(0);

      // Result should still be the OLD children (reused)
      expect(result).toEqual([oldChild1, oldChild2, oldChild3]);
    });

    it("should handle reordered children with keys", () => {
      const oldChild1 = new MockVNode("a");
      const oldChild2 = new MockVNode("b");
      const oldChild3 = new MockVNode("c");
      const parent = new MockParentVNode([oldChild1, oldChild2, oldChild3]);

      // Reordered: c, a, b
      const newChild1 = new MockVNode("c");
      const newChild2 = new MockVNode("a");
      const newChild3 = new MockVNode("b");

      const result = parent.patchChildren(toVNodes([newChild1, newChild2, newChild3]));

      // Old nodes should be patched with corresponding new nodes by key
      expect(oldChild1.patchedWith).toBe(newChild2); // a->a
      expect(oldChild2.patchedWith).toBe(newChild3); // b->b
      expect(oldChild3.patchedWith).toBe(newChild1); // c->c

      // No unmounts
      expect(oldChild1.unmountCalls).toBe(0);
      expect(oldChild2.unmountCalls).toBe(0);
      expect(oldChild3.unmountCalls).toBe(0);

      // Result should be old children in NEW order (c, a, b)
      expect(result).toEqual([oldChild3, oldChild1, oldChild2]);
      // Verify correct keys
      expect(result[0].key).toBe("c");
      expect(result[1].key).toBe("a");
      expect(result[2].key).toBe("b");
    });

    it("should mount new children and unmount removed children", () => {
      const oldChild1 = new MockVNode("a");
      const oldChild2 = new MockVNode("b");
      const oldChild3 = new MockVNode("c");
      const parent = new MockParentVNode([oldChild1, oldChild2, oldChild3]);

      // Remove 'b', add 'd'
      const newChild1 = new MockVNode("a");
      const newChild2 = new MockVNode("c");
      const newChild3 = new MockVNode("d");

      const result = parent.patchChildren(toVNodes([newChild1, newChild2, newChild3]));

      // a and c should be patched (reused)
      expect(oldChild1.patchedWith).toBe(newChild1);
      expect(oldChild3.patchedWith).toBe(newChild2);

      // d should be mounted
      expect(newChild3.mountCalls).toBe(1);

      // b should be unmounted
      expect(oldChild2.unmountCalls).toBe(1);

      // Result should contain old a, old c, and new d
      expect(result).toContain(oldChild1);
      expect(result).toContain(oldChild3);
      expect(result).toContain(newChild3);
      expect(result).not.toContain(oldChild2);
      expect(result.length).toBe(3);
    });

    it("should replace all children when all keys change", () => {
      const oldChild1 = new MockVNode("a");
      const oldChild2 = new MockVNode("b");
      const parent = new MockParentVNode([oldChild1, oldChild2]);

      const newChild1 = new MockVNode("x");
      const newChild2 = new MockVNode("y");

      const result = parent.patchChildren(toVNodes([newChild1, newChild2]));

      // All new children should be mounted
      expect(newChild1.mountCalls).toBe(1);
      expect(newChild2.mountCalls).toBe(1);

      // All old children should be unmounted
      expect(oldChild1.unmountCalls).toBe(1);
      expect(oldChild2.unmountCalls).toBe(1);

      // Result should be the new children
      expect(result).toEqual([newChild1, newChild2]);
    });
  });

  describe("Patching without keys (index-based)", () => {
    it("should patch children by index when no keys", () => {
      const oldChild1 = new MockVNode();
      const oldChild2 = new MockVNode();
      const oldChild3 = new MockVNode();
      const parent = new MockParentVNode([oldChild1, oldChild2, oldChild3]);

      const newChild1 = new MockVNode();
      const newChild2 = new MockVNode();
      const newChild3 = new MockVNode();

      const result = parent.patchChildren(toVNodes([newChild1, newChild2, newChild3]));

      // Should patch by index: 0->0, 1->1, 2->2
      expect(oldChild1.patchedWith).toBe(newChild1);
      expect(oldChild2.patchedWith).toBe(newChild2);
      expect(oldChild3.patchedWith).toBe(newChild3);

      // No unmounts
      expect(oldChild1.unmountCalls).toBe(0);
      expect(oldChild2.unmountCalls).toBe(0);
      expect(oldChild3.unmountCalls).toBe(0);

      // Result should be old children (reused)
      expect(result).toEqual([oldChild1, oldChild2, oldChild3]);
    });

    it("should mount new children when growing without keys", () => {
      const oldChild1 = new MockVNode();
      const oldChild2 = new MockVNode();
      const parent = new MockParentVNode([oldChild1, oldChild2]);

      const newChild1 = new MockVNode();
      const newChild2 = new MockVNode();
      const newChild3 = new MockVNode();
      const newChild4 = new MockVNode();

      const result = parent.patchChildren(toVNodes([
        newChild1,
        newChild2,
        newChild3,
        newChild4,
      ]));

      // First two should be patched (reused)
      expect(oldChild1.patchedWith).toBe(newChild1);
      expect(oldChild2.patchedWith).toBe(newChild2);

      // Last two should be mounted
      expect(newChild3.mountCalls).toBe(1);
      expect(newChild4.mountCalls).toBe(1);

      // No unmounts
      expect(oldChild1.unmountCalls).toBe(0);
      expect(oldChild2.unmountCalls).toBe(0);

      // Result should be [oldChild1, oldChild2, newChild3, newChild4]
      expect(result).toEqual([oldChild1, oldChild2, newChild3, newChild4]);
    });

    it("should unmount old children when shrinking without keys", () => {
      const oldChild1 = new MockVNode();
      const oldChild2 = new MockVNode();
      const oldChild3 = new MockVNode();
      const oldChild4 = new MockVNode();
      const parent = new MockParentVNode([
        oldChild1,
        oldChild2,
        oldChild3,
        oldChild4,
      ]);

      const newChild1 = new MockVNode();
      const newChild2 = new MockVNode();

      const result = parent.patchChildren(toVNodes([newChild1, newChild2]));

      // First two should be patched
      expect(oldChild1.patchedWith).toBe(newChild1);
      expect(oldChild2.patchedWith).toBe(newChild2);

      // Last two old children should be unmounted
      expect(oldChild3.unmountCalls).toBe(1);
      expect(oldChild4.unmountCalls).toBe(1);

      // First two should not be unmounted
      expect(oldChild1.unmountCalls).toBe(0);
      expect(oldChild2.unmountCalls).toBe(0);

      // Result should be [oldChild1, oldChild2]
      expect(result).toEqual([oldChild1, oldChild2]);
    });
  });

  describe("Mixed keys and indices", () => {
    it("should handle mix of keyed and non-keyed children", () => {
      const oldChild1 = new MockVNode("a"); // key: "a"
      const oldChild2 = new MockVNode(); // key: undefined -> index 1
      const oldChild3 = new MockVNode("c"); // key: "c"
      const parent = new MockParentVNode([oldChild1, oldChild2, oldChild3]);

      const newChild1 = new MockVNode("a"); // key: "a"
      const newChild2 = new MockVNode(); // key: undefined -> index 1
      const newChild3 = new MockVNode("c"); // key: "c"

      const result = parent.patchChildren(toVNodes([newChild1, newChild2, newChild3]));

      // Keyed children should patch by key
      expect(oldChild1.patchedWith).toBe(newChild1);
      expect(oldChild3.patchedWith).toBe(newChild3);

      // Non-keyed child should patch by index
      expect(oldChild2.patchedWith).toBe(newChild2);

      // No unmounts
      expect(oldChild1.unmountCalls).toBe(0);
      expect(oldChild2.unmountCalls).toBe(0);
      expect(oldChild3.unmountCalls).toBe(0);

      // Result should be old children (reused)
      expect(result).toEqual([oldChild1, oldChild2, oldChild3]);
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle conditional rendering (null -> component)", () => {
      const oldChild1 = new MockVNode("title");
      const parent = new MockParentVNode([oldChild1]);

      const newChild1 = new MockVNode("title");
      const newChild2 = new MockVNode("details");

      const result = parent.patchChildren(toVNodes([newChild1, newChild2]));

      // Title should be patched (reused)
      expect(oldChild1.patchedWith).toBe(newChild1);

      // Details should be mounted
      expect(newChild2.mountCalls).toBe(1);

      // No unmounts
      expect(oldChild1.unmountCalls).toBe(0);

      // Result should be [oldChild1, newChild2]
      expect(result).toEqual([oldChild1, newChild2]);
    });

    it("should handle conditional rendering (component -> null)", () => {
      const oldChild1 = new MockVNode("title");
      const oldChild2 = new MockVNode("details");
      const parent = new MockParentVNode([oldChild1, oldChild2]);

      const newChild1 = new MockVNode("title");

      const result = parent.patchChildren(toVNodes([newChild1]));

      // Title should be patched (reused)
      expect(oldChild1.patchedWith).toBe(newChild1);

      // Details should be unmounted
      expect(oldChild2.unmountCalls).toBe(1);

      // Title should not be unmounted
      expect(oldChild1.unmountCalls).toBe(0);

      // Result should be [oldChild1]
      expect(result).toEqual([oldChild1]);
    });

    it("should handle list with items added at beginning", () => {
      const oldChild1 = new MockVNode("item-1");
      const oldChild2 = new MockVNode("item-2");
      const parent = new MockParentVNode([oldChild1, oldChild2]);

      const newChild1 = new MockVNode("item-0"); // New item at start
      const newChild2 = new MockVNode("item-1");
      const newChild3 = new MockVNode("item-2");

      const result = parent.patchChildren(toVNodes([newChild1, newChild2, newChild3]));

      // New item should be mounted
      expect(newChild1.mountCalls).toBe(1);

      // Existing items should be patched (reused)
      expect(oldChild1.patchedWith).toBe(newChild2);
      expect(oldChild2.patchedWith).toBe(newChild3);

      // No unmounts
      expect(oldChild1.unmountCalls).toBe(0);
      expect(oldChild2.unmountCalls).toBe(0);

      // Result should be [newChild1, oldChild1, oldChild2]
      expect(result).toEqual([newChild1, oldChild1, oldChild2]);
    });

    it("should handle list with items added at end", () => {
      const oldChild1 = new MockVNode("item-1");
      const oldChild2 = new MockVNode("item-2");
      const parent = new MockParentVNode([oldChild1, oldChild2]);

      const newChild1 = new MockVNode("item-1");
      const newChild2 = new MockVNode("item-2");
      const newChild3 = new MockVNode("item-3"); // New item at end

      const result = parent.patchChildren(toVNodes([newChild1, newChild2, newChild3]));

      // Existing items should be patched (reused)
      expect(oldChild1.patchedWith).toBe(newChild1);
      expect(oldChild2.patchedWith).toBe(newChild2);

      // New item should be mounted
      expect(newChild3.mountCalls).toBe(1);

      // No unmounts
      expect(oldChild1.unmountCalls).toBe(0);
      expect(oldChild2.unmountCalls).toBe(0);

      // Result should be [oldChild1, oldChild2, newChild3]
      expect(result).toEqual([oldChild1, oldChild2, newChild3]);
    });

    it("should handle list with item removed from middle", () => {
      const oldChild1 = new MockVNode("item-1");
      const oldChild2 = new MockVNode("item-2");
      const oldChild3 = new MockVNode("item-3");
      const parent = new MockParentVNode([oldChild1, oldChild2, oldChild3]);

      const newChild1 = new MockVNode("item-1");
      const newChild2 = new MockVNode("item-3"); // item-2 removed

      const result = parent.patchChildren(toVNodes([newChild1, newChild2]));

      // item-1 and item-3 should be patched (reused)
      expect(oldChild1.patchedWith).toBe(newChild1);
      expect(oldChild3.patchedWith).toBe(newChild2);

      // item-2 should be unmounted
      expect(oldChild2.unmountCalls).toBe(1);

      // Others should not be unmounted
      expect(oldChild1.unmountCalls).toBe(0);
      expect(oldChild3.unmountCalls).toBe(0);

      // Result should be [oldChild1, oldChild3]
      expect(result).toEqual([oldChild1, oldChild3]);
    });

    it("should handle empty -> multiple children", () => {
      const parent = new MockParentVNode([]);

      const newChild1 = new MockVNode("a");
      const newChild2 = new MockVNode("b");
      const newChild3 = new MockVNode("c");

      const result = parent.patchChildren(toVNodes([newChild1, newChild2, newChild3]));

      // All should be mounted
      expect(newChild1.mountCalls).toBe(1);
      expect(newChild2.mountCalls).toBe(1);
      expect(newChild3.mountCalls).toBe(1);

      // Result should be the new children
      expect(result).toEqual([newChild1, newChild2, newChild3]);
    });

    it("should handle multiple children -> empty", () => {
      const oldChild1 = new MockVNode("a");
      const oldChild2 = new MockVNode("b");
      const oldChild3 = new MockVNode("c");
      const parent = new MockParentVNode([oldChild1, oldChild2, oldChild3]);

      const result = parent.patchChildren(toVNodes([]));

      // All should be unmounted
      expect(oldChild1.unmountCalls).toBe(1);
      expect(oldChild2.unmountCalls).toBe(1);
      expect(oldChild3.unmountCalls).toBe(1);

      // Result should be empty
      expect(result).toEqual([]);
    });
  });

  describe("Object reference preservation", () => {
    it("should preserve old VNode object references when patching", () => {
      const oldChild1 = new MockVNode("a");
      const oldChild2 = new MockVNode("b");
      const parent = new MockParentVNode([oldChild1, oldChild2]);

      const newChild1 = new MockVNode("a");
      const newChild2 = new MockVNode("b");

      const result = parent.patchChildren(toVNodes([newChild1, newChild2]));

      // The result should contain the EXACT SAME object references as the old children
      expect(result[0]).toBe(oldChild1); // Same object reference
      expect(result[1]).toBe(oldChild2); // Same object reference

      // NOT the new children
      expect(result[0]).not.toBe(newChild1);
      expect(result[1]).not.toBe(newChild2);
    });
  });
});

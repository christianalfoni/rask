// Test setup file for vitest
import { afterEach } from "vitest";
import { render } from "./vdom";
import { VNode } from "./vdom/types";

// Clean up after each test
afterEach(() => {
  document.body.innerHTML = "";

  // Remove any style tags added by render function
  document.querySelectorAll("style").forEach((style) => style.remove());
});

/**
 * Test helper to render a component and provide easy cleanup
 *
 * @example
 * const { container, unmount } = renderComponent(<MyComponent />);
 * expect(container.textContent).toBe('hello');
 * unmount();
 */
export function renderComponent(vnode: VNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  let currentVnode = render(vnode, container);
  const actualElement = currentVnode.elm as HTMLElement;

  return {
    // The actual rendered DOM element (after patch replaces container)
    container: actualElement,
    // The vnode returned by render
    vnode: currentVnode,
    // Cleanup function
    unmount: () => {
      if (actualElement && actualElement.parentNode) {
        actualElement.parentNode.removeChild(actualElement);
      }
    },
    // Re-render with new vnode
    rerender: (newVnode: VNode) => {
      (currentVnode as any).patch(newVnode);
    },
  };
}

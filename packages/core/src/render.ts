import {
  init,
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
  attributesModule,
  type VNode,
  h,
} from "snabbdom";
import { createComponent, type Component } from "./component";

export const patch = init([
  // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
  attributesModule,
]);

export function render(vnode: VNode, container: HTMLElement) {
  const style = document.createElement("style");
  style.innerHTML = "component { display: contents; }";
  document.head.appendChild(style);
  patch(container, vnode);
}

export function jsx(
  type: string | Component<any>,
  props: Record<string, unknown>,
  children: VNode[]
) {
  let flatChildren = children.flat();

  if (typeof type === "string") {
    const data = {} as any;
    for (const key in props) {
      if (key === "key") {
        data[key] = props[key];
        continue;
      }

      if (key === "hook") {
        data[key] = props[key];
        continue;
      }

      if (key === "style") {
        data.style = props[key];
        continue;
      }

      if (key.startsWith("on")) {
        data.on = data.on || {};
        data.on[key.substring(2).toLocaleLowerCase()] = props[key];
        continue;
      }

      if (key.startsWith("data-") || key.startsWith("aria-")) {
        data.attrs = data.attrs || {};
        data.attrs[key] = props[key];
        continue;
      }

      if (type === "svg") {
        data.attrs = data.attrs || {};
        data.attrs[key] = props[key];
        continue;
      }

      data.props = data.props || {};
      data.props[key] = props[key];
    }

    return h(type, data, flatChildren);
  }

  const maybeSingleChild =
    flatChildren.length === 1 ? flatChildren[0] : flatChildren;

  return createComponent(type, props, maybeSingleChild);
}

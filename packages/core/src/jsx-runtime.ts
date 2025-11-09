// JSX runtime implementation
import type { JSXInternal } from "./jsx";
import { jsx as internalJsx } from "./vdom";

export { Fragment } from "./vdom/FragmentVNode";

export function jsx(
  type: string,
  props: JSXInternal.HTMLAttributes &
    JSXInternal.SVGAttributes &
    Record<string, any>,
  key?: string
): any;
export function jsx<P>(
  type: (props: P) => any,
  props: P & { children?: any },
  key?: string
): any;
export function jsx(type: any, props: any, key?: any): any {
  return internalJsx(type, props, key);
}

export function jsxs(
  type: string,
  props: JSXInternal.HTMLAttributes &
    JSXInternal.SVGAttributes &
    Record<string, any>,
  key?: string
): any;
export function jsxs<P>(
  type: (props: P) => any,
  props: P & { children?: any[] },
  key?: string
): any;
export function jsxs(type: any, props: any, key?: any): any {
  return jsx(type, props, key);
}

// Export the JSXInternal namespace renamed as JSX for TypeScript
export type { JSXInternal as JSX } from "./jsx";

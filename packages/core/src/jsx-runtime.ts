// JSX runtime implementation
import type { JSXInternal } from "./jsx";
import { jsx as internalJsx } from "./render";

export const FragmentSymbol = Symbol.for("superfine-components.Fragment");

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
  const { children, ...restProps } = props;
  const finalProps = key !== undefined ? { ...restProps, key } : restProps;
  const finalChildren = Array.isArray(children)
    ? children
    : children
    ? [children]
    : [];

  return internalJsx(type, finalProps, finalChildren);
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

export function Fragment(props?: { children?: any }): any {
  return props?.children;
}

(Fragment as any).$$typeof = FragmentSymbol;

// Export the JSXInternal namespace renamed as JSX for TypeScript
export type { JSXInternal as JSX } from "./jsx";

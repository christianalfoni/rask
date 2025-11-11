// JSX runtime implementation
import { Component, createComponentVNode } from "inferno";
import { VNodeFlags } from "inferno-vnode-flags";
import type { JSXInternal } from "./jsx";
import { createElement } from "inferno-create-element";
import { createComponent, RaskFunctionComponent } from "./component";
import { ErrorBoundary } from "./error";
export { Fragment } from "inferno";

export function jsx(
  type: string,
  props: JSXInternal.HTMLAttributes &
    JSXInternal.SVGAttributes &
    Record<string, any>,
  key?: string
): any;
export function jsx<P>(
  type: ((props: P) => any) | (new () => Component),
  props: P & { children?: any },
  key?: string
): any;
export function jsx(type: any, { children, ...props }: any, key?: any): any {
  if (typeof type === "string") {
    return createElement(type, { ...props, key }, ...children);
  }

  if (type === ErrorBoundary) {
    console.log("WTF");
    return createComponentVNode(
      VNodeFlags.Component,
      ErrorBoundary,
      { ...props, children },
      key
    );
  }

  return createComponent({ ...props, children, __component: type }, key);
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

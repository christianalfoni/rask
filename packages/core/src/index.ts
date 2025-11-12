import { render as infernoRender } from "inferno";
import { installEventBatching } from "./batch";
export { onCleanup, onMount } from "./component";
export { createContext } from "./createContext";
export { createState } from "./createState";
export { createAsync } from "./createAsync";
export { ErrorBoundary } from "./error";
export { createQuery } from "./createQuery";
export { createMutation } from "./createMutation";
export { createRef } from "inferno";
export { createView } from "./createView";
export { createEffect } from "./createEffect";
export { createComputed } from "./createComputed";
export function render(...params: Parameters<typeof infernoRender>) {
  if (!params[1]) {
    throw new Error("You need a target container");
  }
  installEventBatching(params[1]);
  return infernoRender(...params);
}

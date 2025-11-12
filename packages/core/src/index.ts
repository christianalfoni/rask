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

export function render(...params: Parameters<typeof infernoRender>) {
  installEventBatching();
  return infernoRender(...params);
}

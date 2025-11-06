import { getCurrentComponent } from "./component";

export function ErrorBoundary(props: { children: any }) {
  const component = getCurrentComponent();
  return () => {};
}

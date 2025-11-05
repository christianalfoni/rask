import { createContext, render, createState } from "@snabbdom-components/core";

import "./style.css";

function Counter() {
  const state = appContext.get();
  return () => <h4>Nested {state.count}</h4>;
}

export const appContext = createContext<{ count: number }>();

function App() {
  const state = createState({
    count: 0,
  });

  appContext.set(state);

  return () => (
    <h1 onClick={() => state.count++}>
      Hello World ({state.count}) <Counter />
    </h1>
  );
}

render(<App />, document.querySelector("#app")!);

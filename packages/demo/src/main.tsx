import {
  createContext,
  render,
  createState,
  createSuspense,
  Suspense,
} from "@snabbdom-components/core";

import "./style.css";

function Counter() {
  const values = createSuspense({
    test: new Promise<string>((resolve) =>
      setTimeout(() => resolve("Hello World"), 5000)
    ),
  });

  return () => <h4>Nested {values.test}</h4>;
}

function App() {
  const state = createState({
    count: 0,
  });

  return () => (
    <h1 onClick={() => state.count++}>
      <Suspense fallback={<span>Loading...</span>}>
        <Counter />
      </Suspense>
    </h1>
  );
}

render(<App />, document.querySelector("#app")!);

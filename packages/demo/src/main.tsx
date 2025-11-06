import {
  createAsyncState,
  createState,
  render,
} from "@snabbdom-components/core";

import "./style.css";

function App() {
  const state = createState({ count: 0 });
  const asyncString = createAsyncState(
    new Promise<string>((resolve) => setTimeout(() => resolve("woooh"), 3000))
  );

  return () => (
    <div>
      <button onClick={() => state.count++}>Increment ({state.count})</button>
      <div>
        This is async:{" "}
        {asyncString.isPending
          ? "Pending..."
          : asyncString.error === null
          ? asyncString.value
          : asyncString.error}
      </div>
    </div>
  );
}

render(<App />, document.querySelector("#app")!);

/*
# REACT
function App() {
  const [count, setCount] = useState(0)
  return <h1 onClick={() => setCount(count + 1)}>Hello World ({ count })</h1>
}
  
# SOLID
function App() {
  const [count, setCount] = createSignal(0)
  
  return <h1 onClick={() => setCount(count() + 1)}>Hello World ({count})</h1>
}
  
# REMIX 3
function App() {
  const state = { count: 0 }
  
  return () => <h1 onClick={() => {
    state.count++
    this.updateState()
  }}>Hello World ({state.count})</h1>
}
*/

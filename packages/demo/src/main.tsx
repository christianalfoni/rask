import { createRef, createState, render } from "rask-ui";

import "./style.css";

function App() {
  const state = createState({ count: 0, items: ["foo"] });
  const ref = createRef<HTMLDivElement>();

  return () => (
    <>
      <div ref={ref}>
        <h1 onClick={() => state.count++}>Counter {state.count}</h1>
        <button onClick={() => state.items.push("bar")}>Add</button>
        <ul>
          {state.items.map((item, index) => (
            <li onClick={() => state.items.splice(index, 1)}>{item}</li>
          ))}
        </ul>
      </div>
    </>
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

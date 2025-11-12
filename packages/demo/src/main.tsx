import {
  createAsync,
  createComputed,
  createEffect,
  createState,
  render,
} from "rask-ui";
import { TodoApp } from "./components/TodoApp";
import "./style.css";

function NestedComputed(props: { count: number }) {
  const state = createState({ show: false });
  const computed = createComputed({
    double: () => props.count * 2,
  });

  createEffect(() => {
    if (props.count > 3) {
      state.show = true;
    }
  });

  return () => (
    <div>
      <h4>Hihihi {computed.double}</h4>
      {state.show ? <h5>BOYAH</h5> : null}
    </div>
  );
}

function SomethingAsync() {
  const async = createAsync(
    new Promise((resolve) => setTimeout(resolve, 2000))
  );
  const state = createState({ count: 0, text: "" });

  return () => (
    <div>
      <h1
        onClick={() => {
          state.count++;
        }}
      >
        Hello {state.count}
        <pre>{JSON.stringify(async)}</pre>
        <NestedComputed count={state.count} />
      </h1>
    </div>
  );
}

render(<SomethingAsync />, document.querySelector("#app")!);

import { createAsync, createState, render } from "rask-ui";
import { TodoApp } from "./components/TodoApp";
import "./style.css";

function SomethingAsync() {
  const async = createAsync(
    new Promise((resolve) => setTimeout(resolve, 2000))
  );
  const state = createState({ count: 0, text: "" });

  return () =>
    console.log("RENDER") || (
      <div>
        <h1
          onClick={() => {
            state.count++;
            state.count++;
            state.count++;
          }}
        >
          Hello {state.count} <pre>{JSON.stringify(async)}</pre>
        </h1>
        <input
          type="text"
          value={state.text}
          onInput={(event) => {
            console.log("On change");
            state.text = event.target.value;
          }}
        />
      </div>
    );
}

render(<SomethingAsync />, document.querySelector("#app")!);

import { createState, render } from "rask-ui";

function _random(max) {
  return Math.round(Math.random() * 1000) % max;
}

const adjectives = [
  "pretty",
  "large",
  "big",
  "small",
  "tall",
  "short",
  "long",
  "handsome",
  "plain",
  "quaint",
  "clean",
  "elegant",
  "easy",
  "angry",
  "crazy",
  "helpful",
  "mushy",
  "odd",
  "unsightly",
  "adorable",
  "important",
  "inexpensive",
  "cheap",
  "expensive",
  "fancy",
];

const colours = [
  "red",
  "yellow",
  "blue",
  "green",
  "pink",
  "brown",
  "purple",
  "brown",
  "white",
  "black",
  "orange",
];

const nouns = [
  "table",
  "chair",
  "house",
  "bbq",
  "desk",
  "car",
  "pony",
  "cookie",
  "sandwich",
  "burger",
  "pizza",
  "mouse",
  "keyboard",
];

let nextId = 1;

function buildData(count) {
  const data = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: `${adjectives[_random(adjectives.length)]} ${
        colours[_random(colours.length)]
      } ${nouns[_random(nouns.length)]}`,
    };
  }
  return data;
}

function Row(props) {
  return () => (
    <tr class={props.row.id === props.selectedId ? "danger" : null}>
      <td class="col-md-1">{props.row.id}</td>
      <td class="col-md-4">
        <a onClick={() => props.onSelect(props.row.id)}>{props.row.label}</a>
      </td>
      <td class="col-md-1">
        <a onClick={() => props.onRemove(props.row.id)}>
          <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </a>
      </td>
      <td class="col-md-6"></td>
    </tr>
  );
}

// Create shared state
const state = createState({
  data: [],
  selectedId: null,
});

const run = () => {
  state.data = buildData(2);
  state.selectedId = null;
};

const runLots = () => {
  state.data = buildData(10000);
  state.selectedId = null;
};

const add = () => {
  state.data = [...state.data, ...buildData(1000)];
};

const update = () => {
  for (let i = 0; i < state.data.length; i += 10) {
    state.data[i].label += " !!!";
  }
};

const clear = () => {
  state.data = [];
  state.selectedId = null;
};

const swapRows = () => {
  if (state.data.length > 998) {
    const data = state.data.slice();
    const tmp = data[1];
    data[1] = data[998];
    data[998] = tmp;
    state.data = data;
  }
};

const select = (id) => {
  state.selectedId = id;
};

const remove = (id) => {
  state.data = state.data.filter((row) => row.id !== id);
};

function App() {
  return () =>
    state.data.map((row) => (
      <Row
        key={row.id}
        row={row}
        selectedId={state.selectedId}
        onSelect={select}
        onRemove={remove}
      />
    ));
}

run();

// Mount the app
render(<App />, document.getElementById("app")!);

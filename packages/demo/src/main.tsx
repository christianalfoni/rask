import { render } from "rask-ui";
import { TodoApp } from "./components/TodoApp";
import "./style.css";

render(<TodoApp />, document.querySelector("#app")!);

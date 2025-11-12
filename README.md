# RASK

<p align="center">
  <img src="logo.png" alt="Logo" width="200">
</p>

A lightweight reactive component library that combines the simplicity of observable state management with the full power of a virtual DOM reconciler. Ideal for single page applications, using web technology.

```bash
npm install rask-ui
```

## The Itch with Modern UI Frameworks

Modern UI frameworks present developers with a fundamental tradeoff between state management and UI expression:

### React: Great UI, Complex State

```tsx
function MyApp() {
  const [count, setCount] = useState(0);

  return <h1 onClick={() => setCount(count + 1)}>Count is {count}</h1>;
}
```

React excels at UI composition - you simply use the language to create dynamic UIs. However, including state management within the reconciler causes significant mental strain:

- Understanding closure captures and stale state
- Managing dependency arrays in hooks
- Dealing with re-render cascades
- Optimizing with `useMemo`, `useCallback`, and `memo`
- Wrestling with the "rules of hooks"

### Solid: Simple Reactivity, Hidden Complexity

```tsx
function MyApp() {
  const [count, setCount] = createSignal(0);

  return <h1 onClick={() => setCount(count() + 1)}>Count is {count()}</h1>;
}
```

Solid offers a seamingly simpler mental model with fine-grained reactivity. Updates don't happen by calling the component function again, which resolves the mental strain of expressing state management, however:

- The code you write is compiled to balance DX vs requirements of the runtime
- Special components for expressing dynamic UIs (`<Show>`, `<For>`, etc.)
- Different signatures for accessing reactive values: `count()` VS `state.count`

### RASK: Best of Both Worlds

```tsx
function MyApp() {
  const state = createState({ count: 0 });

  return () => <h1 onClick={() => state.count++}>Count is {state.count}</h1>;
}
```

RASK gives you:

- **Simple state management** - No reconciler interference with your state management
- **Full reconciler power** - Express complex UIs naturally with the language
- **No special syntax** - Access state properties directly, no function calls
- **No compiler magic** - Plain JavaScript/TypeScript
- **Simple mental model** - Just implement state and UI. No manual optimizations, special syntax or compiler magic

:fire: Built on [Inferno JS](https://github.com/infernojs/inferno).

## Getting Started

### Installation

```bash
npm install rask-ui
```

### Basic Example

```tsx
import { createState, render } from "rask-ui";

function Counter() {
  const state = createState({ count: 0 });

  return () => (
    <div>
      <h1>Count: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>
      <button onClick={() => state.count--}>Decrement</button>
    </div>
  );
}

render(<Counter />, document.getElementById("app")!);
```

### Key Concepts

#### 1. Component Structure

Components in RASK have two phases:

```tsx
function MyComponent(props) {
  // SETUP PHASE - Runs once when component is created
  const state = createState({ value: props.initial });

  onMount(() => {
    console.log("Component mounted!");
  });

  // RENDER PHASE - Returns a function that runs on every update
  return () => (
    <div>
      <p>{state.value}</p>
      <button onClick={() => state.value++}>Update</button>
    </div>
  );
}
```

The setup phase runs once, while the render function runs whenever reactive dependencies change.

#### 2. Reactive State

State objects are automatically reactive. Any property access during render is tracked:

```tsx
function TodoList() {
  const state = createState({
    todos: [],
    filter: "all",
  });

  const addTodo = (text) => {
    state.todos.push({ id: Date.now(), text, done: false });
  };

  return () => (
    <div>
      <input
        value={state.filter}
        onInput={(e) => (state.filter = e.target.value)}
      />
      <ul>
        {state.todos
          .filter(
            (todo) => state.filter === "all" || todo.text.includes(state.filter)
          )
          .map((todo) => (
            <li key={todo.id}>{todo.text}</li>
          ))}
      </ul>
    </div>
  );
}
```

#### 3. Props are Reactive Too

Props passed to components are automatically reactive:

```tsx
function Child(props) {
  // props is reactive - accessing props.value tracks the dependency
  return () => <div>{props.value}</div>;
}

function Parent() {
  const state = createState({ count: 0 });

  return () => (
    <div>
      <Child value={state.count} />
      <button onClick={() => state.count++}>Update</button>
    </div>
  );
}
```

When `state.count` changes in Parent, only Child re-renders because it accesses `props.value`.

### One Rule To Accept

**RASK has observable primitives**: Never destructure reactive objects (state, props, context values, async, query, mutation). Destructuring extracts plain values and breaks reactivity.

```tsx
// ❌ BAD - Destructuring breaks reactivity
function Counter(props) {
  const state = createState({ count: 0 });
  const { count } = state; // Extracts plain value!

  return () => <div>{count}</div>; // Won't update!
}

function Child({ value, name }) {
  // Destructuring props!
  return () => (
    <div>
      {value} {name}
    </div>
  ); // Won't update!
}

// ✅ GOOD - Access properties directly in render
function Counter(props) {
  const state = createState({ count: 0 });

  return () => <div>{state.count}</div>; // Reactive!
}

function Child(props) {
  // Don't destructure
  return () => (
    <div>
      {props.value} {props.name}
    </div>
  ); // Reactive!
}
```

**Why this happens:**

Reactive objects are implemented using JavaScript Proxies. When you access a property during render (e.g., `state.count`), the proxy tracks that dependency. But when you destructure (`const { count } = state`), the destructuring happens during setup—before any tracking context exists. You get a plain value instead of a tracked property access.

**This applies to:**

- `createState()` - Never destructure state objects
- Props - Never destructure component props
- `createContext().get()` - Never destructure context values
- `createAsync()` - Never destructure async state
- `createQuery()` - Never destructure query objects
- `createMutation()` - Never destructure mutation objects
- `createView()` - Never destructure view objects
- `createComputed()` - Never destructure computed objects

## API Reference

### Core Functions

#### `render(component, container)`

Mounts a component to a DOM element.

```tsx
import { render } from "rask-ui";

render(<App />, document.getElementById("app")!);
```

**Parameters:**

- `component` - The JSX component to render
- `container` - The DOM element to mount into

---

#### `createState<T>(initialState)`

Creates a reactive state object. Any property access during render is tracked, and changes trigger re-renders.

```tsx
import { createState } from "rask-ui";

function Example() {
  const state = createState({
    count: 0,
    items: ["a", "b", "c"],
    nested: { value: 42 },
  });

  // All mutations are reactive
  state.count++;
  state.items.push("d");
  state.nested.value = 100;

  return () => <div>{state.count}</div>;
}
```

**Parameters:**

- `initialState: T` - Initial state object

**Returns:** Reactive proxy of the state object

**Features:**

- Deep reactivity - nested objects and arrays are automatically reactive
- Direct mutations - no setter functions required
- Efficient tracking - only re-renders components that access changed properties

---

#### `createView<T>(...objects)`

Creates a view that merges multiple objects (reactive or plain) into a single object while maintaining reactivity through getters. Properties from later arguments override earlier ones.

```tsx
import { createView, createState } from "rask-ui";

function createCounter() {
  const state = createState({ count: 0, name: "Counter" });
  const increment = () => state.count++;
  const decrement = () => state.count--;
  const reset = () => (state.count = 0);

  return createView(state, { increment, decrement, reset });
}

function Counter() {
  const counter = createCounter();

  return () => (
    <div>
      <h1>
        {counter.name}: {counter.count}
      </h1>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.decrement}>-</button>
      <button onClick={counter.reset}>Reset</button>
    </div>
  );
}
```

**Parameters:**

- `...objects: object[]` - Objects to merge (reactive or plain). Later arguments override earlier ones.

**Returns:** A view object with getters for all properties, maintaining reactivity

**Notes:**

- Reactivity is maintained through getters that reference the source objects
- Changes to source objects are reflected in the view
- Only enumerable properties are included
- Symbol keys are supported
- **Do not destructure** - See warning section above

---

#### `createRef<T>()`

Creates a ref object for accessing DOM elements or component instances directly.

```tsx
import { createRef } from "rask-ui";

function Example() {
  const inputRef = createRef<HTMLInputElement>();

  const focus = () => {
    inputRef.current?.focus();
  };

  return () => (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focus}>Focus Input</button>
    </div>
  );
}
```

**Returns:** Ref object with:

- `current: T | null` - Reference to the DOM element or component instance
- Function signature for use as ref callback

**Usage:**

Pass the ref to an element's `ref` prop. The `current` property will be set to the DOM element when mounted and `null` when unmounted.

---

### Reactivity Primitives

#### `createEffect(callback)`

Creates an effect that automatically tracks reactive dependencies and re-runs whenever they change. The effect runs immediately on creation.

```tsx
import { createEffect, createState } from "rask-ui";

function Timer() {
  const state = createState({ count: 0, log: [] });

  // Effect runs immediately and whenever state.count changes
  createEffect(() => {
    console.log("Count changed:", state.count);
    state.log.push(`Count: ${state.count}`);
  });

  return () => (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
      <ul>
        {state.log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Parameters:**

- `callback: () => void` - Function to run when dependencies change

**Features:**

- Runs immediately on creation
- Automatically tracks reactive dependencies accessed during execution
- Re-runs on microtask when dependencies change (prevents synchronous cascades)
- Automatically cleaned up when component unmounts
- Can be used for side effects like logging, syncing to localStorage, or updating derived state

**Notes:**

- Only call during component setup phase (not in render function)
- Effects are queued on microtask to avoid synchronous execution from prop changes
- Be careful with effects that modify state - can cause infinite loops if not careful

---

#### `createComputed<T>(computed)`

Creates an object with computed properties that automatically track dependencies and cache results until dependencies change.

```tsx
import { createComputed, createState } from "rask-ui";

function ShoppingCart() {
  const state = createState({
    items: [
      { id: 1, name: "Apple", price: 1.5, quantity: 3 },
      { id: 2, name: "Banana", price: 0.8, quantity: 5 },
    ],
    taxRate: 0.2,
  });

  const computed = createComputed({
    subtotal: () =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    tax: () => computed.subtotal * state.taxRate,
    total: () => computed.subtotal + computed.tax,
    itemCount: () =>
      state.items.reduce((sum, item) => sum + item.quantity, 0),
  });

  return () => (
    <div>
      <h2>Cart ({computed.itemCount} items)</h2>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>
            {item.name}: ${item.price} x {item.quantity}
            <button onClick={() => item.quantity++}>+</button>
            <button onClick={() => item.quantity--}>-</button>
          </li>
        ))}
      </ul>
      <div>
        <p>Subtotal: ${computed.subtotal.toFixed(2)}</p>
        <p>Tax ({state.taxRate * 100}%): ${computed.tax.toFixed(2)}</p>
        <p>
          <strong>Total: ${computed.total.toFixed(2)}</strong>
        </p>
      </div>
    </div>
  );
}
```

**Parameters:**

- `computed: T` - Object where each property is a function returning a computed value

**Returns:** Reactive object with cached computed properties

**Features:**

- **Lazy evaluation** - Computed values are only calculated when accessed
- **Automatic caching** - Results are cached until dependencies change
- **Dependency tracking** - Automatically tracks what state each computed depends on
- **Composable** - Computed properties can depend on other computed properties
- **Efficient** - Only recomputes when dirty (dependencies changed)
- **Automatic cleanup** - Cleaned up when component unmounts

**Notes:**

- Access computed properties directly (e.g., `computed.total`), don't call as functions
- Computed properties are getters, not functions
- **Do not destructure** - Breaks reactivity (see warning section above)
- Only call during component setup phase

---

### Automatic Batching

RASK automatically batches state updates to minimize re-renders. This happens transparently without any special syntax.

**How it works:**

- **User interactions** (clicks, inputs, keyboard, etc.) - State changes are batched and flushed synchronously at the end of the event
- **Other updates** (setTimeout, fetch callbacks, etc.) - State changes are batched and flushed on the next microtask

```tsx
function BatchingExample() {
  const state = createState({ count: 0, clicks: 0 });

  const handleClick = () => {
    // All three updates are batched into a single render
    state.count++;
    state.clicks++;
    state.count++;
    // UI updates once with count=2, clicks=1
  };

  const handleAsync = () => {
    setTimeout(() => {
      // These updates are also batched (async batch)
      state.count++;
      state.clicks++;
      // UI updates once on next microtask
    }, 100);
  };

  return () => (
    <div>
      <p>
        Count: {state.count}, Clicks: {state.clicks}
      </p>
      <button onClick={handleClick}>Sync Update</button>
      <button onClick={handleAsync}>Async Update</button>
    </div>
  );
}
```

---

### Lifecycle Hooks

#### `onMount(callback)`

Registers a callback to run after the component is mounted to the DOM.

```tsx
import { onMount } from "rask-ui";

function Example() {
  onMount(() => {
    console.log("Component mounted!");
  });

  return () => <div>Hello</div>;
}
```

**Parameters:**

- `callback: () => void` - Function to call on mount. Can optionally return a cleanup function.

**Notes:**

- Only call during component setup phase (not in render function)
- Can be called multiple times to register multiple mount callbacks

---

#### `onCleanup(callback)`

Registers a callback to run when the component is unmounted.

```tsx
import { onCleanup } from "rask-ui";

function Example() {
  const state = createState({ time: Date.now() });

  const interval = setInterval(() => {
    state.time = Date.now();
  }, 1000);

  onCleanup(() => {
    clearInterval(interval);
  });

  return () => <div>{state.time}</div>;
}
```

**Parameters:**

- `callback: () => void` - Function to call on cleanup

**Notes:**

- Only call during component setup phase
- Can be called multiple times to register multiple cleanup callbacks
- Runs when component is removed from DOM

---

### Context API

#### `createContext<T>()`

Creates a context object for passing data through the component tree without props.

```tsx
import { createContext } from "rask-ui";

const ThemeContext = createContext<{ color: string }>();

function App() {
  ThemeContext.inject({ color: "blue" });

  return () => <Child />;
}

function Child() {
  const theme = ThemeContext.get();

  return () => <div style={{ color: theme.color }}>Themed text</div>;
}
```

**Returns:** Context object with `inject` and `get` methods

**Methods:**

- `inject(value: T)` - Injects context value for child components (call during setup)
- `get(): T` - Gets context value from nearest parent (call during setup)

**Notes:**

- Context traversal happens via component tree (parent-child relationships)
- Must be called during component setup phase
- Throws error if context not found in parent chain

---

### Async Data Management

#### `createAsync<T>(promise)`

Creates reactive state for async operations with loading and error states.

```tsx
import { createAsync } from "rask-ui";

function UserProfile() {
  const user = createAsync(fetch("/api/user").then((r) => r.json()));

  return () => }
    if (user.isPending) {
      return <p>Loading...</p>
    }

    if (user.error) {
      return <p>Error: {user.error}</p>
    }

    return <p>Hello, {user.value.name}!</p>
}
```

**Parameters:**

- `promise: Promise<T>` - The promise to track

**Returns:** Reactive object with:

- `isPending: boolean` - True while promise is pending
- `value: T | null` - Resolved value (null while pending or on error)
- `error: string | null` - Error message (null while pending or on success)

**States:**

- `{ isPending: true, value: null, error: null }` - Loading
- `{ isPending: false, value: T, error: null }` - Success
- `{ isPending: false, value: null, error: string }` - Error

---

#### `createQuery<T>(fetcher)`

Creates a query with refetch capability and request cancellation.

```tsx
import { createQuery } from "rask-ui";

function Posts() {
  const posts = createQuery(() => fetch("/api/posts").then((r) => r.json()));
  const renderPosts = () => {
    if (posts.isPending) {
      return <p>Loading...</p>;
    }

    if (posts.error) {
      return <p>Error: {posts.error}</p>;
    }

    return posts.data.map((post) => (
      <article key={post.id}>{post.title}</article>
    ));
  };

  return () => (
    <div>
      <button onClick={() => posts.fetch()}>Refresh</button>
      <button onClick={() => posts.fetch(true)}>Force Refresh</button>
      {renderPosts()}
    </div>
  );
}
```

**Parameters:**

- `fetcher: () => Promise<T>` - Function that returns a promise

**Returns:** Query object with:

- `isPending: boolean` - True while fetching
- `data: T | null` - Fetched data
- `error: string | null` - Error message
- `fetch(force?: boolean)` - Refetch data
  - `force: false` (default) - Keep existing data while refetching
  - `force: true` - Clear data before refetching

**Features:**

- Automatic request cancellation on refetch
- Keeps old data by default during refetch
- Automatically fetches on creation

---

#### `createMutation<T>(mutator)`

Creates a mutation for data updates with pending and error states.

```tsx
import { createMutation } from "rask-ui";

function CreatePost() {
  const state = createState({ title: "", body: "" });

  const create = createMutation((data) =>
    fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }))
  );

  const handleSubmit = () => {
    create.mutate({ title: state.title, body: state.body });
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        value={state.title}
        onInput={(e) => (state.title = e.target.value)}
      />
      <textarea
        value={state.body}
        onInput={(e) => (state.body = e.target.value)}
      />
      <button disabled={create.isPending}>
        {create.isPending ? "Creating..." : "Create"}
      </button>
      {create.error && <p>Error: {create.error}</p>}
    </form>
  );
}
```

**Parameters:**

- `mutator: (params: T) => Promise<T>` - Function that performs the mutation

**Returns:** Mutation object with:

- `isPending: boolean` - True while mutation is in progress
- `params: T | null` - Current mutation parameters
- `error: string | null` - Error message
- `mutate(params: T)` - Execute the mutation

**Features:**

- Automatic request cancellation if mutation called again
- Tracks mutation parameters
- Resets state after successful completion

---

### Error Handling

#### `ErrorBoundary`

Component that catches errors from child components.

```tsx
import { ErrorBoundary } from "rask-ui";

function App() {
  return () => (
    <ErrorBoundary
      error={(err) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{String(err)}</pre>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}

function MyComponent() {
  const state = createState({ count: 0 });

  return () => {
    if (state.count > 5) {
      throw new Error("Count too high!");
    }

    return <button onClick={() => state.count++}>{state.count}</button>;
  };
}
```

**Props:**

- `error: (error: unknown) => ChildNode | ChildNode[]` - Render function for error state
- `children` - Child components to protect

**Notes:**

- Catches errors during render phase
- Errors bubble up to nearest ErrorBoundary
- Can be nested for granular error handling

---

## Advanced Patterns

### Lists and Keys

Use keys to maintain component identity across re-renders:

```tsx
function TodoList() {
  const state = createState({
    todos: [
      { id: 1, text: "Learn RASK" },
      { id: 2, text: "Build app" },
    ],
  });

  return () => (
    <ul>
      {state.todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function TodoItem(props) {
  const state = createState({ editing: false });

  return () => (
    <li>
      {state.editing ? (
        <input value={props.todo.text} />
      ) : (
        <span onClick={() => (state.editing = true)}>{props.todo.text}</span>
      )}
    </li>
  );
}
```

Keys prevent component recreation when list order changes.

### Computed Values

You can create computed values in two ways:

**1. Simple computed functions** - For basic derived values:

```tsx
function ShoppingCart() {
  const state = createState({
    items: [
      { id: 1, price: 10, quantity: 2 },
      { id: 2, price: 20, quantity: 1 },
    ],
  });

  const total = () =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return () => (
    <div>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>
            ${item.price} x {item.quantity}
          </li>
        ))}
      </ul>
      <p>Total: ${total()}</p>
    </div>
  );
}
```

Computed functions automatically track dependencies when called during render.

**2. Using `createComputed`** - For cached, efficient computed values with automatic dependency tracking:

```tsx
function ShoppingCart() {
  const state = createState({
    items: [
      { id: 1, price: 10, quantity: 2 },
      { id: 2, price: 20, quantity: 1 },
    ],
    taxRate: 0.1,
  });

  const computed = createComputed({
    subtotal: () =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    tax: () => computed.subtotal * state.taxRate,
    total: () => computed.subtotal + computed.tax,
  });

  return () => (
    <div>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>
            ${item.price} x {item.quantity}
          </li>
        ))}
      </ul>
      <p>Subtotal: ${computed.subtotal}</p>
      <p>Tax: ${computed.tax}</p>
      <p>Total: ${computed.total}</p>
    </div>
  );
}
```

Benefits of `createComputed`:
- **Cached** - Only recalculates when dependencies change
- **Lazy** - Only calculates when accessed
- **Composable** - Computed properties can depend on other computed properties
- **Efficient** - Better performance for expensive calculations

### Composition

Compose complex logic by combining state and methods using `createView`:

```tsx
function createAuthStore() {
  const state = createState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = async (username, password) => {
    state.isLoading = true;
    try {
      const user = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }).then((r) => r.json());
      state.user = user;
      state.isAuthenticated = true;
    } finally {
      state.isLoading = false;
    }
  };

  const logout = () => {
    state.user = null;
    state.isAuthenticated = false;
  };

  return createView(state, { login, logout });
}

function App() {
  const auth = createAuthStore();

  return () => (
    <div>
      {auth.isAuthenticated ? (
        <div>
          <p>Welcome, {auth.user.name}!</p>
          <button onClick={auth.logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => auth.login("user", "pass")}>Login</button>
      )}
    </div>
  );
}
```

This pattern is great for organizing complex business logic while keeping both state and methods accessible through a single object.

### External State Management

Share state across components:

```tsx
// store.ts
export const store = createState({
  user: null,
  theme: "light",
});

// App.tsx
import { store } from "./store";

function Header() {
  return () => <div>Theme: {store.theme}</div>;
}

function Settings() {
  return () => (
    <button
      onClick={() => (store.theme = store.theme === "light" ? "dark" : "light")}
    >
      Toggle Theme
    </button>
  );
}
```

Any component accessing `store` will re-render when it changes.

### Conditional Rendering

```tsx
function Conditional() {
  const state = createState({ show: false });

  return () => (
    <div>
      <button onClick={() => (state.show = !state.show)}>Toggle</button>
      {state.show && <ExpensiveComponent />}
    </div>
  );
}
```

Components are only created when rendered, and automatically cleaned up when removed.

## TypeScript Support

RASK is written in TypeScript and provides full type inference:

```tsx
import { createState, Component } from "rask-ui";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
}

const TodoItem: Component<TodoItemProps> = (props) => {
  return () => (
    <li onClick={() => props.onToggle(props.todo.id)}>{props.todo.text}</li>
  );
};

function TodoList() {
  const state = createState<{ todos: Todo[] }>({
    todos: [],
  });

  const toggle = (id: number) => {
    const todo = state.todos.find((t) => t.id === id);
    if (todo) todo.done = !todo.done;
  };

  return () => (
    <ul>
      {state.todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={toggle} />
      ))}
    </ul>
  );
}
```

## Configuration

### JSX Setup

Configure TypeScript to use RASK's JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "rask-ui"
  }
}
```

## Performance

RASK is designed for performance:

- **Fine-grained reactivity**: Only components that access changed state re-render
- **No wasted renders**: Components skip re-render if reactive dependencies haven't changed
- **Efficient DOM updates**: Powered by Inferno's highly optimized virtual DOM reconciler
- **No reconciler overhead for state**: State changes are direct, no diffing required
- **Automatic cleanup**: Components and effects cleaned up automatically

## Comparison with Other Frameworks

| Feature           | React                     | Solid                    | RASK             |
| ----------------- | ------------------------- | ------------------------ | ---------------- |
| State management  | Complex (hooks, closures) | Simple (signals)         | Simple (proxies) |
| UI expression     | Excellent                 | Limited                  | Excellent        |
| Reactivity        | Coarse (component level)  | Fine-grained             | Fine-grained     |
| Reconciler        | Yes                       | Limited                  | Yes (Inferno)    |
| Syntax            | JSX                       | JSX + special components | JSX              |
| Compiler required | No                        | Yes                      | No               |
| Learning curve    | Steep                     | Moderate                 | Gentle           |
| Access pattern    | Direct                    | Function calls `count()` | Direct           |
| Mental model      | Complex                   | Simple (with rules)      | Simple           |

## Examples

Check out the demo app in `packages/demo` for more examples.

## Contributing

Contributions are welcome! This is an early-stage project.

## License

MIT

## Why "RASK"?

The name comes from Norwegian/Swedish meaning "fast" - which captures the essence of this library: fast to write, fast to understand, and fast to run.

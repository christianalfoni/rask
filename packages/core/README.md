# @superfine-components/core

A lightweight reactive component library built on [Superfine](https://github.com/jorgebucaran/superfine) with MobX-inspired reactivity.

## Component and Element Lifecycle

### Overview

Superfine Components uses a **host-based architecture** where each component creates a host DOM element (`<component>` tag with `display: contents`) and manages its own virtual DOM independently. Components track their direct children for efficient cleanup detection.

### Component Lifecycle Phases

#### 1. Component Creation

```tsx
function MyComponent(props) {
  // Setup Phase - runs ONCE per component instance
  const state = createState({ count: 0 });
  const ref = createRef();

  onMount(() => console.log('Mounted!'));
  onCleanup(() => console.log('Cleaning up!'));

  // Return render function
  return () => <div ref={ref}>{state.count}</div>;
}
```

**What happens:**
- `createComponentInstance()` creates a new component instance
- Component function executes (setup phase)
- `createState()` creates reactive state
- `onMount()` and `onCleanup()` register lifecycle callbacks
- Render function is stored on the instance
- Instance is wrapped with an observer for reactivity

#### 2. Initial Render

```
render(<MyComponent />, container)
  ↓
jsxToVNode() - Convert JSX to VNode
  ↓
renderComponent() - Create component instance
  ↓
observer(() => { /* render function */ })
  ↓
Initial render (hostElement = null)
  ↓
Store child VNodes for host element creation
  ↓
Create host <component> VNode with children
  ↓
patch() - Superfine creates DOM
  ↓
setupComponentInstances() - Walk VNode tree
  ↓
Set instance.hostElement from vnode.node
  ↓
Store instance on element.__componentInstance
  ↓
Find parent component via DOM traversal
  ↓
Add to parent.children Set
  ↓
Run onMount() callbacks
```

**Key steps:**
1. **JSX to VNode**: JSX is converted to Superfine VNodes
2. **Component Instance Creation**: Each component gets a unique instance
3. **Observer Setup**: Render function is wrapped to track state dependencies
4. **Initial Render**: Observer runs but hostElement is null, so child VNodes are stored
5. **Host Element Creation**: A `<component>` VNode is created with the children
6. **Superfine Patch**: Superfine creates actual DOM elements
7. **Instance Setup**: VNode tree is walked to set `hostElement` from `vnode.node`
8. **Parent-Child Tracking**: Each instance finds its parent and registers as a child
9. **Mount Callbacks**: `onMount()` callbacks run after DOM is ready

#### 3. State Changes and Re-renders

```
state.count++ (or props change)
  ↓
Observer notified (reactive dependency)
  ↓
observer() callback executes
  ↓
Check if hostElement.isConnected
  ↓
Render function executes
  ↓
jsxToVNode() - Convert new JSX to VNodes
  ↓
patch(hostElement, newVNode)
  ↓
setupComponentInstances() - Track new children
  ↓
applyRefs() - Update refs
  ↓
checkChildrenConnected() - Detect removed children
```

**Key steps:**
1. **State Change**: Setting a state property notifies observers
2. **Observer Execution**: The component's observer callback runs
3. **Connected Check**: First checks if component is still in DOM
4. **Re-render**: Render function executes, accessing state (tracks dependencies)
5. **JSX to VNode**: New JSX is converted to VNodes
6. **Patch**: Superfine updates the host element's children
7. **Setup New Children**: Any new child components are set up
8. **Apply Refs**: DOM refs are updated
9. **Check Children**: Direct children are checked for disconnection

#### 4. Component Cleanup

**Cleanup happens in two scenarios:**

##### A. Parent Re-renders and Removes Child

```
Parent re-renders
  ↓
patch(parentHost, newVNode)
  ↓
Superfine removes child <component> from DOM
  ↓
checkChildrenConnected(parent)
  ↓
Iterate parent.children Set
  ↓
Check child.hostElement.isConnected
  ↓
If disconnected:
  ↓
parent.children.delete(child)
  ↓
cleanupComponentTree(child)
  ↓
Recursively cleanup child.children
  ↓
Run child.cleanupCallbacks
  ↓
Call child.dispose() (stops observer)
```

##### B. Component's Own Observer Detects Disconnection

```
State change triggers observer
  ↓
Check hostElement.isConnected
  ↓
If disconnected:
  ↓
Run cleanupCallbacks
  ↓
Call dispose() (stops observer)
```

**Key steps:**
1. **Detection**: Parent checks children after re-render, or component checks itself
2. **Parent Removal**: Child is removed from parent's children Set
3. **Recursive Cleanup**: `cleanupComponentTree()` walks entire subtree
4. **Callbacks**: `onCleanup()` callbacks execute (clear timers, subscriptions, etc.)
5. **Observer Disposal**: Observer is disposed to stop reactivity

### Element Lifecycle (Regular DOM Elements)

Regular DOM elements (div, span, etc.) follow Superfine's patching lifecycle:

```
JSX: <div ref={ref}>Hello</div>
  ↓
jsxToVNode() creates VNode
  ↓
patch() creates or updates DOM
  ↓
vnode.node contains DOM element
  ↓
applyRefs() assigns to ref.current
```

**Key points:**
- Regular elements don't create component instances
- They're managed entirely by Superfine's patch algorithm
- Refs are applied after patching
- No special cleanup needed (browser handles DOM removal)

### Cleanup Optimization

The cleanup system is optimized to avoid unnecessary checks:

```
Component A re-renders
  ↓
checkChildrenConnected(A)
  ↓
Only checks A's DIRECT children (shallow)
  ↓
If child B is disconnected:
  ↓
cleanupComponentTree(B)
  ↓
Recursively cleans B's entire subtree
```

**Why this is efficient:**
- Only checks direct children when parent re-renders
- No traversal of connected subtrees
- Disconnected subtrees are cleaned recursively
- Uses native `isConnected` property (no DOM observation)

### Parent-Child Relationship Tracking

```
setupComponentInstances(vnode)
  ↓
instance.hostElement = vnode.node
  ↓
Walk up DOM tree:
  let parent = element.parentElement
  while (parent) {
    if (parent.__componentInstance) {
      parent.children.add(instance)
      break
    }
    parent = parent.parentElement
  }
```

**Key points:**
- Relationships established via DOM tree traversal
- Uses `__componentInstance` property on DOM elements
- Stored in parent's `children` Set
- Enables efficient cleanup checking

### Complete Lifecycle Example

```tsx
function Counter() {
  // SETUP PHASE (once)
  const state = createState({ count: 0 });

  onMount(() => {
    console.log('Counter mounted');
  });

  onCleanup(() => {
    console.log('Counter cleaning up');
  });

  // RENDER PHASE (every update)
  return () => (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>+</button>
    </div>
  );
}

// Mount
render(<Counter />, document.getElementById('app'));
// Logs: "Counter mounted"

// User clicks button
// → state.count++ triggers observer
// → Render function executes
// → DOM updates via patch()
// → No children removed, no cleanup

// Component removed (parent re-renders without it)
// → Parent's checkChildrenConnected() runs
// → Detects Counter is disconnected
// → Runs cleanupComponentTree()
// → Logs: "Counter cleaning up"
// → Observer disposed
```

## Key Architectural Decisions

### 1. Host-Based Architecture
- Each component has a host `<component>` element (display: contents)
- Components render independently to their own host
- No parent-child instance relationships for rendering
- Isolation enables fine-grained updates

### 2. Component Tree for Cleanup
- Parents track direct children in a Set
- Only check children when parent re-renders
- Recursive cleanup for disconnected subtrees
- Efficient with native `isConnected` property

### 3. Observer Pattern for Reactivity
- Render functions wrapped with observer
- Automatically tracks state/props access
- Re-renders only when observed properties change
- No manual subscriptions needed

### 4. DOM-Based Traversal
- Context and Suspense find boundaries via DOM tree
- Uses `__componentInstance` property on elements
- Decoupled from component instance relationships
- Works naturally with host element architecture

### 5. Immediate Cleanup
- Children checked immediately after parent re-renders
- No deferred cleanup or garbage collection needed
- Cleanup callbacks run synchronously
- Predictable lifecycle behavior

### 6. Component Keys and Instance Caching

Components are cached by parent to preserve identity across re-renders:

```tsx
function TodoList() {
  const state = createState({
    todos: [{ id: 1, text: "Learn keys" }, { id: 2, text: "Build app" }]
  });

  return () => (
    <ul>
      {state.todos.map(todo => (
        <TodoItem key={todo.id} {...todo} />
      ))}
    </ul>
  );
}
```

**How it works:**
- **Cache Key Format**:
  - With explicit `key` prop: `key:${componentFnId}:${keyValue}` (e.g., `key:2:1`)
  - Without key (positional): `pos:${componentFnId}:${position}` (e.g., `pos:2:0`)
- **Composite Keys**: vnodes use `${componentFnId}:${keyValue}` for Superfine reconciliation
- **Instance Reuse**: When parent re-renders, children are looked up in cache and reused
- **Props Update**: Cached instances get updated props (triggers observer if changed)

**Benefits:**
- Component instances persist across parent re-renders
- State preserved when list order changes (with proper keys)
- Avoids recreation of component instances
- Prevents collision between different component types with same key

### 7. VNode Caching and Superfine Short-Circuiting

The framework optimizes rendering by caching vnodes at component boundaries:

```tsx
// In renderComponent():
if (instance.dispose && instance.cachedVNode) {
  // Return cached vnode - Superfine skips entire subtree!
  return instance.cachedVNode;
}
```

**How it works:**

1. **Component First Render**:
   - Observer creates vnode for host element with children
   - Vnode cached: `instance.cachedVNode = newHostVNode`

2. **Parent Re-renders**:
   - Calls `renderComponent()` for each child
   - Finds cached instance, updates props
   - Returns `instance.cachedVNode` to parent

3. **Superfine Optimization**:
   - Superfine checks: `if (oldVNode === newVNode) { /* skip */ }`
   - Same vnode reference → entire subtree skipped!
   - Massive performance win for unchanged components

4. **Async Child Update**:
   - Props update schedules observer in microtask
   - If props changed, observer runs and patches host element directly
   - Creates new cached vnode for next parent render

**Rendering Flow:**
```
Parent renders
  ├─> renderComponent(Child1)
  │     ├─> Find cached instance ✓
  │     ├─> Update props → schedules observer
  │     └─> Return cachedVNode → Superfine skips subtree
  │
  ├─> renderComponent(Child2)
  │     ├─> Find cached instance ✓
  │     ├─> Update props → schedules observer
  │     └─> Return cachedVNode → Superfine skips subtree
  │
  └─> Parent patch completes (synchronous)
        │
        └─> Microtask queue runs (async):
              ├─> Child1 observer patches host element
              └─> Child2 observer patches host element
```

**Benefits:**
- Parent re-renders don't cascade synchronously to children
- Leverages Superfine's built-in referential equality check
- Child updates happen asynchronously in microtasks
- Massive performance improvement for large component trees
- Each component independently manages its own rendering

**Key Insight:**
The cached vnode includes the composite key (e.g., `key: "2:1"`), allowing Superfine to properly reconcile components by key when list order changes. This combines:
- Component instance caching (for identity preservation)
- VNode caching (for Superfine optimization)
- Composite keys (for collision prevention and reconciliation)

## API Reference

See main repository documentation for full API details:
- `createState(initialState)` - Create reactive state
- `createRef()` - Create DOM element ref
- `onMount(callback)` - Register mount callback
- `onCleanup(callback)` - Register cleanup callback
- `render(jsx, container)` - Mount component to DOM

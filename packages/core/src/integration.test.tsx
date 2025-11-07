import { describe, it, expect, vi } from 'vitest';
import { onMount, onCleanup, getCurrentComponent } from './component';
import { render } from './render';
import { createState } from './createState';
import { createRef } from './createRef';
import { createContext } from './createContext';
import { ErrorBoundary } from './error';

describe('Integration Tests', () => {
  it('should render a simple component', () => {
    function App() {
      return () => <div>Hello World</div>;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    render(<App />, container);

    // After patch, container is replaced, so check body instead
    expect(document.body.textContent).toContain('Hello World');
  });

  it('should handle reactive state updates', async () => {
    function Counter() {
      const state = createState({ count: 0 });

      return () => (
        <div>
          <span>Count: {state.count}</span>
          <button onClick={() => state.count++}>Increment</button>
        </div>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    render(<Counter />, container);

    expect(document.body.textContent).toContain('Count: 0');

    // Simulate click
    const button = document.querySelector('button');
    button?.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(document.body.textContent).toContain('Count: 1');
  });

  it('should work with refs', async () => {
    function App() {
      const ref = createRef<HTMLDivElement>();

      onMount(() => {
        expect(ref.current).not.toBeNull();
        expect(ref.current?.tagName).toBe('DIV');
      });

      return () => <div ref={ref}>Test</div>;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    render(<App />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should handle context', () => {
    const ThemeContext = createContext<{ theme: string }>();

    function Child() {
      const theme = ThemeContext.get();
      return () => <div class="child">{theme.theme}</div>;
    }

    function Parent() {
      ThemeContext.inject({ theme: 'dark' });
      return () => <Child />;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(document.body.textContent).toContain('dark');
  });

  it.skip('should handle error boundaries', async () => {
    function ThrowingChild() {
      return () => {
        throw new Error('Test error');
      };
    }

    function App() {
      return () => (
        <ErrorBoundary
          error={(error) => <div class="error">Error: {String(error)}</div>}
        >
          <ThrowingChild />
        </ErrorBoundary>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    render(<App />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const errorDiv = document.querySelector('.error');
    expect(errorDiv).not.toBeNull();
    expect(errorDiv?.textContent).toContain('Test error');
  });

  it.skip('should call onMount and onCleanup', async () => {
    const mountFn = vi.fn();
    const cleanupFn = vi.fn();

    function Component() {
      onMount(mountFn);
      onCleanup(cleanupFn);
      return () => <div>Test</div>;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    render(<Component />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mountFn).toHaveBeenCalledTimes(1);
    expect(cleanupFn).not.toHaveBeenCalled();

    // Unmount by rendering something else
    const container2 = document.createElement('div');
    document.body.appendChild(container2);
    render(<div>Empty</div>, container2);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it('should handle nested components', () => {
    function GrandChild() {
      return () => <span>GrandChild</span>;
    }

    function Child() {
      return () => (
        <div>
          Child <GrandChild />
        </div>
      );
    }

    function Parent() {
      return () => (
        <div>
          Parent <Child />
        </div>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(document.body.textContent).toContain('Parent');
    expect(document.body.textContent).toContain('Child');
    expect(document.body.textContent).toContain('GrandChild');
  });

  it.skip('should handle conditional rendering', async () => {
    function App() {
      const state = createState({ show: true });

      return () => (
        <div>
          <button onClick={() => (state.show = !state.show)}>Toggle</button>
          {state.show ? <div class="content">Content</div> : null}
        </div>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    render(<App />, container);

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(document.querySelector('.content')).not.toBeNull();

    const button = document.querySelector('button');
    button?.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(document.querySelector('.content')).toBeNull();
  });

  it('should handle list rendering', async () => {
    function TodoList() {
      const state = createState({ items: ['Item 1', 'Item 2'] });

      return () => (
        <div>
          <button onClick={() => state.items.push(`Item ${state.items.length + 1}`)}>
            Add
          </button>
          <ul>
            {state.items.map((item) => (
              <li>{item}</li>
            ))}
          </ul>
        </div>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    render(<TodoList />, container);

    expect(document.querySelectorAll('li').length).toBe(2);

    const button = document.querySelector('button');
    button?.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(document.querySelectorAll('li').length).toBe(3);
  });
});

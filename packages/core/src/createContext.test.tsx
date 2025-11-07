import { describe, it, expect } from 'vitest';
import { createContext } from './createContext';
import { render } from './render';

describe('createContext', () => {
  it('should create a context object', () => {
    const context = createContext<{ value: string }>();
    expect(context).toHaveProperty('inject');
    expect(context).toHaveProperty('get');
  });

  it('should allow setting and getting context values', () => {
    const ThemeContext = createContext<{ theme: string }>();

    function Parent() {
      ThemeContext.inject({ theme: 'dark' });
      return () => <Child />;
    }

    function Child() {
      const theme = ThemeContext.get();
      return () => <div>{theme.theme}</div>;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const vnode = render(<Parent />, container);

    expect((vnode.elm as HTMLElement).textContent).toContain('dark');

    document.body.removeChild(vnode.elm as HTMLElement);
  });

  it('should traverse parent components to find context', () => {
    const ThemeContext = createContext<{ theme: string }>();

    function GrandParent() {
      ThemeContext.inject({ theme: 'light' });
      return () => <Parent />;
    }

    function Parent() {
      return () => <Child />;
    }

    function Child() {
      const theme = ThemeContext.get();
      return () => <div>{theme.theme}</div>;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const vnode = render(<GrandParent />, container);

    expect((vnode.elm as HTMLElement).textContent).toContain('light');

    document.body.removeChild(vnode.elm as HTMLElement);
  });

  it('should throw error when context is not found', () => {
    const ThemeContext = createContext<{ theme: string }>();

    function Child() {
      expect(() => {
        ThemeContext.get();
      }).toThrow('Could not find context in parent components');
      return () => <div>Child</div>;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const vnode = render(<Child />, container);

    document.body.removeChild(vnode.elm as HTMLElement);
  });

  it('should throw error when setting context outside component', () => {
    const ThemeContext = createContext<{ theme: string }>();

    expect(() => {
      ThemeContext.inject({ theme: 'dark' });
    }).toThrow('You can not inject context outside component setup');
  });

  it('should throw error when getting context outside component', () => {
    const ThemeContext = createContext<{ theme: string }>();

    expect(() => {
      ThemeContext.get();
    }).toThrow('You can not get context outside component setup');
  });

  it('should allow overriding context in nested components', () => {
    const ThemeContext = createContext<{ theme: string }>();

    function GrandParent() {
      ThemeContext.inject({ theme: 'light' });
      return () => (
        <div>
          <Parent />
          <ChildOfGrandParent />
        </div>
      );
    }

    function Parent() {
      ThemeContext.inject({ theme: 'dark' });
      return () => <ChildOfParent />;
    }

    function ChildOfParent() {
      const theme = ThemeContext.get();
      return () => <div class="child-of-parent">{theme.theme}</div>;
    }

    function ChildOfGrandParent() {
      const theme = ThemeContext.get();
      return () => <div class="child-of-grandparent">{theme.theme}</div>;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const vnode = render(<GrandParent />, container);

    const childOfParent = document.querySelector('.child-of-parent');
    const childOfGrandParent = document.querySelector('.child-of-grandparent');

    expect(childOfParent?.textContent).toBe('dark');
    expect(childOfGrandParent?.textContent).toBe('light');

    document.body.removeChild(vnode.elm as HTMLElement);
  });

  it('should support multiple different contexts', () => {
    const ThemeContext = createContext<{ theme: string }>();
    const UserContext = createContext<{ name: string }>();

    function Parent() {
      ThemeContext.inject({ theme: 'dark' });
      UserContext.inject({ name: 'Alice' });
      return () => <Child />;
    }

    function Child() {
      const theme = ThemeContext.get();
      const user = UserContext.get();
      return () => (
        <div>
          {theme.theme} - {user.name}
        </div>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const vnode = render(<Parent />, container);

    expect((vnode.elm as HTMLElement).textContent).toContain('dark - Alice');

    document.body.removeChild(vnode.elm as HTMLElement);
  });

  it('should handle context values of different types', () => {
    const NumberContext = createContext<number>();
    const ArrayContext = createContext<string[]>();

    function Parent() {
      NumberContext.inject(42);
      ArrayContext.inject(['a', 'b', 'c']);
      return () => <Child />;
    }

    function Child() {
      const num = NumberContext.get();
      const arr = ArrayContext.get();
      return () => (
        <div>
          {num} - {arr.join(',')}
        </div>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const vnode = render(<Parent />, container);

    expect((vnode.elm as HTMLElement).textContent).toContain('42 - a,b,c');

    document.body.removeChild(vnode.elm as HTMLElement);
  });
});

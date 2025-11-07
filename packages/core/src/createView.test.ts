import { describe, it, expect } from 'vitest';
import { createView } from './createView';
import { createState } from './createState';
import { Observer } from './observation';

describe('createView', () => {
  it('should merge two plain objects', () => {
    const a = { x: 1, y: 2 };
    const b = { z: 3 };
    const view = createView(a, b);

    expect(view.x).toBe(1);
    expect(view.y).toBe(2);
    expect(view.z).toBe(3);
  });

  it('should allow later arguments to override earlier ones', () => {
    const a = { x: 1, y: 2 };
    const b = { y: 3, z: 4 };
    const view = createView(a, b);

    expect(view.x).toBe(1);
    expect(view.y).toBe(3); // b.y overrides a.y
    expect(view.z).toBe(4);
  });

  it('should maintain reactivity with reactive objects', async () => {
    const state = createState({ count: 0 });
    const view = createView(state);

    let renderCount = 0;
    let lastValue = 0;

    const observer = new Observer(() => {
      renderCount++;
    });

    const dispose = observer.observe();
    lastValue = view.count; // Track the property
    dispose();

    expect(renderCount).toBe(0);

    state.count = 5;

    // Wait for microtask to process notification
    await new Promise((resolve) => {
      queueMicrotask(() => {
        expect(renderCount).toBe(1);
        lastValue = view.count;
        expect(lastValue).toBe(5);
        resolve(undefined);
      });
    });
  });

  it('should merge reactive and plain objects while maintaining reactivity', () => {
    const state = createState({ count: 0 });
    const helpers = {
      increment() {
        state.count++;
      },
      decrement() {
        state.count--;
      },
    };
    const view = createView(state, helpers);

    expect(view.count).toBe(0);
    expect(typeof view.increment).toBe('function');
    expect(typeof view.decrement).toBe('function');

    view.increment();
    expect(view.count).toBe(1);

    view.decrement();
    expect(view.count).toBe(0);
  });

  it('should merge multiple reactive objects', () => {
    const state1 = createState({ count: 0 });
    const state2 = createState({ name: 'Alice' });
    const state3 = createState({ age: 25 });
    const view = createView(state1, state2, state3);

    expect(view.count).toBe(0);
    expect(view.name).toBe('Alice');
    expect(view.age).toBe(25);

    state1.count = 10;
    state2.name = 'Bob';
    state3.age = 30;

    expect(view.count).toBe(10);
    expect(view.name).toBe('Bob');
    expect(view.age).toBe(30);
  });

  it('should reflect changes in source objects', () => {
    const source = { x: 1 };
    const view = createView(source);

    expect(view.x).toBe(1);

    source.x = 2;
    expect(view.x).toBe(2);
  });

  it('should handle property override order correctly', () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { y: 20 };
    const c = { z: 30 };
    const view = createView(a, b, c);

    expect(view.x).toBe(1);  // From a
    expect(view.y).toBe(20); // From b (overrides a)
    expect(view.z).toBe(30); // From c (overrides a)
  });

  it('should only include enumerable properties', () => {
    const obj = { x: 1 };
    Object.defineProperty(obj, 'hidden', {
      value: 42,
      enumerable: false,
    });

    const view = createView(obj);

    expect(view.x).toBe(1);
    expect((view as any).hidden).toBeUndefined();
  });

  it('should handle symbol keys', () => {
    const sym = Symbol('test');
    const obj = { x: 1, [sym]: 'symbol value' };
    const view = createView(obj);

    expect(view.x).toBe(1);
    expect((view as any)[sym]).toBe('symbol value');
  });

  it('should track dependencies for each property independently', async () => {
    const state = createState({ count: 0, name: 'Alice' });
    const view = createView(state);

    let countRenderCount = 0;
    let nameRenderCount = 0;

    // Observer that only accesses count
    const countObserver = new Observer(() => {
      countRenderCount++;
    });

    const dispose1 = countObserver.observe();
    view.count; // Track count
    dispose1();

    expect(countRenderCount).toBe(0);

    // Change count - should trigger
    state.count = 1;

    await new Promise((resolve) => {
      queueMicrotask(() => {
        expect(countRenderCount).toBe(1);
        resolve(undefined);
      });
    });

    // Change name - should NOT trigger (not tracked)
    state.name = 'Bob';

    await new Promise((resolve) => {
      queueMicrotask(() => {
        expect(countRenderCount).toBe(1); // Still 1
        resolve(undefined);
      });
    });

    // Now track name with a different observer
    const nameObserver = new Observer(() => {
      nameRenderCount++;
    });

    const dispose2 = nameObserver.observe();
    view.name; // Track name
    dispose2();

    expect(nameRenderCount).toBe(0);

    // Change name - should trigger name observer
    state.name = 'Charlie';

    await new Promise((resolve) => {
      queueMicrotask(() => {
        expect(nameRenderCount).toBe(1);
        resolve(undefined);
      });
    });
  });

  it('should return the same value type as source', () => {
    const obj = { nums: [1, 2, 3], nested: { x: 1 } };
    const view = createView(obj);

    expect(Array.isArray(view.nums)).toBe(true);
    expect(view.nums).toEqual([1, 2, 3]);
    expect(typeof view.nested).toBe('object');
    expect(view.nested.x).toBe(1);
  });

  it('should handle empty merge', () => {
    const view = createView({});
    expect(Object.keys(view).length).toBe(0);
  });

  it('should merge single object', () => {
    const obj = { x: 1, y: 2 };
    const view = createView(obj);

    expect(view.x).toBe(1);
    expect(view.y).toBe(2);
  });

  it('should maintain function context', () => {
    const state = createState({ count: 0 });
    const methods = {
      increment() {
        state.count++;
      },
    };
    const view = createView(state, methods);

    expect(view.count).toBe(0);
    view.increment();
    expect(view.count).toBe(1);
    expect(state.count).toBe(1);
  });

  it('should work with reactive state and computed-like patterns', () => {
    const state = createState({ firstName: 'John', lastName: 'Doe' });
    const computed = {
      get fullName() {
        return `${state.firstName} ${state.lastName}`;
      },
    };
    const view = createView(state, computed);

    expect(view.firstName).toBe('John');
    expect(view.lastName).toBe('Doe');
    expect(view.fullName).toBe('John Doe');

    state.firstName = 'Jane';
    expect(view.fullName).toBe('Jane Doe');
  });
});

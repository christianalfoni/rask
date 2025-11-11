import { describe, it, expect, vi } from "vitest";
import { Signal, Observer, getCurrentObserver } from "../observation";

describe("Signal", () => {
  it("should allow subscribing to notifications", async () => {
    const signal = new Signal();
    const callback = vi.fn();

    signal.subscribe(callback);
    signal.notify();

    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should return a disposer function", async () => {
    const signal = new Signal();
    const callback = vi.fn();

    const dispose = signal.subscribe(callback);
    dispose();

    signal.notify();
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    expect(callback).not.toHaveBeenCalled();
  });

  it("should handle multiple subscribers", async () => {
    const signal = new Signal();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    signal.subscribe(callback1);
    signal.subscribe(callback2);

    signal.notify();

    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it("should allow unsubscribing individual callbacks", async () => {
    const signal = new Signal();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const dispose1 = signal.subscribe(callback1);
    signal.subscribe(callback2);

    dispose1();
    signal.notify();

    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});

describe("Observer", () => {
  it("should track signals during observation", () => {
    const callback = vi.fn();
    const observer = new Observer(callback);
    const signal = new Signal();

    const dispose = observer.observe();
    observer.subscribeSignal(signal);
    dispose();

    signal.notify();

    return new Promise((resolve) => {
      queueMicrotask(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        resolve(undefined);
      });
    });
  });

  it("should clear signals when observing again", async () => {
    let callCount = 0;
    const observer = new Observer(() => {
      callCount++;
    });

    const signal1 = new Signal();
    const signal2 = new Signal();

    // First observation
    let dispose = observer.observe();
    observer.subscribeSignal(signal1);
    dispose();

    // Second observation - should clear previous signals
    dispose = observer.observe();
    observer.subscribeSignal(signal2);
    dispose();

    // Notify first signal - should not trigger observer
    signal1.notify();

    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    expect(callCount).toBe(0);

    // Notify second signal - should trigger observer
    signal2.notify();

    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    expect(callCount).toBe(1);
  });

  it("should dispose of all signal subscriptions", async () => {
    const callback = vi.fn();
    const observer = new Observer(callback);
    const signal = new Signal();

    const dispose = observer.observe();
    observer.subscribeSignal(signal);
    dispose();

    observer.dispose();

    signal.notify();

    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    expect(callback).not.toHaveBeenCalled();
  });

  it("should set current observer during observation", () => {
    const observer = new Observer(() => {});

    expect(getCurrentObserver()).toBeUndefined();

    const dispose = observer.observe();
    expect(getCurrentObserver()).toBe(observer);

    dispose();
    expect(getCurrentObserver()).toBeUndefined();
  });

  it("should handle nested observations with stack", () => {
    const observer1 = new Observer(() => {});
    const observer2 = new Observer(() => {});

    const dispose1 = observer1.observe();
    expect(getCurrentObserver()).toBe(observer1);

    const dispose2 = observer2.observe();
    expect(getCurrentObserver()).toBe(observer2);

    dispose2();
    expect(getCurrentObserver()).toBe(observer1);

    dispose1();
    expect(getCurrentObserver()).toBeUndefined();
  });
});

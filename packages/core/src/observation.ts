const observerStack: Observer[] = [];

export function getCurrentObserver() {
  return observerStack[0];
}

export class Signal {
  private subscribers = new Set<() => void>();
  subscribe(cb: () => void) {
    this.subscribers.add(cb);

    return () => {
      this.subscribers.delete(cb);
    };
  }
  notify() {
    this.subscribers.forEach((cb) => cb());
  }
}

let pendingObservations: Array<() => void> = [];

function queueObservation(cb: () => void) {
  pendingObservations.push(cb);

  if (pendingObservations.length > 1) {
    return;
  }
  queueMicrotask(() => {
    const current = pendingObservations;
    pendingObservations = [];
    current.forEach((cb) => cb());
  });
}

export class Observer {
  private signalDisposers = new Set<() => void>();
  private clearSignals() {
    this.signalDisposers.forEach((dispose) => dispose());
    this.signalDisposers.clear();
  }
  private onSignal: () => void;
  constructor(onSignal: () => void) {
    this.onSignal = () => queueObservation(onSignal);
  }
  subscribeSignal(signal: Signal) {
    this.signalDisposers.add(signal.subscribe(this.onSignal));
  }
  observe() {
    this.clearSignals();
    observerStack.unshift(this);
    return () => {
      observerStack.shift();
    };
  }
  dispose() {
    this.clearSignals();
  }
}

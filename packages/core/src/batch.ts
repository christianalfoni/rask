const INTERACTIVE_EVENTS = [
  // DISCRETE
  "beforeinput",
  "input",
  "change",
  "compositionend",
  "keydown",
  "keyup",
  "click",
  "contextmenu",
  "submit",
  "reset",

  // GESTURE START
  "pointerdown",
  "mousedown",
  "touchstart",

  // GESTURE END
  "pointerup",
  "mouseup",
  "touchend",
  "touchcancel",
];

let inInteractive = 0;
let hasAsyncQueue = false;
let hasSyncQueue = false;
const flushQueue = new Set<() => void>();
const syncFlushQueue = new Set<() => void>();

function queueAsync() {
  if (hasAsyncQueue) {
    return;
  }

  hasAsyncQueue = true;
  queueMicrotask(() => {
    hasAsyncQueue = false;

    if (!flushQueue.size) {
      return;
    }

    const queued = Array.from(flushQueue);

    flushQueue.clear();
    queued.forEach((cb) => cb());
  });
}

export function queue(cb: () => void) {
  if (hasSyncQueue) {
    syncFlushQueue.add(cb);
    return;
  }

  flushQueue.add(cb);

  if (!inInteractive) {
    queueAsync();
  }
}

export function syncBatch(cb: () => void) {
  hasSyncQueue = true;
  cb();
  hasSyncQueue = false;
  const queued = Array.from(syncFlushQueue);
  syncFlushQueue.clear();
  queued.forEach((cb) => cb());
}

export function installEventBatching(target: EventTarget = document) {
  const captureOptions = { capture: true, passive: true };
  const bubbleOptions = { passive: true };
  const onCapture = () => {
    inInteractive++;
    // Backup in case of stop propagation
    queueAsync();
  };
  const onBubble = () => {
    if (--inInteractive === 0 && flushQueue.size) {
      const queued = Array.from(flushQueue);
      flushQueue.clear();
      queued.forEach((cb) => cb());
    }
  };
  // 1) open scope before handlers
  INTERACTIVE_EVENTS.forEach((type) => {
    target.addEventListener(type, onCapture, captureOptions);
  });

  queueMicrotask(() => {
    // 2) close + flush after handlers (bubble on window/document)
    INTERACTIVE_EVENTS.forEach((type) => {
      target.addEventListener(type, onBubble, bubbleOptions);
    });
  });
}

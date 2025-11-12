import { getCurrentComponent, onCleanup } from "./component";
import { Observer } from "./observation";

export function createEffect(cb: () => void) {
  const currentComponent = getCurrentComponent();
  const observer = new Observer(() => {
    // We trigger effects on micro task as synchronous observer notifications
    // (Like when components sets props) should not synchronously trigger effects
    queueMicrotask(runEffect);
  });
  const runEffect = () => {
    const stopObserving = observer.observe();
    cb();

    stopObserving();
  };

  if (currentComponent) {
    onCleanup(() => observer.dispose());
  }

  runEffect();
}

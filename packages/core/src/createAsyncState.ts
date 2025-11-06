import { createState } from "./createState";

type AsyncState<T> =
  | {
      isPending: true;
      value: null;
      error: null;
    }
  | {
      isPending: false;
      value: T;
      error: null;
    }
  | {
      isPending: false;
      value: null;
      error: string;
    };

export function createAsyncState<T>(promise: Promise<T>) {
  const state = createState<AsyncState<T>>({
    isPending: true,
    error: null,
    value: null,
  });

  promise
    .then((value) => {
      Object.assign(state, {
        value,
        error: null,
        isPending: false,
      });
    })
    .catch((error) => {
      Object.assign(state, {
        value: null,
        error: String(error),
        isPending: false,
      });
    });

  return state;
}

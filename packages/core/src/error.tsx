import { Component, VNode } from "inferno";

export class ErrorBoundary extends Component<
  { children: any; error: (error: unknown) => VNode },
  { error: unknown }
> {
  getChildContext() {
    return {
      notifyError: (error: unknown) => {
        this.setState({ error });
      },
    };
  }
  state = { error: null };

  render() {
    if (this.state.error) {
      return this.props.error(this.state.error);
    }

    return this.props.children;
  }
}

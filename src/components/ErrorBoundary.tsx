import { Component, type ReactNode, type ErrorInfo } from 'react';

// App-wide error boundary (audit P7 + F51). A render/runtime error anywhere in the tree
// used to white-screen the whole app with nothing shown and nothing recorded. This
// catches it, shows an on-brand recovery screen, and logs one structured line to the
// console (visible in the browser + any client log drain). Reload re-mounts fresh.
type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Structured, greppable — mirrors the server captureError shape.
    console.error(JSON.stringify({
      level: 'error',
      scope: 'client',
      ts: new Date().toISOString(),
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 6).join('\n'),
      componentStack: info.componentStack?.split('\n').slice(0, 6).join('\n'),
    }));
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 text-center">
        <div className="w-full max-w-sm">
          <span className="text-brand-700 font-bold text-xl tracking-tight">Affina<span className="text-ink">Space</span></span>
          <div className="mt-8 text-4xl">🌀</div>
          <h1 className="mt-4 text-2xl font-extrabold text-ink mb-2">Something glitched</h1>
          <p className="text-sm text-ink-soft mb-6">A part of the app hit an unexpected error — your work is safe. Reload to pick up where you left off.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-8 py-3 rounded-pill transition"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

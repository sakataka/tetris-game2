import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Component error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-200">
            <h3 className="font-semibold mb-2">Component Error</h3>
            <p className="text-sm text-red-300">
              Something went wrong: {this.state.error?.message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

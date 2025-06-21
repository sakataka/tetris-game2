import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { extractErrorInfo, GameStateError, isGameError } from "../types/errors";
import { createErrorHandler, logError } from "../utils/errorHandling";

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  resetKeys?: Array<string | number>;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * React Error Boundary component for handling game errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private maxRetries = 3;
  private retryDelay = 2000;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;

    // Update state with error info
    this.setState({ errorInfo });

    // Log the error using our error handling system
    if (isGameError(error)) {
      logError(error);
    } else {
      // Convert non-game errors to GameStateError
      const gameError = new GameStateError(
        "GAME_001",
        `Component error: ${error.message}`,
        {
          originalError: error,
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
        true,
      );
      logError(gameError);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Enhanced error reporting for development
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Error Boundary Caught Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      if (isGameError(error)) {
        console.table(extractErrorInfo(error));
      }
      console.groupEnd();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (
      hasError &&
      resetKeys &&
      prevProps.resetKeys &&
      resetKeys.some((key, index) => key !== prevProps.resetKeys![index])
    ) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  /**
   * Resets the error boundary state
   */
  resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  /**
   * Handles retry attempts with exponential backoff
   */
  handleRetry = (): void => {
    const { enableRecovery = true } = this.props;
    const { retryCount } = this.state;

    if (!enableRecovery || retryCount >= this.maxRetries) {
      return;
    }

    // Increment retry count
    this.setState({ retryCount: retryCount + 1 });

    // Delay before retry with exponential backoff
    const delay = this.retryDelay * 2 ** retryCount;

    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, delay);
  };

  /**
   * Default fallback UI
   */
  renderDefaultFallback(): ReactNode {
    const { error, retryCount, errorId } = this.state;
    const { enableRecovery = true } = this.props;
    const canRetry = enableRecovery && retryCount < this.maxRetries;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900 p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-2xl font-bold text-white mb-4">ゲームエラーが発生しました</h1>
          <p className="text-white/80 mb-6">
            申し訳ございません。予期しないエラーが発生しました。
            {canRetry && "自動的に復旧を試みています..."}
          </p>

          {error && (
            <details className="text-left mb-6">
              <summary className="text-white/60 cursor-pointer mb-2">エラー詳細</summary>
              <div className="bg-black/20 rounded p-3 text-sm font-mono text-white/80">
                <p>
                  <strong>Type:</strong> {error.name}
                </p>
                <p>
                  <strong>Message:</strong> {error.message}
                </p>
                {errorId && (
                  <p>
                    <strong>ID:</strong> {errorId}
                  </p>
                )}
                {retryCount > 0 && (
                  <p>
                    <strong>Retry:</strong> {retryCount}/{this.maxRetries}
                  </p>
                )}
              </div>
            </details>
          )}

          <div className="space-y-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                今すぐ再試行
              </button>
            )}

            <button
              onClick={this.resetErrorBoundary}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              ゲームを再開
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              ページを再読み込み
            </button>
          </div>

          <p className="text-white/50 text-xs mt-6">
            問題が続く場合は、ブラウザのキャッシュをクリアしてください。
          </p>
        </div>
      </div>
    );
  }

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(this.state.error!, this.resetErrorBoundary);
      }

      // Use default fallback
      return this.renderDefaultFallback();
    }

    return children;
  }
}

/**
 * Higher-order component for automatic error boundary wrapping
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...(props as P)} ref={ref} />
      </ErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

/**
 * Custom hook for safe async operations in components
 */
export function useSafeAsync() {
  const { captureError } = useErrorHandler();

  async function safeAsync<T>(asyncFn: () => Promise<T>): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  return safeAsync;
}

/**
 * Game-specific error boundary with recovery
 */
export function GameErrorBoundary({ children }: { children: ReactNode }) {
  const handleGameError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    // Game-specific error handling
    const gameErrorHandler = createErrorHandler("GameErrorBoundary");
    gameErrorHandler(error, errorInfo);

    // Additional game-specific logic can be added here
    // For example, saving game state before crash, analytics, etc.
  }, []);

  return (
    <ErrorBoundary
      onError={handleGameError}
      enableRecovery={true}
      resetKeys={[]} // Can be used to reset when game state changes
    >
      {children}
    </ErrorBoundary>
  );
}

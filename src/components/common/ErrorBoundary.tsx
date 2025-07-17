import { type ReactNode, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

/**
 * Functional ErrorBoundary component using React hooks
 * Note: This is a simplified implementation. For production use,
 * consider using react-error-boundary library or similar solutions.
 */
export function ErrorBoundary({ children, fallback, onError }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    // Global error handler for unhandled errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      console.error("[ErrorBoundary] Unhandled error:", error);
      setHasError(true);
      setError(error);
      onError?.(error, { componentStack: event.filename });
    };

    // Global promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      console.error("[ErrorBoundary] Unhandled promise rejection:", error);
      setHasError(true);
      setError(error);
      onError?.(error, { componentStack: "Promise rejection" });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [onError]);

  const handleRetry = () => {
    setHasError(false);
    setError(undefined);
  };

  if (hasError) {
    return (
      fallback || (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-200">
          <h2 className="font-semibold mb-2">Component Error</h2>
          <p className="text-sm text-red-300">Something went wrong: {error?.message}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
}

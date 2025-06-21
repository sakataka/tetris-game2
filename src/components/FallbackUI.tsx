import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useTranslation } from "react-i18next";
import { extractErrorInfo, isGameError } from "../types/errors";

/**
 * Props for error fallback components
 */
interface FallbackUIProps {
  error: Error;
  retry: () => void;
  reset?: () => void;
  showDetails?: boolean;
  variant?: "minimal" | "detailed" | "game-over";
}

/**
 * Minimal error fallback for non-critical errors
 */
export function MinimalErrorFallback({ error, retry }: FallbackUIProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 m-4"
    >
      <div className="flex items-center space-x-3">
        <div className="text-red-500 text-xl">⚠️</div>
        <div className="flex-1">
          <p className="text-red-700 dark:text-red-300 font-medium">
            {t("error.somethingWentWrong", "Something went wrong")}
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm">{error.message}</p>
        </div>
        <button
          onClick={retry}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          {t("error.retry", "Retry")}
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Detailed error fallback with debug information
 */
export function DetailedErrorFallback({
  error,
  retry,
  reset,
  showDetails = false,
}: FallbackUIProps) {
  const { t } = useTranslation();
  const [detailsVisible, setDetailsVisible] = React.useState(showDetails);

  const gameError = isGameError(error) ? error : null;
  const errorInfo = gameError ? extractErrorInfo(gameError) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-auto"
    >
      {/* Error Icon */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🚨</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t("error.unexpectedError", "Unexpected Error")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {gameError?.recoverable
            ? t("error.recoverableError", "This error can be recovered from")
            : t("error.criticalError", "A critical error occurred")}
        </p>
      </div>

      {/* Error Message */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <p className="text-gray-800 dark:text-gray-200 text-sm">
          <strong>{error.name}:</strong> {error.message}
        </p>
        {gameError && (
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-2">Code: {gameError.code}</p>
        )}
      </div>

      {/* Error Details (Collapsible) */}
      {(gameError || process.env.NODE_ENV === "development") && (
        <div className="mb-6">
          <button
            onClick={() => setDetailsVisible(!detailsVisible)}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
          >
            {detailsVisible
              ? t("error.hideDetails", "Hide Details")
              : t("error.showDetails", "Show Details")}
          </button>

          <AnimatePresence>
            {detailsVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 bg-gray-900 text-green-400 text-xs font-mono rounded p-3 overflow-hidden"
              >
                {errorInfo ? (
                  <div className="space-y-2">
                    <div>
                      <strong>Timestamp:</strong> {errorInfo.timestamp.toISOString()}
                    </div>
                    <div>
                      <strong>Recoverable:</strong> {errorInfo.recoverable ? "Yes" : "No"}
                    </div>
                    {errorInfo.context && (
                      <div>
                        <strong>Context:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(errorInfo.context, null, 2)}
                        </pre>
                      </div>
                    )}
                    {errorInfo.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs">{errorInfo.stack}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap">
                    {error.stack || "No stack trace available"}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={retry}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {t("error.tryAgain", "Try Again")}
        </button>

        {reset && (
          <button
            onClick={reset}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {t("error.resetGame", "Reset Game")}
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {t("error.reloadPage", "Reload Page")}
        </button>
      </div>

      {/* Help Text */}
      <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-6">
        {t("error.helpText", "If the problem persists, try clearing your browser cache.")}
      </p>
    </motion.div>
  );
}

/**
 * Game-over style error fallback
 */
export function GameOverErrorFallback({ error, retry, reset }: FallbackUIProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-red-900 to-red-700 text-white rounded-xl p-8 max-w-md w-full text-center"
      >
        {/* Game Over Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-6xl mb-4"
        >
          💀
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold mb-2"
        >
          {t("gameOver.error", "GAME ERROR")}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-red-200 mb-6"
        >
          {t("gameOver.errorMessage", "The game encountered a fatal error")}
        </motion.p>

        {/* Error Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-black/30 rounded-lg p-4 mb-6"
        >
          <p className="text-sm text-red-100">
            <strong>{error.name}:</strong>
          </p>
          <p className="text-xs text-red-200 mt-1">{error.message}</p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="space-y-3"
        >
          <button
            onClick={retry}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-lg transition-colors backdrop-blur-sm"
          >
            {t("gameOver.retry", "RETRY")}
          </button>

          {reset && (
            <button
              onClick={reset}
              className="w-full bg-green-600/80 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {t("gameOver.newGame", "NEW GAME")}
            </button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Network error specific fallback
 */
export function NetworkErrorFallback({ retry }: FallbackUIProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 m-4"
    >
      <div className="flex items-start space-x-4">
        <div className="text-yellow-600 dark:text-yellow-400 text-2xl">📡</div>
        <div className="flex-1">
          <h3 className="text-yellow-800 dark:text-yellow-300 font-semibold mb-2">
            {t("error.networkError", "Network Error")}
          </h3>
          <p className="text-yellow-700 dark:text-yellow-400 mb-4">
            {t(
              "error.networkErrorMessage",
              "Unable to connect to the server. Please check your internet connection.",
            )}
          </p>
          <button
            onClick={retry}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors"
          >
            {t("error.reconnect", "Reconnect")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Loading error fallback
 */
export function LoadingErrorFallback({ retry }: FallbackUIProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[200px] p-8"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="text-4xl mb-4"
      >
        ⚙️
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {t("error.loadingError", "Loading Error")}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
        {t("error.loadingErrorMessage", "Failed to load game resources.")}
      </p>
      <button
        onClick={retry}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
      >
        {t("error.reload", "Reload")}
      </button>
    </motion.div>
  );
}

/**
 * Factory function to create appropriate fallback UI based on error type
 */
export function createFallbackUI(
  error: Error,
  retry: () => void,
  reset?: () => void,
  variant?: FallbackUIProps["variant"],
): React.ReactNode {
  const props = { error, retry, reset };

  // Determine variant based on error type if not specified
  if (!variant) {
    if (error.message.toLowerCase().includes("network")) {
      return <NetworkErrorFallback {...props} variant="detailed" />;
    }
    if (error.message.toLowerCase().includes("loading")) {
      return <LoadingErrorFallback {...props} variant="detailed" />;
    }
    if (isGameError(error) && !error.recoverable) {
      return <GameOverErrorFallback {...props} variant="game-over" />;
    }
  }

  // Use specified variant or default to detailed
  switch (variant) {
    case "minimal":
      return <MinimalErrorFallback {...props} variant={variant} />;
    case "game-over":
      return <GameOverErrorFallback {...props} variant={variant} />;
    case "detailed":
    default:
      return <DetailedErrorFallback {...props} variant={variant} />;
  }
}

/**
 * Result type for functional error handling
 * Represents either a success value or an error
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Creates a successful Result
 */
export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Creates an error Result
 */
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Type guard to check if Result is successful
 */
export const isOk = <T, E>(result: Result<T, E>): result is { ok: true; value: T } => result.ok;

/**
 * Type guard to check if Result is an error
 */
export const isErr = <T, E>(result: Result<T, E>): result is { ok: false; error: E } => !result.ok;

/**
 * Utility functions for working with Results
 */
export const ResultUtils = {
  /**
   * Maps a successful Result to a new value
   */
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    return isOk(result) ? Ok(fn(result.value)) : result;
  },

  /**
   * Maps an error Result to a new error
   */
  mapErr: <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    return isErr(result) ? Err(fn(result.error)) : result;
  },

  /**
   * Chains multiple Result operations
   */
  chain: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
    return isOk(result) ? fn(result.value) : result;
  },

  /**
   * Unwraps a Result value or returns a default
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
    return isOk(result) ? result.value : defaultValue;
  },

  /**
   * Unwraps a Result value or throws the error
   */
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (isOk(result)) {
      return result.value;
    }
    throw result.error;
  },
};

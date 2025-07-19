/**
 * Enhanced Result type for functional error handling
 * Represents either a success value or an error with additional utilities
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Creates a successful Result
 */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Creates an error Result
 */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Type guard to check if Result is successful
 */
export const isOk = <T, E>(result: Result<T, E>): result is { ok: true; value: T } => result.ok;

/**
 * Type guard to check if Result is an error
 */
export const isErr = <T, E>(result: Result<T, E>): result is { ok: false; error: E } => !result.ok;

/**
 * Enhanced utility functions for working with Results
 */
export const ResultUtils = {
  /**
   * Creates a successful Result
   */
  ok: <T>(value: T): Result<T, never> => ok(value),

  /**
   * Creates an error Result
   */
  err: <E>(error: E): Result<never, E> => err(error),

  /**
   * Maps a successful Result to a new value
   */
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    return isOk(result) ? ok(fn(result.value)) : result;
  },

  /**
   * Maps an error Result to a new error
   */
  mapErr: <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    return isErr(result) ? err(fn(result.error)) : result;
  },

  /**
   * Chains multiple Result operations (flatMap)
   */
  flatMap: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
    return isOk(result) ? fn(result.value) : result;
  },

  /**
   * Alias for flatMap for consistency with other functional libraries
   */
  chain: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
    return ResultUtils.flatMap(result, fn);
  },

  /**
   * Unwraps a Result value or returns a default
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
    return isOk(result) ? result.value : defaultValue;
  },

  /**
   * Unwraps a Result value or computes a default from the error
   */
  unwrapOrElse: <T, E>(result: Result<T, E>, fn: (error: E) => T): T => {
    return isOk(result) ? result.value : fn(result.error);
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

  /**
   * Combines multiple Results into a single Result containing an array
   */
  all: <T, E>(results: Result<T, E>[]): Result<T[], E> => {
    const values: T[] = [];
    for (const result of results) {
      if (isErr(result)) {
        return result;
      }
      values.push(result.value);
    }
    return ok(values);
  },

  /**
   * Returns the first successful Result or the last error
   */
  any: <T, E>(results: Result<T, E>[]): Result<T, E> => {
    let lastError: E | undefined;
    for (const result of results) {
      if (isOk(result)) {
        return result;
      }
      lastError = result.error;
    }
    return err(lastError as E);
  },

  /**
   * Converts a Promise to a Result, catching any errors
   */
  fromPromise: async <T>(promise: Promise<T>): Promise<Result<T, Error>> => {
    try {
      const value = await promise;
      return ok(value);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  },

  /**
   * Converts a function that might throw to a Result
   */
  fromThrowable: <T, Args extends unknown[]>(
    fn: (...args: Args) => T,
  ): ((...args: Args) => Result<T, Error>) => {
    return (...args: Args): Result<T, Error> => {
      try {
        return ok(fn(...args));
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    };
  },

  /**
   * Filters a Result based on a predicate
   */
  filter: <T, E>(
    result: Result<T, E>,
    predicate: (value: T) => boolean,
    errorFn: (value: T) => E,
  ): Result<T, E> => {
    if (isOk(result)) {
      return predicate(result.value) ? result : err(errorFn(result.value));
    }
    return result;
  },

  /**
   * Applies a function to the Result value if it's Ok, otherwise returns the error
   */
  tap: <T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> => {
    if (isOk(result)) {
      fn(result.value);
    }
    return result;
  },

  /**
   * Applies a function to the Result error if it's Err, otherwise returns the value
   */
  tapErr: <T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> => {
    if (isErr(result)) {
      fn(result.error);
    }
    return result;
  },
} as const;

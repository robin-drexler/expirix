import { isWrappedValue, createWrappedItem, isExpired } from "./utils.mjs";

/**
 * Simple polyfill for requestIdleCallback
 * @param {Function} callback - The callback to run when idle
 * @param {{ timeout?: number }} [options] - Options object
 * @returns {number} - The callback ID
 */
function requestIdleCallbackPolyfill(callback, options = {}) {
  const timeout = options.timeout || 0;
  const start = Date.now();

  // @ts-ignore - setTimeout returns different types in different environments
  return setTimeout(() => {
    const deadline = {
      didTimeout: timeout > 0 && Date.now() - start >= timeout,
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start));
      },
    };
    callback(deadline);
  }, 1);
}

/**
 * Get requestIdleCallback with polyfill fallback
 * @returns {Function} - The requestIdleCallback function
 */
function getRequestIdleCallback() {
  if (typeof window !== "undefined" && window.requestIdleCallback) {
    return window.requestIdleCallback.bind(window);
  }
  return requestIdleCallbackPolyfill;
}

/**
 * @param {Storage} originalStorage - The storage object (localStorage or sessionStorage)
 * @param {{ expiresInSeconds?: number, runWhenBrowserIsIdle?: boolean }} [options={}] - Configuration options
 * @returns {{ runCleanup: () => void }}
 */
export function cleanupFactory(
  originalStorage,
  { expiresInSeconds, runWhenBrowserIsIdle = false } = {}
) {
  /**
   * @returns {void}
   */
  function runCleanup() {
    const actualCleanup = () => {
      // Collect all keys first to avoid issues with storage mutation during iteration
      const keys = [];
      for (let i = 0; i < originalStorage.length; i++) {
        const key = originalStorage.key(i);
        if (key !== null) {
          keys.push(key);
        }
      }

      // Process each key
      keys.forEach((key) => {
        const value = originalStorage.getItem(key);
        if (!value) return;

        try {
          const parsed = JSON.parse(value);

          if (isWrappedValue(parsed)) {
            // Check if it should be deleted (expired)
            if (isExpired(parsed)) {
              originalStorage.removeItem(key);
            }
            // If not expired, leave it as is
          } else {
            // Not a wrapped value yet, wrap it
            originalStorage.setItem(
              key,
              JSON.stringify(createWrappedItem(value, expiresInSeconds))
            );
          }
        } catch (e) {
          // Handle non-JSON values - treat as plain string and wrap
          originalStorage.setItem(
            key,
            JSON.stringify(createWrappedItem(value, expiresInSeconds))
          );
        }
      });
    };

    if (runWhenBrowserIsIdle) {
      const requestIdleCallback = getRequestIdleCallback();
      requestIdleCallback(actualCleanup);
    } else {
      actualCleanup();
    }
  }

  return {
    runCleanup,
  };
}

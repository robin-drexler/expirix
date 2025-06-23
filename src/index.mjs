/**
 * @param {Storage} originalStorage
 * @param {{ expiresInSeconds?: number }} options
 * @returns {Storage}
 */
export function wrapStorage(originalStorage, { expiresInSeconds } = {}) {
  const EXPIRY_PREFIX = "__exp_";
  const EXPIRY_VERSION = "v1";
  const pendingExpiries = new Map();

  /**
   * @param {string} key
   */
  function getExpiryKey(key) {
    return EXPIRY_PREFIX + key;
  }

  /**
   * @param {() => void} task
   */
  function scheduleTask(task) {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(task);
    } else {
      task();
    }
  }

  /**
   * @param {string} key
   */
  function cleanupOrphanedExpiry(key) {
    scheduleTask(() => {
      const expiryKey = getExpiryKey(key);
      if (originalStorage.getItem(expiryKey) && !originalStorage.getItem(key)) {
        originalStorage.removeItem(expiryKey);
      }
    });
  }

  return {
    /**
     * @param {string} key
     * @returns {string | null}
     */
    getItem(key) {
      if (key.startsWith(EXPIRY_PREFIX)) {
        return originalStorage.getItem(key);
      }

      const value = originalStorage.getItem(key);
      if (value === null) {
        cleanupOrphanedExpiry(key);
        return null;
      }

      const expiryKey = getExpiryKey(key);
      let expiryData =
        originalStorage.getItem(expiryKey) ||
        (pendingExpiries.has(key)
          ? JSON.stringify(pendingExpiries.get(key))
          : null);

      if (!expiryData && expiresInSeconds !== undefined) {
        const newExpiry = {
          e: Date.now() + expiresInSeconds * 1000,
          v: EXPIRY_VERSION,
        };
        pendingExpiries.set(key, newExpiry);
        scheduleTask(() => {
          if (pendingExpiries.has(key)) {
            originalStorage.setItem(
              expiryKey,
              JSON.stringify(pendingExpiries.get(key))
            );
            pendingExpiries.delete(key);
          }
        });
        return value;
      }

      if (!expiryData) return value;

      let expiryTime;
      try {
        expiryTime = JSON.parse(expiryData).e;
      } catch (e) {
        originalStorage.removeItem(expiryKey);
        pendingExpiries.delete(key);
        return value;
      }

      if (Date.now() > expiryTime) {
        originalStorage.removeItem(key);
        originalStorage.removeItem(expiryKey);
        pendingExpiries.delete(key);
        return null;
      }

      return value;
    },

    /**
     * @param {string} key
     * @param {any} value
     */
    setItem(key, value) {
      if (arguments.length < 2) {
        throw new TypeError(
          `Failed to execute 'setItem' on 'Storage': 2 arguments required, but only ${arguments.length} present.`
        );
      }

      originalStorage.setItem(key, String(value));

      if (expiresInSeconds !== undefined) {
        const expiryData = {
          e: Date.now() + expiresInSeconds * 1000,
          v: EXPIRY_VERSION,
        };
        pendingExpiries.set(key, expiryData);

        scheduleTask(() => {
          if (pendingExpiries.has(key)) {
            originalStorage.setItem(
              getExpiryKey(key),
              JSON.stringify(pendingExpiries.get(key))
            );
            pendingExpiries.delete(key);
          }
        });
      }
    },

    /**
     * @param {string} key
     */
    removeItem(key) {
      originalStorage.removeItem(key);
      originalStorage.removeItem(getExpiryKey(key));
      pendingExpiries.delete(key);
    },

    /**
     * @param {number} index
     * @returns {string | null}
     */
    key(index) {
      return originalStorage.key(index);
    },

    clear() {
      originalStorage.clear();
      pendingExpiries.clear();
    },

    cleanup() {
      const keysToRemove = [];

      for (let i = 0; i < originalStorage.length; i++) {
        const key = originalStorage.key(i);

        if (key?.startsWith(EXPIRY_PREFIX)) {
          const dataKey = key.slice(EXPIRY_PREFIX.length);
          const expiryData = originalStorage.getItem(key);

          let expiryTime = 0;
          if (expiryData) {
            try {
              expiryTime = JSON.parse(expiryData).e;
            } catch (e) {
              expiryTime = 0;
            }
          }

          if (
            !originalStorage.getItem(dataKey) ||
            (expiryTime && Date.now() > expiryTime)
          ) {
            keysToRemove.push(key);
            if (originalStorage.getItem(dataKey)) {
              keysToRemove.push(dataKey);
            }
          }
        }
      }

      keysToRemove.forEach((key) => {
        originalStorage.removeItem(key);
        if (key.startsWith(EXPIRY_PREFIX)) {
          pendingExpiries.delete(key.slice(EXPIRY_PREFIX.length));
        } else {
          pendingExpiries.delete(key);
        }
      });
    },

    get length() {
      return originalStorage.length;
    },
  };
}

// Re-export the cleanup factory for convenience
export { cleanupFactory } from "./cleanup.mjs";

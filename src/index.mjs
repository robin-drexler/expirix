/**
 * @param {Storage} originalStorage - The storage object (localStorage or sessionStorage)
 * @param {{ expiresInSeconds?: number }} [options={}] - Configuration options
 * @returns {Storage}
 */
export function wrapStorage(originalStorage, { expiresInSeconds } = {}) {
  const VERSION = "1";

  /**
   * @param {any} parsed
   * @returns {boolean}
   */
  function isWrappedValue(parsed) {
    return typeof parsed === "object" && parsed !== null && "__vr" in parsed;
  }

  /**
   * @param {string} value
   * @returns {object}
   */
  function createWrappedItem(value) {
    /** @type {{ v: string, __vr: string, ed?: number }} */
    const item = { v: value, __vr: VERSION };
    if (expiresInSeconds !== undefined) {
      item.ed = Date.now() + expiresInSeconds * 1000;
    }
    return item;
  }

  /**
   * @param {string} key
   * @param {string} value
   * @returns {string}
   */
  function autoWrapIfNeeded(key, value) {
    if (expiresInSeconds !== undefined) {
      originalStorage.setItem(key, JSON.stringify(createWrappedItem(value)));
    }
    return value;
  }

  return {
    /**
     * @param {string} key
     * @returns {string | null}
     */
    getItem(key) {
      const value = originalStorage.getItem(key);
      if (!value) return value;

      try {
        const parsed = JSON.parse(value);

        if (isWrappedValue(parsed)) {
          if (parsed.ed && parsed.ed < Date.now()) {
            originalStorage.removeItem(key);
            return null;
          }
          return parsed.v;
        }

        // Auto-wrap existing non-wrapped values
        return autoWrapIfNeeded(key, value);
      } catch (e) {
        // Handle non-JSON values
        return autoWrapIfNeeded(key, value);
      }
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

      const stringValue = String(value);
      originalStorage.setItem(
        key,
        JSON.stringify(createWrappedItem(stringValue))
      );
    },

    /**
     * @param {string} key
     */
    removeItem(key) {
      originalStorage.removeItem(key);
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
    },

    get length() {
      return originalStorage.length;
    },
  };
}

// Re-export the cleanup factory for convenience
export { cleanupFactory } from "./cleanup.mjs";

/**
 * Shared utilities for ephemeral storage
 */

export const VERSION = "1";

/**
 * @param {any} parsed
 * @returns {boolean}
 */
export function isWrappedValue(parsed) {
  return typeof parsed === "object" && parsed !== null && "__vr" in parsed;
}

/**
 * @param {string} value
 * @param {number} [expiresInSeconds] - Optional expiration in seconds
 * @returns {object}
 */
export function createWrappedItem(value, expiresInSeconds) {
  /** @type {{ v: string, __vr: string, ed?: number }} */
  const item = { v: value, __vr: VERSION };
  if (expiresInSeconds !== undefined) {
    item.ed = Date.now() + expiresInSeconds * 1000;
  }
  return item;
}

/**
 * Check if a wrapped value is expired
 * @param {{ v: string, __vr: string, ed?: number }} wrappedValue - The wrapped value object
 * @returns {boolean}
 */
export function isExpired(wrappedValue) {
  return wrappedValue.ed !== undefined && wrappedValue.ed < Date.now();
}

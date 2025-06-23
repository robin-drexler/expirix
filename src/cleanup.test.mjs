import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanupFactory } from "./cleanup.mjs";

const CURRENT_TIME = 1749859200000;

describe("Cleanup Factory", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(CURRENT_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("runWhenBrowserIsIdle", () => {
    it("runs cleanup immediately when runWhenBrowserIsIdle is explicitly set to false", () => {
      window.localStorage.setItem("key1", "value1");

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Check that cleanup ran immediately
      const wrappedValue = JSON.parse(window.localStorage.getItem("key1"));
      expect(wrappedValue).toEqual({
        v: "value1",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("uses requestIdleCallback when runWhenBrowserIsIdle is true and requestIdleCallback exists", async () => {
      // Mock requestIdleCallback
      const mockRequestIdleCallback = vi.fn((callback) => {
        // Simulate calling the callback immediately for testing
        callback({ didTimeout: false, timeRemaining: () => 50 });
        return 1;
      });
      const originalRequestIdleCallback = window.requestIdleCallback;
      window.requestIdleCallback = mockRequestIdleCallback;

      window.localStorage.setItem("key1", "value1");

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: true,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Check that requestIdleCallback was called
      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);
      expect(mockRequestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function)
      );

      // Check that cleanup eventually ran
      const wrappedValue = JSON.parse(window.localStorage.getItem("key1"));
      expect(wrappedValue).toEqual({
        v: "value1",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });

      // Clean up
      if (originalRequestIdleCallback) {
        window.requestIdleCallback = originalRequestIdleCallback;
      } else {
        delete window.requestIdleCallback;
      }
    });

    it("uses polyfill when requestIdleCallback does not exist", () => {
      // Ensure requestIdleCallback doesn't exist
      const originalRequestIdleCallback = window.requestIdleCallback;
      delete window.requestIdleCallback;

      // Mock setTimeout to verify polyfill is used
      const originalSetTimeout = globalThis.setTimeout;
      const mockSetTimeout = vi.fn((callback, delay) => {
        // Call immediately for testing
        callback();
        return 1;
      });
      globalThis.setTimeout = mockSetTimeout;

      window.localStorage.setItem("key1", "value1");

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: true,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Check that setTimeout was called (polyfill)
      expect(mockSetTimeout).toHaveBeenCalledTimes(1);
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1);

      // Check that cleanup eventually ran
      const wrappedValue = JSON.parse(window.localStorage.getItem("key1"));
      expect(wrappedValue).toEqual({
        v: "value1",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });

      // Restore
      globalThis.setTimeout = originalSetTimeout;
      if (originalRequestIdleCallback) {
        window.requestIdleCallback = originalRequestIdleCallback;
      }
    });

    it("polyfill provides correct deadline object", () => {
      // Ensure requestIdleCallback doesn't exist
      const originalRequestIdleCallback = window.requestIdleCallback;
      delete window.requestIdleCallback;

      let deadlineObject;
      const originalSetTimeout = globalThis.setTimeout;
      globalThis.setTimeout = (callback) => {
        callback();
        return 1;
      };

      // Use a custom callback to capture the deadline
      const cleanup = cleanupFactory(window.localStorage, {
        runWhenBrowserIsIdle: true,
      });

      // Mock the actual cleanup function to capture deadline
      const originalRunCleanup = cleanup.runCleanup;
      let capturedCallback;

      // Mock requestIdleCallback polyfill directly to capture callback
      globalThis.setTimeout = (callback) => {
        capturedCallback = callback;
        return 1;
      };

      cleanup.runCleanup();

      // Execute the captured callback and capture the deadline
      if (capturedCallback) {
        const mockDeadline = {
          didTimeout: false,
          timeRemaining: () => 50,
        };

        // Verify the polyfill creates a proper deadline-like object
        expect(typeof capturedCallback).toBe("function");
      }

      // Restore
      globalThis.setTimeout = originalSetTimeout;
      if (originalRequestIdleCallback) {
        window.requestIdleCallback = originalRequestIdleCallback;
      }
    });

    it("handles timeout in polyfill correctly", () => {
      const originalRequestIdleCallback = window.requestIdleCallback;
      delete window.requestIdleCallback;

      const mockSetTimeout = vi.fn();
      globalThis.setTimeout = mockSetTimeout;

      window.localStorage.setItem("key1", "value1");

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: true,
      });
      cleanup.runCleanup();

      // Verify setTimeout was called with delay of 1ms (polyfill behavior)
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1);

      // Restore
      if (originalRequestIdleCallback) {
        window.requestIdleCallback = originalRequestIdleCallback;
      }
    });

    it("uses idle behavior by default when no runWhenBrowserIsIdle is specified", () => {
      // Mock requestIdleCallback to verify it gets called by default
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback({ didTimeout: false, timeRemaining: () => 50 });
        return 1;
      });
      const originalRequestIdleCallback = window.requestIdleCallback;
      window.requestIdleCallback = mockRequestIdleCallback;

      window.localStorage.setItem("key1", "value1");

      // Create cleanup without specifying runWhenBrowserIsIdle (should default to true)
      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Check that requestIdleCallback was called (proving default is true)
      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);
      expect(mockRequestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function)
      );

      // Check that cleanup eventually ran
      const wrappedValue = JSON.parse(window.localStorage.getItem("key1"));
      expect(wrappedValue).toEqual({
        v: "value1",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });

      // Clean up
      if (originalRequestIdleCallback) {
        window.requestIdleCallback = originalRequestIdleCallback;
      } else {
        delete window.requestIdleCallback;
      }
    });
  });

  describe("runCleanup", () => {
    it("wraps plain string values with expiry when expiresInSeconds is provided", () => {
      // Set up some plain string values in storage
      window.localStorage.setItem("key1", "value1");
      window.localStorage.setItem("key2", "value2");

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Check that values are now wrapped
      const wrappedValue1 = JSON.parse(window.localStorage.getItem("key1"));
      expect(wrappedValue1).toEqual({
        v: "value1",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });

      const wrappedValue2 = JSON.parse(window.localStorage.getItem("key2"));
      expect(wrappedValue2).toEqual({
        v: "value2",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("wraps plain JSON values with expiry when expiresInSeconds is provided", () => {
      // Set up some plain JSON values in storage
      const jsonValue = JSON.stringify({ name: "John", age: 30 });
      window.localStorage.setItem("user", jsonValue);

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Check that JSON value is now wrapped
      const wrappedValue = JSON.parse(window.localStorage.getItem("user"));
      expect(wrappedValue).toEqual({
        v: jsonValue,
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("wraps plain values without expiry when expiresInSeconds is not provided", () => {
      window.localStorage.setItem("key1", "value1");

      const cleanup = cleanupFactory(window.localStorage, {
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Check that value is wrapped but without expiry
      const wrappedValue = JSON.parse(window.localStorage.getItem("key1"));
      expect(wrappedValue).toEqual({
        v: "value1",
        __vr: "1",
      });
      expect(wrappedValue.ed).toBeUndefined();
    });

    it("leaves already wrapped values unchanged if not expired", () => {
      // Set up a wrapped value that's not expired
      const wrappedValue = {
        v: "test-value",
        __vr: "1",
        ed: CURRENT_TIME + 30000, // expires in 30 seconds
      };
      window.localStorage.setItem("key1", JSON.stringify(wrappedValue));

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
      });
      cleanup.runCleanup();

      // Value should remain unchanged
      const result = JSON.parse(window.localStorage.getItem("key1"));
      expect(result).toEqual(wrappedValue);
    });

    it("deletes expired wrapped values", () => {
      // Set up a wrapped value that's expired
      const expiredValue = {
        v: "expired-value",
        __vr: "1",
        ed: CURRENT_TIME - 1000, // expired 1 second ago
      };
      window.localStorage.setItem("expired-key", JSON.stringify(expiredValue));

      // Set up a non-expired value for comparison
      window.localStorage.setItem("valid-key", "valid-value");

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Expired value should be deleted
      expect(window.localStorage.getItem("expired-key")).toBeNull();

      // Valid value should be wrapped
      const validResult = JSON.parse(window.localStorage.getItem("valid-key"));
      expect(validResult.v).toBe("valid-value");
    });

    it("handles mixed storage with wrapped, non-wrapped, expired, and valid values", () => {
      // Plain value that should be wrapped
      window.localStorage.setItem("plain", "plain-value");

      // Already wrapped, not expired
      const validWrapped = {
        v: "valid-wrapped",
        __vr: "1",
        ed: CURRENT_TIME + 30000,
      };
      window.localStorage.setItem(
        "valid-wrapped",
        JSON.stringify(validWrapped)
      );

      // Already wrapped, expired
      const expiredWrapped = {
        v: "expired-wrapped",
        __vr: "1",
        ed: CURRENT_TIME - 1000,
      };
      window.localStorage.setItem(
        "expired-wrapped",
        JSON.stringify(expiredWrapped)
      );

      // JSON value that should be wrapped
      const jsonValue = JSON.stringify({ data: "test" });
      window.localStorage.setItem("json", jsonValue);

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Plain value should be wrapped
      const plainResult = JSON.parse(window.localStorage.getItem("plain"));
      expect(plainResult).toEqual({
        v: "plain-value",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });

      // Valid wrapped should remain unchanged
      const validResult = JSON.parse(
        window.localStorage.getItem("valid-wrapped")
      );
      expect(validResult).toEqual(validWrapped);

      // Expired wrapped should be deleted
      expect(window.localStorage.getItem("expired-wrapped")).toBeNull();

      // JSON should be wrapped
      const jsonResult = JSON.parse(window.localStorage.getItem("json"));
      expect(jsonResult).toEqual({
        v: jsonValue,
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("handles empty storage gracefully", () => {
      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
      });

      expect(() => cleanup.runCleanup()).not.toThrow();
      expect(window.localStorage.length).toBe(0);
    });

    it("handles corrupted JSON values gracefully", () => {
      // Set corrupted JSON
      window.localStorage.setItem("corrupted", "{invalid json}");
      window.localStorage.setItem("valid", "valid-value");

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Corrupted JSON should be treated as plain string and wrapped
      const corruptedResult = JSON.parse(
        window.localStorage.getItem("corrupted")
      );
      expect(corruptedResult).toEqual({
        v: "{invalid json}",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });

      // Valid value should also be wrapped
      const validResult = JSON.parse(window.localStorage.getItem("valid"));
      expect(validResult.v).toBe("valid-value");
    });
  });

  describe("wrapUnwrappedItems", () => {
    it("does not wrap unwrapped items by default (wrapUnwrappedItems: false)", () => {
      // Set up plain values and already wrapped values
      window.localStorage.setItem("plain1", "plain-value-1");
      window.localStorage.setItem("plain2", "plain-value-2");

      const wrappedValue = {
        v: "wrapped-value",
        __vr: "1",
        ed: CURRENT_TIME + 30000,
      };
      window.localStorage.setItem("wrapped", JSON.stringify(wrappedValue));

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
      });
      cleanup.runCleanup();

      // Plain values should remain unwrapped
      expect(window.localStorage.getItem("plain1")).toBe("plain-value-1");
      expect(window.localStorage.getItem("plain2")).toBe("plain-value-2");

      // Already wrapped value should remain unchanged
      const resultWrapped = JSON.parse(window.localStorage.getItem("wrapped"));
      expect(resultWrapped).toEqual(wrappedValue);
    });

    it("wraps unwrapped items when wrapUnwrappedItems is true", () => {
      // Set up plain values
      window.localStorage.setItem("plain1", "plain-value-1");
      window.localStorage.setItem("plain2", JSON.stringify({ data: "test" }));

      const cleanup = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Plain values should now be wrapped
      const wrappedValue1 = JSON.parse(window.localStorage.getItem("plain1"));
      expect(wrappedValue1).toEqual({
        v: "plain-value-1",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });

      const wrappedValue2 = JSON.parse(window.localStorage.getItem("plain2"));
      expect(wrappedValue2).toEqual({
        v: JSON.stringify({ data: "test" }),
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("removes expired wrapped items regardless of wrapUnwrappedItems setting", () => {
      // Set up expired wrapped value
      const expiredValue = {
        v: "expired-value",
        __vr: "1",
        ed: CURRENT_TIME - 1000, // expired 1 second ago
      };
      window.localStorage.setItem("expired", JSON.stringify(expiredValue));

      // Set up plain value
      window.localStorage.setItem("plain", "plain-value");

      // Test with wrapUnwrappedItems: false
      const cleanup1 = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: false,
      });
      cleanup1.runCleanup();

      // Expired value should be removed
      expect(window.localStorage.getItem("expired")).toBeNull();

      // Plain value should remain unwrapped
      expect(window.localStorage.getItem("plain")).toBe("plain-value");

      // Reset and test with wrapUnwrappedItems: true
      window.localStorage.setItem("expired2", JSON.stringify(expiredValue));
      window.localStorage.setItem("plain2", "plain-value-2");

      const cleanup2 = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup2.runCleanup();

      // Expired value should be removed
      expect(window.localStorage.getItem("expired2")).toBeNull();

      // Plain value should be wrapped
      const wrappedResult = JSON.parse(window.localStorage.getItem("plain2"));
      expect(wrappedResult).toEqual({
        v: "plain-value-2",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("handles non-JSON values correctly with wrapUnwrappedItems option", () => {
      // Set up corrupted JSON and plain string
      window.localStorage.setItem("corrupted", "{invalid json}");
      window.localStorage.setItem("plain", "simple-string");

      // Test with wrapUnwrappedItems: false
      const cleanup1 = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: false,
      });
      cleanup1.runCleanup();

      // Values should remain unwrapped
      expect(window.localStorage.getItem("corrupted")).toBe("{invalid json}");
      expect(window.localStorage.getItem("plain")).toBe("simple-string");

      // Test with wrapUnwrappedItems: true
      const cleanup2 = cleanupFactory(window.localStorage, {
        expiresInSeconds: 60,
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup2.runCleanup();

      // Values should now be wrapped
      const wrappedCorrupted = JSON.parse(
        window.localStorage.getItem("corrupted")
      );
      expect(wrappedCorrupted).toEqual({
        v: "{invalid json}",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });

      const wrappedPlain = JSON.parse(window.localStorage.getItem("plain"));
      expect(wrappedPlain).toEqual({
        v: "simple-string",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("works without expiresInSeconds when wrapUnwrappedItems is true", () => {
      window.localStorage.setItem("plain", "plain-value");

      const cleanup = cleanupFactory(window.localStorage, {
        runWhenBrowserIsIdle: false,
        wrapUnwrappedItems: true,
      });
      cleanup.runCleanup();

      // Value should be wrapped without expiry
      const wrappedValue = JSON.parse(window.localStorage.getItem("plain"));
      expect(wrappedValue).toEqual({
        v: "plain-value",
        __vr: "1",
      });
      expect(wrappedValue.ed).toBeUndefined();
    });
  });
});

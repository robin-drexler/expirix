// Sat, 14 Jun 2025 00:00:00 GMT
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { wrapStorage } from "./index.mjs";

const CURRENT_TIME = 1749859200000;

describe("Ephemeral Storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(CURRENT_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("setItem", () => {
    it("stores values without expiration when expiresInSeconds is not set", () => {
      const storage = wrapStorage(window.localStorage);
      storage.setItem("test1", "value1");

      const rawValue = window.localStorage.getItem("test1");
      const parsed = JSON.parse(rawValue ?? "");
      expect(parsed.v).toBe("value1");
      expect(parsed.__vr).toBe("1");
      expect(parsed.ed).toBeUndefined();
    });

    it("adds expiry when storing new items with expiresInSeconds", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });
      storage.setItem("test1", "value1");

      const result = window.localStorage.getItem("test1") ?? "";
      expect(JSON.parse(result)).toMatchObject({
        v: "value1",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("handles empty strings", () => {
      const storage = wrapStorage(window.localStorage);
      storage.setItem("empty", "");

      const result = storage.getItem("empty");
      expect(result).toBe("");
    });

    it("handles special characters and unicode", () => {
      const storage = wrapStorage(window.localStorage);
      const specialValue =
        "🚀 Special chars: \"quotes\", 'apostrophes', \\backslashes\\, newlines\n, tabs\t, and unicode: 测试";
      storage.setItem("special", specialValue);

      const result = storage.getItem("special");
      expect(result).toBe(specialValue);
    });

    it("handles null and undefined values correctly", () => {
      const storage = wrapStorage(window.localStorage);

      // Setting null should store "null" as a string
      storage.setItem("null-test", String(null));
      expect(storage.getItem("null-test")).toBe("null");

      // Setting undefined should store "undefined" as a string
      storage.setItem("undefined-test", String(undefined));
      expect(storage.getItem("undefined-test")).toBe("undefined");
    });

    it("handles very long strings", () => {
      const storage = wrapStorage(window.localStorage);
      const longString = "a".repeat(10000);

      storage.setItem("long", longString);
      const result = storage.getItem("long");
      expect(result).toBe(longString);
    });

    it("handles keys with special characters", () => {
      const storage = wrapStorage(window.localStorage);
      const specialKeys = [
        "key with spaces",
        "key-with-dashes",
        "key_with_underscores",
        "key.with.dots",
        "🔑emoji-key",
      ];

      specialKeys.forEach((key, index) => {
        const value = `value${index}`;
        storage.setItem(key, value);
        expect(storage.getItem(key)).toBe(value);
      });
    });

    it("handles overwriting existing items", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });

      storage.setItem("overwrite", "original");
      expect(storage.getItem("overwrite")).toBe("original");

      storage.setItem("overwrite", "updated");
      expect(storage.getItem("overwrite")).toBe("updated");
    });

    it("handles zero expiration time", () => {
      const storage = wrapStorage(window.localStorage, { expiresInSeconds: 0 });
      storage.setItem("instant-expire", "value");

      // Check what was stored
      const storedValue = window.localStorage.getItem("instant-expire");
      const parsed = JSON.parse(storedValue ?? "");
      expect(parsed.ed).toBe(CURRENT_TIME); // Should expire at current time

      // At exactly the same time, it should still be valid
      const resultAtSameTime = storage.getItem("instant-expire");
      expect(resultAtSameTime).toBe("value");

      // Move time forward by 1ms to trigger expiration
      vi.setSystemTime(new Date(CURRENT_TIME + 1));

      const result = storage.getItem("instant-expire");
      expect(result).toBe(null);
    });

    it("handles negative expiration time", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: -60,
      });
      storage.setItem("past-expire", "value");

      // Should expire immediately since it's in the past
      const result = storage.getItem("past-expire");
      expect(result).toBe(null);
    });

    it("handles very large expiration times", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 999999999,
      });
      storage.setItem("far-future", "value");

      const result = storage.getItem("far-future");
      expect(result).toBe("value");

      const rawValue = window.localStorage.getItem("far-future");
      const parsed = JSON.parse(rawValue ?? "");
      expect(parsed.ed).toBe(CURRENT_TIME + 999999999 * 1000);
    });

    it("handles non-string values the same as native localStorage", () => {
      const storage = wrapStorage(window.localStorage);
      const testKey = "test-non-string";

      // Test null
      const nullValue = null;
      localStorage.setItem(testKey, nullValue);
      const nativeNullResult = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      storage.setItem(testKey, nullValue);
      const wrappedNullResult = storage.getItem(testKey);
      storage.removeItem(testKey);

      expect(wrappedNullResult).toBe(nativeNullResult);
      expect(wrappedNullResult).toBe("null");

      // Test undefined
      const undefinedValue = undefined;
      localStorage.setItem(testKey, undefinedValue);
      const nativeUndefinedResult = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      storage.setItem(testKey, undefinedValue);
      const wrappedUndefinedResult = storage.getItem(testKey);
      storage.removeItem(testKey);

      expect(wrappedUndefinedResult).toBe(nativeUndefinedResult);
      expect(wrappedUndefinedResult).toBe("undefined");

      // Test number
      const numberValue = 42;
      localStorage.setItem(testKey, numberValue);
      const nativeNumberResult = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      storage.setItem(testKey, numberValue);
      const wrappedNumberResult = storage.getItem(testKey);
      storage.removeItem(testKey);

      expect(wrappedNumberResult).toBe(nativeNumberResult);
      expect(wrappedNumberResult).toBe("42");

      // Test boolean
      const booleanValue = true;
      localStorage.setItem(testKey, booleanValue);
      const nativeBooleanResult = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      storage.setItem(testKey, booleanValue);
      const wrappedBooleanResult = storage.getItem(testKey);
      storage.removeItem(testKey);

      expect(wrappedBooleanResult).toBe(nativeBooleanResult);
      expect(wrappedBooleanResult).toBe("true");

      // Test object (should become "[object Object]")
      const objectValue = { name: "test" };
      localStorage.setItem(testKey, objectValue);
      const nativeObjectResult = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      storage.setItem(testKey, objectValue);
      const wrappedObjectResult = storage.getItem(testKey);
      storage.removeItem(testKey);

      expect(wrappedObjectResult).toBe(nativeObjectResult);
      expect(wrappedObjectResult).toBe("[object Object]");

      // Test array (should become comma-separated values)
      const arrayValue = [1, 2, 3];
      localStorage.setItem(testKey, arrayValue);
      const nativeArrayResult = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      storage.setItem(testKey, arrayValue);
      const wrappedArrayResult = storage.getItem(testKey);
      storage.removeItem(testKey);

      expect(wrappedArrayResult).toBe(nativeArrayResult);
      expect(wrappedArrayResult).toBe("1,2,3");

      // Test function (should become function string)
      const functionValue = function () {
        return "test";
      };
      localStorage.setItem(testKey, functionValue);
      const nativeFunctionResult = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      storage.setItem(testKey, functionValue);
      const wrappedFunctionResult = storage.getItem(testKey);
      storage.removeItem(testKey);

      expect(wrappedFunctionResult).toBe(nativeFunctionResult);
      expect(wrappedFunctionResult).toContain("function");
    });

    it("handles missing value parameter the same as native localStorage", () => {
      const storage = wrapStorage(window.localStorage);
      const testKey = "test-missing-value";

      // Test what happens when setItem is called with no second argument
      // Native localStorage throws an error when only one argument is provided
      expect(() => {
        localStorage.setItem(testKey);
      }).toThrow(
        "Failed to execute 'setItem' on 'Storage': 2 arguments required, but only 1 present."
      );

      // Our wrapped storage should also throw an error or behave consistently
      expect(() => {
        storage.setItem(testKey);
      }).toThrow();
    });

    it("handles no arguments the same as native localStorage", () => {
      const storage = wrapStorage(window.localStorage);

      // Test what happens when setItem is called with no arguments at all
      expect(() => {
        localStorage.setItem();
      }).toThrow(
        "Failed to execute 'setItem' on 'Storage': 2 arguments required, but only 0 present."
      );

      expect(() => {
        storage.setItem();
      }).toThrow(
        "Failed to execute 'setItem' on 'Storage': 2 arguments required, but only 0 present."
      );
    });
  });

  describe("getItem", () => {
    it("returns values that were stored without expiration", () => {
      const storage = wrapStorage(window.localStorage);
      storage.setItem("test1", "value1");

      const result = storage.getItem("test1");
      expect(result).toBe("value1");
    });

    it("returns null for non-existent items", () => {
      const storage = wrapStorage(window.localStorage);

      const result = storage.getItem("nonexistent");
      expect(result).toBe(null);
    });

    it("returns null for expired items", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });
      storage.setItem("test1", "value1");

      // Move time forward past expiration
      vi.setSystemTime(new Date(CURRENT_TIME + 61000));

      const result = storage.getItem("test1");
      expect(result).toBe(null);
    });

    it("removes expired items from storage when accessed", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });
      storage.setItem("test1", "value1");

      // Move time forward past expiration
      vi.setSystemTime(new Date(CURRENT_TIME + 61000));

      storage.getItem("test1");

      // Item should be removed from original storage
      expect(window.localStorage.getItem("test1")).toBe(null);
    });

    it("returns valid items that haven't expired yet", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });
      storage.setItem("test1", "value1");

      // Move time forward but not past expiration
      vi.setSystemTime(new Date(CURRENT_TIME + 30000));

      const result = storage.getItem("test1");
      expect(result).toBe("value1");
    });

    it("handles items exactly at expiration time", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });
      storage.setItem("test1", "value1");

      // Move time forward to exactly expiration time (should still be valid)
      vi.setSystemTime(new Date(CURRENT_TIME + 60000));

      const result = storage.getItem("test1");
      expect(result).toBe("value1");

      // Move time forward past expiration time (should be expired)
      vi.setSystemTime(new Date(CURRENT_TIME + 60001));

      const expiredResult = storage.getItem("test1");
      expect(expiredResult).toBe(null);
    });

    it("handles plain string values stored directly in localStorage", () => {
      const storage = wrapStorage(window.localStorage);
      localStorage.setItem("test1", "value1");

      const result = storage.getItem("test1");
      expect(result).toBe("value1");
    });

    it("auto-wraps plain string values when expiration is configured", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });
      window.localStorage.setItem("test1", "value1");

      // First access should return the value and auto-wrap it
      const result = storage.getItem("test1");
      expect(result).toBe("value1");

      // Check that it's now wrapped in storage
      const wrappedValue = window.localStorage.getItem("test1") ?? "";
      expect(JSON.parse(wrappedValue)).toMatchObject({
        v: "value1",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("handles existing JSON values that are not in our format", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });

      // Store some JSON that's not in our format
      const originalJson = JSON.stringify({ name: "John", age: 30 });
      window.localStorage.setItem("user", originalJson);

      // When we read it through our wrapper, it should return the original JSON string
      const result = storage.getItem("user");
      expect(result).toBe(originalJson);

      // But it should be upgraded to our wrapped format in storage
      const wrappedValue = window.localStorage.getItem("user");
      const parsed = JSON.parse(wrappedValue ?? "");
      expect(parsed).toMatchObject({
        v: originalJson, // The original JSON string should be stored as 'v'
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("handles complex JSON objects as strings", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });

      const complexJson = JSON.stringify({
        users: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        metadata: { created: "2025-06-13", version: 2.1 },
        settings: { theme: "dark", notifications: true },
      });

      window.localStorage.setItem("complex", complexJson);

      const result = storage.getItem("complex");
      expect(result).toBe(complexJson);
    });

    it("handles malformed JSON gracefully", () => {
      const storage = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });

      // Store malformed JSON directly
      window.localStorage.setItem("malformed", '{"incomplete": json');

      const result = storage.getItem("malformed");
      expect(result).toBe('{"incomplete": json');
    });
  });

  describe("removeItem", () => {
    it("removes items correctly", () => {
      const storage = wrapStorage(window.localStorage);
      storage.setItem("test1", "value1");

      expect(storage.getItem("test1")).toBe("value1");

      storage.removeItem("test1");
      expect(storage.getItem("test1")).toBe(null);
      expect(window.localStorage.getItem("test1")).toBe(null);
    });

    it("handles removing non-existent items", () => {
      const storage = wrapStorage(window.localStorage);

      // Should not throw an error
      expect(() => storage.removeItem("nonexistent")).not.toThrow();
    });
  });

  describe("clear", () => {
    it("clears all items correctly", () => {
      const storage = wrapStorage(window.localStorage);
      storage.setItem("test1", "value1");
      storage.setItem("test2", "value2");

      expect(storage.getItem("test1")).toBe("value1");
      expect(storage.getItem("test2")).toBe("value2");

      storage.clear();
      expect(storage.getItem("test1")).toBe(null);
      expect(storage.getItem("test2")).toBe(null);
      expect(window.localStorage.length).toBe(0);
    });
  });

  describe("key", () => {
    it("implements key method correctly", () => {
      const storage = wrapStorage(window.localStorage);
      storage.setItem("test1", "value1");
      storage.setItem("test2", "value2");

      expect(storage.length).toBe(2);
      expect(storage.key(0)).toBeTruthy();
      expect(storage.key(1)).toBeTruthy();
      expect(storage.key(2)).toBe(null);
    });
  });

  describe("length", () => {
    it("reports correct length", () => {
      const storage = wrapStorage(window.localStorage);
      expect(storage.length).toBe(0);

      storage.setItem("test1", "value1");
      expect(storage.length).toBe(1);

      storage.setItem("test2", "value2");
      expect(storage.length).toBe(2);

      storage.removeItem("test1");
      expect(storage.length).toBe(1);
    });
  });

  describe("Multiple Instances", () => {
    it("handles multiple wrapper instances with different expiration settings", () => {
      const storage1 = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });
      const storage2 = wrapStorage(window.localStorage, {
        expiresInSeconds: 120,
      });
      const storage3 = wrapStorage(window.localStorage); // No expiration

      storage1.setItem("key1", "value1");
      storage2.setItem("key2", "value2");
      storage3.setItem("key3", "value3");

      expect(storage1.getItem("key1")).toBe("value1");
      expect(storage2.getItem("key2")).toBe("value2");
      expect(storage3.getItem("key3")).toBe("value3");

      // Check cross-instance compatibility
      expect(storage1.getItem("key2")).toBe("value2");
      expect(storage2.getItem("key1")).toBe("value1");
      expect(storage3.getItem("key1")).toBe("value1");
    });

    it("handles sessionStorage as well as localStorage", () => {
      const localWrapper = wrapStorage(window.localStorage, {
        expiresInSeconds: 60,
      });
      const sessionWrapper = wrapStorage(window.sessionStorage, {
        expiresInSeconds: 120,
      });

      localWrapper.setItem("local-key", "local-value");
      sessionWrapper.setItem("session-key", "session-value");

      expect(localWrapper.getItem("local-key")).toBe("local-value");
      expect(sessionWrapper.getItem("session-key")).toBe("session-value");

      // They should be independent
      expect(localWrapper.getItem("session-key")).toBe(null);
      expect(sessionWrapper.getItem("local-key")).toBe(null);
    });
  });
});

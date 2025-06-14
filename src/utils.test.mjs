import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  VERSION,
  isWrappedValue,
  createWrappedItem,
  isExpired,
} from "./utils.mjs";

const CURRENT_TIME = 1749859200000;

describe("Utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(CURRENT_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isWrappedValue", () => {
    it("returns true for wrapped values", () => {
      const wrappedValue = { v: "test", __vr: "1" };
      expect(isWrappedValue(wrappedValue)).toBe(true);
    });

    it("returns false for non-wrapped objects", () => {
      const nonWrappedObject = { name: "John", age: 30 };
      expect(isWrappedValue(nonWrappedObject)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isWrappedValue(null)).toBe(false);
    });

    it("returns false for strings", () => {
      expect(isWrappedValue("test string")).toBe(false);
    });
  });

  describe("createWrappedItem", () => {
    it("creates wrapped item without expiry", () => {
      const result = createWrappedItem("test value");
      expect(result).toEqual({
        v: "test value",
        __vr: "1",
      });
      expect(result.ed).toBeUndefined();
    });

    it("creates wrapped item with expiry", () => {
      const result = createWrappedItem("test value", 60);
      expect(result).toEqual({
        v: "test value",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });

    it("creates wrapped item with zero expiry", () => {
      const result = createWrappedItem("test value", 0);
      expect(result).toEqual({
        v: "test value",
        __vr: "1",
        ed: CURRENT_TIME,
      });
    });

    it("handles empty string values", () => {
      const result = createWrappedItem("", 60);
      expect(result).toEqual({
        v: "",
        __vr: "1",
        ed: CURRENT_TIME + 60000,
      });
    });
  });

  describe("isExpired", () => {
    it("returns false for items without expiry", () => {
      const wrappedValue = { v: "test", __vr: "1" };
      expect(isExpired(wrappedValue)).toBe(false);
    });

    it("returns false for non-expired items", () => {
      const wrappedValue = { v: "test", __vr: "1", ed: CURRENT_TIME + 60000 };
      expect(isExpired(wrappedValue)).toBe(false);
    });

    it("returns true for expired items", () => {
      const wrappedValue = { v: "test", __vr: "1", ed: CURRENT_TIME - 1000 };
      expect(isExpired(wrappedValue)).toBe(true);
    });

    it("returns false for items that expire exactly now", () => {
      const wrappedValue = { v: "test", __vr: "1", ed: CURRENT_TIME };
      expect(isExpired(wrappedValue)).toBe(false);
    });
  });
});

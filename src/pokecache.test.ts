import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { Cache } from "./pokecache";

describe("Cache", () => {
  let cache: Cache;

  afterEach(() => {
    if (cache) {
      cache.stopReapLoop();
    }
  });

  test("should add and retrieve values", () => {
    cache = new Cache(5000);

    cache.add("key1", "value1");
    cache.add("key2", { data: "value2" });

    expect(cache.get("key1")).toBe("value1");
    expect(cache.get("key2")).toEqual({ data: "value2" });
  });

  test("should return undefined for missing keys", () => {
    cache = new Cache(5000);

    expect(cache.get("nonexistent")).toBeUndefined();
  });

  test("should reap old entries after interval", async () => {
    // Use a short interval for testing (100ms)
    cache = new Cache(100);

    cache.add("key1", "value1");
    cache.add("key2", "value2");

    // Both should exist immediately
    expect(cache.get("key1")).toBe("value1");
    expect(cache.get("key2")).toBe("value2");

    // Wait for entries to expire (150ms > 100ms interval)
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Entries should still exist (reap hasn't run yet)
    // Wait for the reap loop to run (another 100ms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Now entries should be reaped
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
  });

  test("should handle multiple entries with different types", () => {
    cache = new Cache(5000);

    cache.add("string", "hello");
    cache.add("number", 42);
    cache.add("object", { name: "Pikachu", type: "Electric" });
    cache.add("array", [1, 2, 3]);

    expect(cache.get("string")).toBe("hello");
    expect(cache.get("number")).toBe(42);
    expect(cache.get("object")).toEqual({ name: "Pikachu", type: "Electric" });
    expect(cache.get("array")).toEqual([1, 2, 3]);
  });

  test("should update existing entries", () => {
    cache = new Cache(5000);

    cache.add("key1", "oldValue");
    expect(cache.get("key1")).toBe("oldValue");

    cache.add("key1", "newValue");
    expect(cache.get("key1")).toBe("newValue");
  });
});

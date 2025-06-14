/**
 * Example: Using runWhenBrowserIsIdle for cleanup operations
 *
 * This example demonstrates how to use the cleanupFactory with the
 * runWhenBrowserIsIdle option to perform cleanup operations when
 * the browser is idle, improving performance by not blocking the
 * main thread during busy periods.
 */

import { cleanupFactory } from "../src/index.mjs";

// Example 1: Basic idle cleanup
console.log("🔄 Example 1: Basic idle cleanup");

// Create cleanup that runs when browser is idle
const idleCleanup = cleanupFactory(localStorage, {
  expiresInSeconds: 3600, // 1 hour expiration
  runWhenBrowserIsIdle: true,
});

// Add some test data
localStorage.setItem("user-preference", "dark-mode");
localStorage.setItem(
  "session-data",
  JSON.stringify({ userId: 123, token: "abc" })
);
localStorage.setItem("temp-cache", "some-cached-data");

console.log("Added test data to localStorage");
console.log("Running idle cleanup...");

// This will use requestIdleCallback if available, setTimeout as fallback
idleCleanup.runCleanup();

console.log("Cleanup scheduled for when browser is idle");
console.log("Check developer tools to see the wrapped values in localStorage");

// Example 2: Comparison with immediate cleanup
console.log("\n🚀 Example 2: Immediate vs Idle cleanup comparison");

const immediateCleanup = cleanupFactory(localStorage, {
  expiresInSeconds: 7200, // 2 hours
  runWhenBrowserIsIdle: false, // Run immediately
});

// Simulate adding data during heavy computation
console.log("Simulating heavy computation...");
const start = performance.now();

// Add data
localStorage.setItem("immediate-test", "test-data");

// Run immediate cleanup
immediateCleanup.runCleanup();

const immediateTime = performance.now() - start;
console.log(`Immediate cleanup took: ${immediateTime}ms`);

// Now with idle cleanup
localStorage.setItem("idle-test", "test-data");

const idleStart = performance.now();
const idleCleanup2 = cleanupFactory(localStorage, {
  expiresInSeconds: 7200,
  runWhenBrowserIsIdle: true,
});

idleCleanup2.runCleanup();
const idleScheduleTime = performance.now() - idleStart;

console.log(`Idle cleanup scheduling took: ${idleScheduleTime}ms`);
console.log("Actual cleanup will run when browser is idle");

// Example 3: Periodic idle cleanup
console.log("\n⏰ Example 3: Periodic idle cleanup");

function setupPeriodicIdleCleanup() {
  const periodicCleanup = cleanupFactory(localStorage, {
    expiresInSeconds: 1800, // 30 minutes
    runWhenBrowserIsIdle: true,
  });

  // Schedule cleanup every 5 minutes, but only when browser is idle
  setInterval(() => {
    console.log("Running periodic idle cleanup...");
    periodicCleanup.runCleanup();
  }, 5 * 60 * 1000); // 5 minutes
}

// setupPeriodicIdleCleanup();
console.log("Periodic cleanup example ready (uncomment to activate)");

// Example 4: Feature detection
console.log("\n🔍 Example 4: Feature detection");

if (typeof window !== "undefined" && window.requestIdleCallback) {
  console.log("✅ Native requestIdleCallback is available");
} else {
  console.log("📦 Using polyfill fallback for requestIdleCallback");
}

console.log(
  "\n✨ All examples complete! Check localStorage in developer tools."
);

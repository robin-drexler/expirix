import { wrapStorage, cleanupFactory } from "../src/index.mjs";

// Create wrapped storage with 60 seconds expiry and make it globally available
window.storage = wrapStorage(localStorage, { expiresInSeconds: 60 });

// Also expose the wrapStorage function globally for custom configurations
window.wrapStorage = wrapStorage;

// Demonstrate runWhenBrowserIsIdle feature
console.log("🚀 Expirix loaded!");
console.log("Available globals:");
console.log("  storage - Pre-configured localStorage with 60s expiry");
console.log("  wrapStorage - Function to create custom storage instances");
console.log("");

// Demonstrate idle cleanup
console.log("🛠️ Demonstrating idle cleanup feature:");
console.log("Creating cleanup with runWhenBrowserIsIdle=true...");

const idleCleanup = cleanupFactory(localStorage, {
  expiresInSeconds: 60,
  runWhenBrowserIsIdle: true,
});

// Add some test data
localStorage.setItem("demo-key1", "demo-value1");
localStorage.setItem("demo-key2", "demo-value2");

console.log("Added test data to localStorage");
console.log("Running cleanup (will use requestIdleCallback if available)...");

idleCleanup.runCleanup();

console.log("Cleanup scheduled! Check localStorage to see wrapped values.");
console.log("");
console.log("Try it out:");
console.log('  storage.setItem("test", "hello world")');
console.log('  storage.getItem("test")');
console.log("  idleCleanup.runCleanup() // Run cleanup when browser is idle");

// Make cleanup available globally for experimentation
window.idleCleanup = idleCleanup;

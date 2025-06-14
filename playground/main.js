import { wrapStorage } from "../src/index.mjs";

// Create wrapped storage with 60 seconds expiry and make it globally available
window.storage = wrapStorage(localStorage, { expiresInSeconds: 60 });

// Also expose the wrapStorage function globally for custom configurations
window.wrapStorage = wrapStorage;

// Log to console that everything is ready
console.log("🚀 Expirix loaded!");
console.log("Available globals:");
console.log("  storage - Pre-configured localStorage with 60s expiry");
console.log("  wrapStorage - Function to create custom storage instances");
console.log("");
console.log("Try it out:");
console.log('  storage.setItem("test", "hello world")');
console.log('  storage.getItem("test")');

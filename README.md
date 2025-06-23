# Expirix

> ⚠️ **Alert:** This package is not yet released. The API and features may change before the first stable version.

A storage wrapper that adds expiration functionality to `localStorage` or any other storage that follows the `Storage` interface.

## Installation

```bash
npm install expirix
```

## Examples

### Basic Usage

```javascript
import { wrapStorage } from "expirix";

// Create a storage wrapper with 30 seconds expiration
const storage = wrapStorage(localStorage, { expiresInSeconds: 30 });

// Store a value (will expire in 30 seconds)
storage.setItem("key", "value");

// Get the value (returns null if expired)
const value = storage.getItem("key");
```

### Creating a reusable storage module

```javascript
// app-storage.js
import { wrapStorage } from "expirix";

const wrappedLocalStorage = wrapStorage(localStorage, {
  expiresInSeconds: 3600,
});

export default wrappedLocalStorage;
```

```javascript
// Using in your app
import storage from "./app-storage.js";

// Store user preferences that expire in 1 hour
storage.setItem("theme", "dark");
storage.setItem("language", "en");

// Later...
const theme = storage.getItem("theme"); // null if expired
```

## API

### `wrapStorage(originalStorage, options?)`

Wraps a Storage object to add expiration functionality.

**Parameters:**

- `originalStorage` (Storage): The storage object (localStorage or sessionStorage)
- `options` (object, optional):
  - `expiresInSeconds` (number, optional): Time in seconds after which stored items expire

**Returns:** A Storage-compatible object with expiration support

### `cleanupFactory(originalStorage, options?)`

Creates a cleanup function to remove expired values and optionally wrap unwrapped values so that they can be cleaned up later on as well.
Useful to cleanup keys that might not be requested by the app anymore.

**Parameters:**

- `originalStorage` (Storage): The storage object (localStorage or sessionStorage)
- `options` (object, optional):
  - `expiresInSeconds` (number, optional): Time in seconds after which stored items expire
  - `runWhenBrowserIsIdle` (boolean, optional): Whether to run cleanup when browser is idle (default: true)
  - `wrapUnwrappedItems` (boolean, optional): Whether to wrap non-wrapped items with expiration metadata (default: false)
    If turned on, this will wrap existing values in a JSON structure. Only use it if you are sure that whatever code reads these values can handle this.

**Returns:** An object with a `runCleanup()` method

**Example:**

```javascript
import { cleanupFactory } from "expirix";

// Create cleanup that runs when browser is idle (default behavior)
const cleanup = cleanupFactory(localStorage, {
  expiresInSeconds: 3600, // 1 hour
});

// Run cleanup (will use requestIdleCallback if available, setTimeout as fallback)
cleanup.runCleanup();

// To run cleanup immediately instead:
const immediateCleanup = cleanupFactory(localStorage, {
  expiresInSeconds: 3600,
  runWhenBrowserIsIdle: false,
});
```

#### Wrapping Behavior Control

By default, cleanup operations only remove expired items but do not modify existing unwrapped values. You can control whether cleanup should wrap existing unwrapped items with the `wrapUnwrappedItems` option.

```javascript
// Only clean up expired items, leave unwrapped items as-is (default)
const cleanupOnly = cleanupFactory(localStorage, {
  expiresInSeconds: 3600,
});

// Clean up expired items AND wrap unwrapped items
const cleanupAndWrap = cleanupFactory(localStorage, {
  expiresInSeconds: 3600,
  wrapUnwrappedItems: true,
});
```

This gives you fine-grained control over when existing data gets wrapped with expiration metadata.

#### Browser Idle Cleanup

By default, the library runs cleanup operations when the browser is idle, using the `requestIdleCallback` API when available, with a simple polyfill fallback for older browsers.

```javascript
// Cleanup will run when browser is idle (default behavior)
const idleCleanup = cleanupFactory(localStorage, {
  expiresInSeconds: 3600,
});

idleCleanup.runCleanup(); // Schedules cleanup for when browser is idle

// To run cleanup immediately instead:
const immediateCleanup = cleanupFactory(localStorage, {
  expiresInSeconds: 3600,
  runWhenBrowserIsIdle: false,
});
```

**requestIdleCallback Polyfill:**

- Uses native `requestIdleCallback` when available
- Falls back to `setTimeout` with 1ms delay in older browsers

## Features

- ✅ **Drop-in replacement** for localStorage/sessionStorage
- ✅ **Automatic expiration** - expired items are automatically removed
- ✅ **Backward compatible** - handles existing non-wrapped values
- ✅ **TypeScript support** with full type definitions
- ✅ **Zero dependencies**

## License

ISC

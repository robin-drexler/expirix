# Expirix

> ⚠️ **Alert:** This package is not yet released. The API and features may change before the first stable version.

A storage wrapper that adds expiration functionality to `localStorage` or any other storage that follows the `Storage` interface.

## Installation

```bash
npm install expiring-storage
```

## Usage

```javascript
import { wrapStorage } from "expirix";

// Create a storage wrapper with 30 seconds expiration
const storage = wrapStorage(localStorage, { expiresInSeconds: 30 });

// Store a value (will expire in 30 seconds)
storage.setItem("key", "value");

// Get the value (returns null if expired)
const value = storage.getItem("key");
```

## API

### `wrapStorage(originalStorage, options?)`

Wraps a Storage object to add expiration functionality.

**Parameters:**

- `originalStorage` (Storage): The storage object (localStorage or sessionStorage)
- `options` (object, optional):
  - `expiresInSeconds` (number, optional): Time in seconds after which stored items expire

**Returns:** A Storage-compatible object with expiration support

## Features

- ✅ **Drop-in replacement** for localStorage/sessionStorage
- ✅ **Automatic expiration** - expired items are automatically removed
- ✅ **Backward compatible** - handles existing non-wrapped values
- ✅ **TypeScript support** with full type definitions
- ✅ **Zero dependencies**

## License

ISC

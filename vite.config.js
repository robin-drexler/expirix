import { defineConfig } from "vite";

export default defineConfig({
  // Set playground as the root directory
  root: "playground",
  // Use index.html as the entry point
  build: {
    rollupOptions: {
      input: "playground/index.html",
    },
  },
  // Configure dev server
  server: {
    open: true, // Open index.html automatically
    port: 3000,
  },
});

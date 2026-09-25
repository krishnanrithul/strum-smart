import { defineConfig } from "vitest/config";
import path from "path";

// Separate from vite.config.ts on purpose: tests don't need the dev server
// or the lovable-tagger plugin, and keeping them apart avoids plugin noise.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Pinned so date-sensitive tests behave the same here and in CI. It also
    // keeps local and UTC calendar dates genuinely different, which is what
    // the streak tests are checking.
    env: { TZ: "Asia/Kolkata" },
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Only measure what we actually intend to test. Pages and generated
      // shadcn components would drown the signal.
      include: ["src/lib/**", "src/hooks/**"],
      exclude: ["src/lib/supabase.ts", "src/integrations/**"],
    },
  },
});

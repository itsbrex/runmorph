import { MorphProvider } from "./morph-provider";
import type { MorphConfig } from "./morph-provider-client";

// Re-export types that might be needed by consumers
export type { MorphConfig };

// Export individual components to ensure they're properly loaded
export const Provider = MorphProvider;

// Create the nested structure with proper typing
export const Morph = {
  Provider,
} as const;

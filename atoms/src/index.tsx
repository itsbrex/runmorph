// Import styles
import "./styles/globals.css";

// Export the main components
export * from "./components/morph/connect";
export * from "./components/morph/morph-provider";
export * from "./components/morph/connection";
export * from "./components/morph/connection-settings";
export * from "./components/morph/connection-context";
export * from "./components/morph/connection-provider";
export * from "./components/morph/connection-triggers";
export * from "./components/morph/connection-scopes";
export * from "./components/morph/connection-operations";

// Export UI components that are used by our main components
export * from "./components/ui/button";
export * from "./components/ui/dropdown-menu";

// Export utility functions
export * from "./lib/utils";

export { Connection } from "./components/morph/connection";
export { Morph } from "./components/morph/morph";

// Re-export types
export type { ConnectionCallbacks } from "./components/morph/connection";
export type { MorphConfig } from "./components/morph/morph";
export type { ConnectionScopesProps } from "./components/morph/connection-scopes";

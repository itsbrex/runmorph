import { type ReactNode } from "react";
import { ConnectionProvider } from "./connection-provider";
import { ConnectionSettings } from "./connection-settings";
import { ConnectionScopes } from "./connection-scopes";
import { Authorize, Delete } from "./connection-client";
import type { ConnectionCallbacks } from "./connection-triggers";
// Re-export types that might be needed by consumers
export type { ConnectionCallbacks };

// Export individual components to ensure they're properly loaded
export const Provider = ConnectionProvider;
export const Settings = ConnectionSettings;
export const Scopes = ConnectionScopes;
export const Triggers = {
  Authorize,
  Delete,
} as const;

// Create the nested structure with proper typing
export const Connection = {
  Provider,
  Settings,
  Scopes,
  Triggers,
} as const;

import type { ReactNode } from "react";
import { ConnectionProviderClient } from "./connection-provider-client";
import type { TranslationFunction } from "./connection-context";

export interface ConnectionProviderProps {
  sessionToken: string;
  children: ReactNode;
  t?: TranslationFunction;
}

export function ConnectionProvider({
  sessionToken,
  children,
  t,
}: ConnectionProviderProps) {
  return (
    <ConnectionProviderClient sessionToken={sessionToken} t={t}>
      {children}
    </ConnectionProviderClient>
  );
}

// Re-export the context hook
export { useConnection } from "./connection-context";

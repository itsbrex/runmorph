"use client";

import * as React from "react";
import {
  ConnectionContext,
  type TranslationFunction,
} from "./connection-context";

export interface ConnectionProviderClientProps {
  sessionToken: string;
  children: React.ReactNode;
  t?: TranslationFunction;
}

export function ConnectionProviderClient({
  sessionToken,
  children,
  t,
}: ConnectionProviderClientProps) {
  const [settings, setSettings] = React.useState<Record<string, any>>({});
  // Create the context value
  const contextValue = React.useMemo(
    () => ({
      sessionToken,
      settings,
      setSettings,
      t,
    }),
    [sessionToken, settings, t]
  );

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}

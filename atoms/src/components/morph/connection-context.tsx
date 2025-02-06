"use client";

import { createContext, useContext, type ReactNode } from "react";

export type TranslationFunction = {
  <T extends string>(
    key: T,
    values?: Record<string, any>,
    formats?: Record<string, any>
  ): string;
  rich<T extends string>(
    key: T,
    values?: Record<string, any>,
    formats?: Record<string, any>
  ): ReactNode;
};

export interface ConnectionContextValue {
  sessionToken: string;
  settings: Record<string, any>;
  setSettings: (settings: Record<string, any>) => void;
  t?: TranslationFunction;
}

export const ConnectionContext = createContext<
  ConnectionContextValue | undefined
>(undefined);

export function useConnection() {
  const context = useContext(ConnectionContext);

  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }

  return context;
}

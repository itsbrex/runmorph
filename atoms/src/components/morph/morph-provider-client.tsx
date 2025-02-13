"use client";

import { Morph } from "@runmorph/cloud";
import { createContext, useContext, type ReactNode } from "react";

export interface MorphConfig {
  publicKey: string;
  baseUrl?: string;
}

interface MorphContextValue {
  morph: ReturnType<typeof Morph>;
}

const MorphContext = createContext<MorphContextValue | undefined>(undefined);

export interface MorphProviderClientProps {
  config: MorphConfig;
  children: ReactNode;
}

export function MorphProviderClient({
  config,
  children,
}: MorphProviderClientProps) {
  const morph = Morph(config);
  return (
    <MorphContext.Provider value={{ morph }}>{children}</MorphContext.Provider>
  );
}

export function useMorph(): ReturnType<typeof Morph> {
  const context = useContext(MorphContext);

  if (context === undefined) {
    throw new Error("useMorph must be used within a MorphProvider");
  }

  return context.morph;
}

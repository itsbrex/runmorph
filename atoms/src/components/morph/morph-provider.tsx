import type { ReactNode } from "react";
import { MorphProviderClient, type MorphConfig } from "./morph-provider-client";

export interface MorphProviderProps {
  config?: MorphConfig;
  children: ReactNode;
}

export function MorphProvider({ config, children }: MorphProviderProps) {
  let morphConfig = config;

  if (!morphConfig?.publicKey) {
    const publicKey =
      process.env.MORPH_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY ||
      process.env.VITE_MORPH_PUBLIC_KEY ||
      process.env.REACT_APP_MORPH_PUBLIC_KEY;

    if (!publicKey) {
      throw new Error(
        "Missing Morph public key environment variable. Please set one of: MORPH_PUBLIC_KEY, NEXT_PUBLIC_MORPH_PUBLIC_KEY, VITE_MORPH_PUBLIC_KEY, REACT_APP_MORPH_PUBLIC_KEY"
      );
    }
    morphConfig = { publicKey };
  }

  return (
    <MorphProviderClient config={morphConfig}>{children}</MorphProviderClient>
  );
}

// Re-export the context hook
export { useMorph } from "./morph-provider-client";

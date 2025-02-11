"use client";
import { MorphProvider } from "@runmorph/atoms";
import { Connect } from "@runmorph/atoms";
import type { ConnectionCallbacks } from "@runmorph/atoms";

interface ConnectCardProps {
  sessionToken: string;
  connectorId: string;
  connectionCallbacks?: ConnectionCallbacks;
}

export function ConnectCard({
  sessionToken,
  connectionCallbacks,
}: ConnectCardProps) {
  return (
    <MorphProvider>
      <Connect
        sessionToken={sessionToken}
        connectionCallbacks={connectionCallbacks}
      />
    </MorphProvider>
  );
}

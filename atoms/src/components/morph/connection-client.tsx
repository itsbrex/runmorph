"use client";

import {
  ConnectionTriggers,
  type ConnectionTriggerProps,
  type ConnectionCallbacks,
} from "./connection-triggers";

interface AuthorizeProps<T = HTMLElement> {
  children: ConnectionTriggerProps<T>["children"];
  windowMode?: "popup" | "redirect";
  mode?: "connect" | "direct";
  redirectUrl?: string;
  connectionCallbacks?: ConnectionCallbacks;
}

export function Authorize<T = HTMLElement>({
  children,
  mode,
  windowMode,
  redirectUrl,
  connectionCallbacks,
}: AuthorizeProps<T>) {
  return (
    <ConnectionTriggers.Authorize<T>
      windowMode={windowMode}
      mode={mode}
      redirectUrl={redirectUrl}
      connectionCallbacks={connectionCallbacks}
    >
      {children}
    </ConnectionTriggers.Authorize>
  );
}

interface DeleteProps<T = HTMLElement> {
  children: ConnectionTriggerProps<T>["children"];
  connectionCallbacks?: ConnectionCallbacks;
}

export function Delete<T = HTMLElement>({
  children,
  connectionCallbacks,
}: DeleteProps<T>) {
  return (
    <ConnectionTriggers.Delete<T> connectionCallbacks={connectionCallbacks}>
      {children}
    </ConnectionTriggers.Delete>
  );
}

"use client";

import type { ReactElement } from "react";
import {
  ConnectionTriggers,
  type ConnectionTriggerProps,
  type ConnectionCallbacks,
} from "./connection-triggers";

interface AuthorizeProps<T = HTMLElement> {
  children: ConnectionTriggerProps<T>["children"];
  mode?: "popup" | "redirect";
  redirectUrl?: string;
  connectionCallbacks?: ConnectionCallbacks;
}

export function Authorize<T = HTMLElement>({
  children,
  mode,
  redirectUrl,
  connectionCallbacks,
}: AuthorizeProps<T>) {
  return (
    <ConnectionTriggers.Authorize<T>
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

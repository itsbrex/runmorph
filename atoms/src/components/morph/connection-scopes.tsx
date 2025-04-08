import { ConnectionScopesClient } from "./connection-scopes-client";

export interface ConnectionScopesProps {
  scopes?: string[];
  hidden?: boolean;
}

export function ConnectionScopes({ scopes, hidden }: ConnectionScopesProps) {
  return <ConnectionScopesClient initialScopes={scopes} hidden={hidden} />;
}

import type { ReactElement } from "react";
import {
  AuthorizeClient,
  DeleteClient,
  type ConnectionCallbacks,
  type ConnectionTriggerClientProps,
} from "./connection-triggers-client";

export type { ConnectionCallbacks };

export interface ConnectionTriggerProps<T = HTMLElement>
  extends Omit<ConnectionTriggerClientProps<T>, "children"> {
  children: ReactElement<{
    onClick?: (e: React.MouseEvent<T>) => void;
    onKeyDown?: (e: React.KeyboardEvent<T>) => void;
  }>;
}

export function Authorize<T = HTMLElement>(props: ConnectionTriggerProps<T>) {
  return <AuthorizeClient {...props} />;
}

export function Delete<T = HTMLElement>(props: ConnectionTriggerProps<T>) {
  return <DeleteClient {...props} />;
}

export const ConnectionTriggers = {
  Authorize,
  Delete,
};

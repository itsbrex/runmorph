import { ConnectionUpdateParams, ConnectionIds } from "./connection";

export type SessionCreateParams = {
  connection: ConnectionIds<string> & ConnectionUpdateParams;
} & {
  expiresIn?: number;
};

export type SessionData = {
  object: "session";
  connection: ConnectionIds<string> & ConnectionUpdateParams;
  sessionToken: string;
  expiresAt: string;
};

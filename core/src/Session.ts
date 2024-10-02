import { Connector } from "@runmorph/cdk";
import { config } from "dotenv";
import { sign, verify } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { MorphError } from "./Error";
import { MorphClient } from "./Morph";
import type { Adapter, Awaitable, EitherDataOrError } from "./types";
import type { SessionCreateParams, SessionData } from "./types/session";

config();

const JWT_SECRET = process.env.MORPH_ENCRYPTION_KEY;
const TOKEN_EXPIRATION = process.env.MORPH_SESSION_DURATION || "30m"; // 30 minutes

export class Session {
  private morph: MorphClient<Adapter, Connector<string>[], string>;

  constructor(morph: MorphClient<Adapter, Connector<string>[], string>) {
    this.morph = morph;
  }

  create(
    params: SessionCreateParams,
  ): Awaitable<EitherDataOrError<SessionData>> {
    if (!JWT_SECRET) {
      return {
        error: new MorphError({
          code: "MORPH_BAD_CONFIGURATION",
          message: "ENCRYPTION_KEY env variable is not set",
        }),
      };
    }

    const { expiresIn, ...createSessionParams } = params;

    const expiresAt = new Date(
      Date.now() + (expiresIn || 30 * 60) * 1000,
    ).toISOString();

    const sessionData: SessionData = {
      object: "session",
      ...createSessionParams,
      expiresAt,
      sessionToken: sign({ ...params, jti: uuidv4() }, JWT_SECRET, {
        expiresIn: params.expiresIn || TOKEN_EXPIRATION,
      }),
    };

    return { data: sessionData };
  }

  async verify(sessionToken: string): Promise<EitherDataOrError<SessionData>> {
    if (!JWT_SECRET) {
      return {
        error: new MorphError({
          code: "MORPH_BAD_CONFIGURATION",
          message: "ENCRYPTION_KEY env variable is not set",
        }),
      };
    }
    try {
      const decodedSessionData = verify(
        sessionToken,
        JWT_SECRET,
      ) as SessionData & {
        jti: string;
      };

      const currentTime = new Date().getTime();
      const expirationTime = new Date(decodedSessionData.expiresAt).getTime();

      if (currentTime > expirationTime) {
        return {
          error: new MorphError({
            code: "MORPH_SESSION_EXPIRED",
            message: "The session has expired.",
          }),
        };
      }

      const { connectorId, ownerId, ...connectionUpdateParams } =
        decodedSessionData.connection;
      const { error } = await this.morph
        .connection({ connectorId, ownerId })
        .updateOrCreate({ ...connectionUpdateParams });

      if (error) return { error };

      return { data: decodedSessionData };
    } catch (e) {
      return {
        error: new MorphError({
          code: "MORPH_SESSION_TOKEN_NOT_VERIFIED",
          message: `Details : ${JSON.stringify(e)}`,
        }),
      };
    }
  }
}

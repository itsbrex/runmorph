import type {
  ConnectorBundle,
  ResourceModelOperations,
  Awaitable,
  EitherDataOrError,
  WebhookOperations,
  ResourceEvents,
} from "@runmorph/cdk";
import { config } from "dotenv";
import { sign, verify } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { MorphClient } from "./Morph";
import type { Adapter } from "./types";
import type { SessionCreateParams, SessionData } from "./types/session";

config();

const JWT_SECRET = process.env.MORPH_ENCRYPTION_KEY;
const TOKEN_EXPIRATION = process.env.MORPH_SESSION_DURATION || "30m"; // 30 minutes

export class Session<
  A extends Adapter,
  C extends ConnectorBundle<
    I,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
  I extends string,
> {
  private morph: MorphClient<A, C>;

  constructor(morph: MorphClient<A, C>) {
    this.morph = morph;
  }

  create(
    params: SessionCreateParams<C, I>
  ): Awaitable<EitherDataOrError<SessionData<C, I>>> {
    if (!JWT_SECRET) {
      return {
        error: {
          code: "MORPH::BAD_CONFIGURATION",
          message: "MORPH_ENCRYPTION_KEY env variable is not set",
        },
      };
    }

    const { expiresIn, ...createSessionParams } = params;

    const expiresAt = new Date(
      Date.now() + (expiresIn || 30 * 60) * 1000
    ).toISOString();

    const sessionData: SessionData<C, I> = {
      object: "session",
      ...createSessionParams,
      expiresAt,
      sessionToken: sign({ ...params, jti: uuidv4() }, JWT_SECRET, {
        expiresIn: params.expiresIn || TOKEN_EXPIRATION,
      }),
    };

    return { data: sessionData };
  }

  verify(sessionToken: string): EitherDataOrError<SessionData<C, I>> {
    if (!JWT_SECRET) {
      return {
        error: {
          code: "MORPH::BAD_CONFIGURATION",
          message: "MORPH_ENCRYPTION_KEY env variable is not set",
        },
      };
    }
    try {
      const decodedSessionData = verify(
        sessionToken,
        JWT_SECRET
      ) as SessionData<C, I> & {
        jti: string;
      };

      const currentTime = new Date().getTime();
      const expirationTime = new Date(decodedSessionData.expiresAt).getTime();

      if (currentTime > expirationTime) {
        return {
          error: {
            code: "MORPH::SESSION::EXPIRED",
            message: "The session has expired.",
          },
        };
      }

      const { connectorId, ownerId, ...connectionUpdateParams } =
        decodedSessionData.connection;
      this.morph
        .connections({ connectorId: connectorId as I, ownerId })
        .updateOrCreate({ ...connectionUpdateParams });

      // if (error) return { error };

      return { data: decodedSessionData };
    } catch (e) {
      return {
        error: {
          code: "MORPH::SESSION::TOKEN_VALIDATION_FAILED",
          message: `Details : ${JSON.stringify(e)}`,
        },
      };
    }
  }
}

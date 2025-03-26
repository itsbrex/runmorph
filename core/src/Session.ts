import type {
  ConnectorBundle,
  ResourceModelOperations,
  Awaitable,
  EitherDataOrError,
  WebhookOperations,
  ResourceEvents,
  Settings,
  ConnectionData,
} from "@runmorph/cdk";
import { config } from "dotenv";
import { sign, verify, Secret, SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { MorphClient } from "./Morph";
import type { SessionCreateParams, SessionData } from "./types/session";

config();

const JWT_SECRET: Secret = process.env.MORPH_ENCRYPTION_KEY || "";
// Convert any string duration to seconds, default to 30 minutes (1800 seconds)
const TOKEN_EXPIRATION: number = (() => {
  const duration = process.env.MORPH_SESSION_DURATION;
  if (!duration) return 1800;
  if (typeof duration === "number") return duration;
  // If it ends with 'm', convert minutes to seconds
  if (duration.endsWith("m")) {
    const minutes = parseInt(duration.slice(0, -1));
    return isNaN(minutes) ? 1800 : minutes * 60;
  }
  // If it ends with 'h', convert hours to seconds
  if (duration.endsWith("h")) {
    const hours = parseInt(duration.slice(0, -1));
    return isNaN(hours) ? 1800 : hours * 3600;
  }
  // If it ends with 's' or is just a number, parse it as seconds
  const seconds = parseInt(duration);
  return isNaN(seconds) ? 1800 : seconds;
})();

export class SessionClient<
  TConnectorBundleArray extends ConnectorBundle<
    I,
    Settings,
    Settings,
    string,
    ResourceModelOperations,
    WebhookOperations<
      ResourceEvents,
      Record<string, ResourceEvents>,
      string,
      string
    >
  >[],
  I extends string,
> {
  private morph: MorphClient<TConnectorBundleArray>;

  constructor(morph: MorphClient<TConnectorBundleArray>) {
    this.morph = morph;
  }

  create(
    params: SessionCreateParams<TConnectorBundleArray, I>
  ): Awaitable<EitherDataOrError<SessionData<TConnectorBundleArray, I>>> {
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

    const signOptions: SignOptions = {
      expiresIn:
        typeof params.expiresIn === "number"
          ? params.expiresIn
          : TOKEN_EXPIRATION,
    };

    const sessionData: SessionData<TConnectorBundleArray, I> = {
      object: "session",
      ...createSessionParams,
      expiresAt,
      sessionToken: sign(
        { ...params, jti: uuidv4() } as object,
        JWT_SECRET,
        signOptions
      ),
    };

    return { data: sessionData };
  }

  verify(sessionToken: string): EitherDataOrError<
    SessionData<TConnectorBundleArray, I>
  > & {
    promise?: Promise<EitherDataOrError<ConnectionData>>;
  } {
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
      ) as SessionData<TConnectorBundleArray, I> & {
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

      const promise = this.morph
        .connections({ connectorId: connectorId as I, ownerId })
        .updateOrCreate({ ...connectionUpdateParams });

      // if (error) return { error };

      return { data: decodedSessionData, promise };
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

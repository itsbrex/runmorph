import crypto from "crypto";

import { GlobalEventMapper } from "@runmorph/cdk";
import { verify } from "jsonwebtoken";

import GongCallMapper from "../../resources/telephonyCall/mapper";

type GongCallMetadata = {
  id: string;
  url: string;
  started: string;
};

export type GongWebhookEvent = {
  callData: {
    metaData: GongCallMetadata;
  };
};

type GongRequest = {
  body: GongWebhookEvent;
  headers: {
    "x-traceid"?: string;
  };
};

export default new GlobalEventMapper({
  eventRoutes: {
    call: {
      telephonyCall: {
        mapper: GongCallMapper,
        triggers: ["created", "updated"],
      },
    },
  },
  identifier: async (request, { route }) => {
    const { body } = request as GongRequest;
    const url = body.callData?.metaData?.url;

    const subdomain = url.match(/https:\/\/(.*?)\.app\.gong\.io/)?.[1];

    if (!subdomain) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::MAPPER_FAILED",
          message: "Could not extract subdomain from Gong webhook URL",
        },
      };
    }

    return {
      model: "telephonyCall",
      trigger: body.callData.metaData.started ? "updated" : "created",
      identifierKey: subdomain,
    };
  },
  handler: async (request, { connection }) => {
    const webhookPublicKey = await connection.getSetting("webhookPublicKey");

    if (
      webhookPublicKey &&
      typeof webhookPublicKey === "string" &&
      typeof request.headers?.authorization === "string"
    ) {
      const authHeader = request.headers.authorization;

      try {
        const publicKey = `-----BEGIN PUBLIC KEY-----
${webhookPublicKey}
-----END PUBLIC KEY-----`;
        // Verify JWT signature and decode payload
        const decodedToken = await verify(authHeader, publicKey, {
          algorithms: ["RS256"],
        });

        if (typeof decodedToken !== "object" || !decodedToken) {
          return {
            error: {
              code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
              message: "Invalid JWT token payload",
            },
          };
        }

        // Type assertion for decoded token
        const payload = decodedToken as {
          webhook_url?: string;
          exp?: number;
          body_sha256?: string;
        };

        // Verify required claims exist
        if (!payload.webhook_url || !payload.exp || !payload.body_sha256) {
          return {
            error: {
              code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
              message: "JWT missing required claims",
            },
          };
        }

        // Check if token is expired
        if (payload.exp < Math.floor(Date.now() / 1000)) {
          return {
            error: {
              code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
              message: "JWT token has expired",
            },
          };
        }

        // TODO : Verify body_sha256 claim matches request body hash
      } catch (err) {
        return {
          error: {
            code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
            message: "Failed to validate webhook signature",
          },
        };
      }
    }
    const { body } = request as GongRequest;
    const idempotencyKey = (
      request.headers["x-traceid"] ||
      `${body.callData.metaData.id}-${Date.now()}`
    ).toString();

    return {
      idempotencyKey,
      resourceRef: {
        id: body.callData.metaData.id,
      },
    };
  },
});

import * as crypto from "crypto";

import { GlobalEventMapper } from "@runmorph/cdk";

import { SalesforceConnector } from "../../connector";
import SalesforceCardViewMapper, {
  SalesforceCardViewRequest,
} from "../../resources/widgetCardView/mapper";

export default new GlobalEventMapper({
  eventRoutes: {
    cardView: {
      widgetCardView: {
        mapper: SalesforceCardViewMapper,
        triggers: ["created"],
      },
    },
  },
  identifier: async (request, { route }) => {
    switch (route) {
      case "cardView": {
        const { headers } = request as {
          headers: { origin?: string };
        };

        const organizationDomain = headers.origin
          ? new URL(headers.origin).hostname.split(".")[0]
          : undefined;

        if (!organizationDomain) {
          return {
            error: {
              code: "CONNECTOR::WEBHOOK::MAPPER_FAILED",
              message: "Missing organization domain in request origin",
            },
          };
        }

        return {
          model: "widgetCardView",
          trigger: "created",
          identifierKey: organizationDomain,
        };
      }
    }
  },
  handler: async (request, { model, metadata, trigger, connection }) => {
    // Validate the request
    const headers = request.headers;
    const timestamp = headers["x-salesforce-request-timestamp"];
    const signature = headers["x-salesforce-signature"];
    const method = request.method;
    const uri = request.url;
    const origin = request.headers.origin;
    const body = request.body as SalesforceCardViewRequest;
    const bodyAsString = body ? JSON.stringify(body) : "";

    if (!timestamp || !signature || !method || !uri || !origin) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
          message: "Missing required headers for webhook validation",
        },
      };
    }

    const host = origin ? new URL(origin.toString()).host : undefined;

    const connector = connection.getConnector<SalesforceConnector>();

    const cardViewPackageSecret = connector.getSetting(
      "_cardViewPackageSecret"
    );
    if (!cardViewPackageSecret) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
          message: "Missing cardViewPackageSecret in connector configuration",
        },
      };
    }

    const encoder = new TextEncoder();
    const stringToSign = method + uri + bodyAsString + timestamp + host;
    const data = encoder.encode(stringToSign);
    const keyData = encoder.encode(cardViewPackageSecret.toString());

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const computedSignature = await crypto.subtle.sign("HMAC", key, data);
    const computedSignatureBase64 = btoa(
      String.fromCharCode(...new Uint8Array(computedSignature))
    );
    console.log("computedSignatureBase64", computedSignatureBase64);
    if (computedSignatureBase64 !== signature) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
          message: "Invalid webhook signature",
        },
      };
    }

    // Process with the mapping

    switch (model) {
      case "widgetCardView": {
        const organizationDomain = headers.origin
          ? new URL(headers.origin as string).hostname.split(".")[0]
          : undefined;

        return {
          rawResource: body,
          idempotencyKey: `${organizationDomain}-${body.userId}-${body.recordType}-${body.recordId}-${Date.now()}`,
        };
      }
    }
  },
});

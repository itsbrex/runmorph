import * as crypto from "crypto";

import { GlobalEventMapper } from "@runmorph/cdk";

import SalesforceCardViewMapper, {
  SalesforceCardViewRequest,
} from "../../resources/widgetCardView/mapper";

export default new GlobalEventMapper({
  eventRouter: {
    cardView: {
      widgetCardView: ["created"],
    },
  },
  handler: async ({ request, globalRoute }) => {
    switch (globalRoute) {
      case "cardView": {
        const { body, headers } = request as {
          body: SalesforceCardViewRequest;
          headers: { origin?: string };
        };

        console.log("headers", headers);
        const organizationDomain = headers.origin
          ? new URL(headers.origin).hostname.split(".")[0]
          : undefined;

        return [
          {
            mapper: SalesforceCardViewMapper,
            trigger: "created",
            rawResource: body,
            identifierKey: `${organizationDomain}-${globalRoute}-widgetCardView-created`,
            idempotencyKey: `${organizationDomain}-${globalRoute}-${body.userId}-${body.recordType}-${body.recordId}-${Date.now()}`,
          },
        ];
      }
    }
  },
  validator: async ({ request, connector }) => {
    const timestamp = request.headers["x-salesforce-request-timestamp"];
    const signature = request.headers["x-salesforce-signature"];
    const method = request.method;
    const uri = request.url;
    const origin = request.headers.origin;
    const body = request.body ? JSON.stringify(request.body) : "";

    if (!timestamp || !signature || !method || !uri || !origin) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
          message: "Missing required headers for webhook validation",
        },
      };
    }

    const host = origin ? new URL(origin.toString()).host : undefined;

    const options = connector.getOptions();
    const cardViewPackageSecret = options?._cardViewPackageSecret || undefined;
    if (!cardViewPackageSecret) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
          message: "Missing cardViewPackageSecret in connector configuration",
        },
      };
    }

    const encoder = new TextEncoder();
    const stringToSign = method + uri + body + timestamp + host;
    console.log("stringToSign", stringToSign);
    console.log("cardViewPackageSecret", cardViewPackageSecret);
    const data = encoder.encode(stringToSign);
    const keyData = encoder.encode(cardViewPackageSecret.toString());

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const computedSignature = await crypto.subtle.sign("HMAC", key, data);
    const computedSignatureBase64 = btoa(
      String.fromCharCode(...new Uint8Array(computedSignature)),
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

    return { valid: true };
  },
});

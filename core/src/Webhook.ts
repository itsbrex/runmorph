import type {
  ConnectorBundle,
  ResourceModelOperations,
  WebhookOperations,
  ResourceEvents,
  EitherDataOrError,
  Logger,
  ArrayToIndexedObject,
  GetWebhookModels,
  EventTrigger,
  WebhookData,
  MorphErrorCode,
} from "@runmorph/cdk";
import { sign } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { ConnectionClient } from "./Connection";
import { Adapter, AdapterWebhook } from "./types";
import { generateId } from "./utils/encryption";

export function generateHookUrl(params: {
  connectorId: string;
  ownerId: string;
  model: string;
  trigger: string;
}): string {
  const hookBaseUrl = process.env.MORPH_HOOK_BASE_URL;
  if (!hookBaseUrl) {
    throw {
      code: "MORPH::BAD_CONFIGURATION",
      message: "MORPH_HOOK_BASE_URL missing.",
    };
  }

  const JWT_SECRET = process.env.MORPH_ENCRYPTION_KEY;
  if (!JWT_SECRET) {
    throw {
      code: "MORPH::BAD_CONFIGURATION",
      message: "MORPH_ENCRYPTION_KEY missing.",
    };
  }

  const subscriptionToken = sign({ ...params, jti: uuidv4() }, JWT_SECRET);

  return `${hookBaseUrl}/hook/${params.connectorId}/subscription/${subscriptionToken}`;
}

export class WebhookClient<
  A extends Adapter,
  C extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
  CI extends C[number]["id"],
> {
  connection: ConnectionClient<A, C, CI>;
  connector: ArrayToIndexedObject<C, "id">[CI];
  logger?: Logger;

  constructor(connection: ConnectionClient<A, C, CI>) {
    this.connection = connection;
    this.connector =
      connection.config.morph.𝙢_.connectors[connection.connectorId];
    this.logger = connection.logger;
  }

  create = async (params: {
    model: GetWebhookModels<
      ArrayToIndexedObject<C, "id">[CI]["webhookOperations"]
    >;
    trigger: EventTrigger;
    redirectUrl?: string;
  }): Promise<EitherDataOrError<WebhookData>> => {
    this.logger?.debug("Creating webhook", { params });

    const c = this.connector;
    console.log("[WebhookClient.create] Starting webhook creation", {
      params,
      c,
    });

    const webhookSubscriptionOperations =
      this.connector.webhookOperations?.subscription;
    const webhookGlobalOperations = this.connector.webhookOperations?.global;
    console.log("[WebhookClient.create] Available operations", {
      hasSubscriptionOps: !!webhookSubscriptionOperations,
      hasGlobalOps: !!webhookGlobalOperations,
    });

    let webhookResponse:
      | {
          type: "subscription" | "global";
          identifierKey: string;
          meta?: Record<string, string>;
        }
      | undefined;

    // First, try to subscribe to the event in priority
    if (
      webhookSubscriptionOperations?.mapper?.events[params.model] &&
      webhookSubscriptionOperations?.create
    ) {
      console.log(
        "[WebhookClient.create] Attempting subscription webhook creation"
      );
      // To generate
      let url;
      try {
        url = generateHookUrl({
          connectorId: this.connection.connectorId,
          ownerId: this.connection.ownerId,
          model: params.model,
          trigger: params.trigger,
        });
        console.log("[WebhookClient.create] Generated hook URL", { url });
      } catch (error) {
        console.log("[WebhookClient.create] Failed to generate hook URL", {
          error,
        });
        if (error instanceof Error && "code" in error) {
          return {
            error: {
              code: error.code as MorphErrorCode,
              message: error.message,
            },
          };
        }
        return {
          error: {
            code: "MORPH::UNKNOWN_ERROR",
            message:
              "An unknown error occurred: " +
              (error instanceof Error ? error.message : String(error)),
          },
        };
      }

      const { data, error } = await webhookSubscriptionOperations.create.run(
        this.connection,
        { model: params.model, trigger: params.trigger, url }
      );
      console.log(
        "[WebhookClient.create] Subscription webhook creation result",
        { data, error }
      );

      if (error) {
        this.logger?.error(
          "Failed to create webhook with subscription method. Checking global webhook.",
          {
            error,
          }
        );
      } else {
        webhookResponse = {
          type: "subscription",
          // Make the webhook if from the third-aprty app unique accross all connected owner
          identifierKey: `${this.connection.ownerId}::${this.connection.connectorId}::${data.id}`,
          meta: data?.meta,
        };
      }
    }

    if (webhookGlobalOperations?.mapper?.eventRouter) {
      console.log("[WebhookClient.create] Attempting global webhook creation");
      const foundEntry = Object.entries(
        webhookGlobalOperations.mapper.eventRouter
      ).find(([_route, events]) => events[params.model]);

      if (foundEntry && webhookGlobalOperations?.create) {
        const [globalRoute] = foundEntry;
        console.log("[WebhookClient.create] Found matching global route", {
          globalRoute,
        });
        const { data, error } = await webhookGlobalOperations.create.run(
          this.connection,
          { model: params.model, trigger: params.trigger, globalRoute }
        );
        console.log("[WebhookClient.create] Global webhook creation result", {
          data,
          error,
        });

        if (error) {
          this.logger?.error("Failed to create webhook with global method.", {
            error,
          });
        } else {
          webhookResponse = {
            type: "global",
            // Make the webhook if from the third-aprty app unique accross all connected owner
            identifierKey: data.identifierKey,
            meta: data?.meta,
          };
        }
      }
    }

    if (!webhookResponse) {
      console.log(
        "[WebhookClient.create] No webhook response - webhooks not supported"
      );
      this.logger?.error("Webhooks not supported by connector", {
        connectorId: this.connector.id,
      });
      return {
        error: {
          code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
          message: `Webhooks are not supported by connector "${this.connector.id}"`,
        },
      };
    }

    const webhook: AdapterWebhook = {
      connectorId: this.connection.connectorId,
      ownerId: this.connection.ownerId,
      id: generateId("whk"),
      type: webhookResponse.type,
      identifierKey: webhookResponse.identifierKey,
      model: params.model,
      trigger: params.trigger,
      redirectUrl: params.redirectUrl,
      meta: webhookResponse.meta ? JSON.stringify(webhookResponse.meta) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log("[WebhookClient.create] Created webhook object", { webhook });

    try {
      const createdWebhook =
        await this.connection.config.morph.𝙢_.database.adapter.createWebhook(
          webhook
        );
      console.log(
        "[WebhookClient.create] Successfully stored webhook in adapter",
        { createdWebhook }
      );
      this.logger?.debug("Webhook created successfully", {
        webhookId: createdWebhook.id,
      });
      const webhookData: WebhookData = {
        object: "webhook",
        connectorId: webhook.connectorId,
        ownerId: webhook.ownerId,
        id: webhook.id,
        model: webhook.model,
        trigger: webhook.trigger,
        redirectUrl: webhook.redirectUrl,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
      };
      return { data: webhookData };
    } catch (error) {
      this.logger?.error("Failed to store webhook in adapter", { error });
      return {
        error: {
          code: "ADAPTER::WEBHOOK::CREATE_FAILED",
          message: "Failed to store webhook in adapter",
        },
      };
    }
  };
}

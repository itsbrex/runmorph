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
  Settings,
} from "@runmorph/cdk";
import { ResourceModelId } from "@runmorph/resource-models";
import { sign } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { ConnectionClient } from "./Connection";
import { MorphClient } from "./Morph";
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
  C extends ConnectorBundle<
    string,
    Settings,
    Settings,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >,
  CA extends ConnectorBundle<
    string,
    Settings,
    Settings,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
> {
  private morph: MorphClient<CA>;
  connection: ConnectionClient<C, CA>;
  connector: C;
  logger?: Logger;

  constructor(morph: MorphClient<CA>, connection: ConnectionClient<C, CA>) {
    this.morph = morph;
    this.connection = connection;
    const { data: ids, error } = this.connection.getConnectionIds();
    if (error) {
      this.logger?.error("WebhookClient : Failed to get connection ids", {
        error,
      });
      throw "WebhookClient : Failed to get connection ids";
    }
    this.connector = this.morph.m_.connectors[ids.connectorId] as C;
    this.logger = this.morph.m_.logger;
  }

  subscribe = async (params: {
    events: [
      `${GetWebhookModels<C["webhookOperations"]>}::${EventTrigger}`,
      ...`${GetWebhookModels<C["webhookOperations"]>}::${EventTrigger}`[],
    ];
  }): Promise<EitherDataOrError<WebhookData[]>> => {
    this.logger?.debug("Subscribing to webhook", { params });

    const results: WebhookData[] = [];

    for (const event of params.events) {
      const [model, trigger] = event.split("::") as [
        ResourceModelId,
        EventTrigger,
      ];

      const { data: ids, error } = this.connection.getConnectionIds();
      if (error) {
        this.logger?.error("WebhookClient : Failed to get connection ids", {
          error,
        });
        throw "WebhookClient : Failed to get connection ids";
      }

      const webhookSubscriptionOperations =
        this.connector.webhookOperations?.subscription;
      const webhookGlobalOperations = this.connector.webhookOperations?.global;

      let webhookResponse:
        | {
            type: "subscription" | "global";
            identifierKey: string;
            meta?: Record<string, string>;
          }
        | undefined;

      if (
        webhookSubscriptionOperations?.mapper?.events[model] &&
        webhookSubscriptionOperations?.subscribe
      ) {
        let url;
        try {
          url = generateHookUrl({
            connectorId: ids.connectorId,
            ownerId: ids.ownerId,
            model,
            trigger,
          });
        } catch (error) {
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
                (error instanceof Error
                  ? error.message
                  : JSON.stringify(error)),
            },
          };
        }

        const { data, error } =
          await webhookSubscriptionOperations.subscribe.run(this.connection, {
            model,
            trigger,
            url,
          });

        if (error) {
          this.logger?.error(
            "Failed to create webhook with subscription method. Checking global webhook.",
            { error }
          );
        } else {
          webhookResponse = {
            type: "subscription",
            identifierKey: `${data.id}`,
            meta: data?.meta,
          };
        }
      }

      // Try global webhook if subscription failed or wasn't available
      if (!webhookResponse && webhookGlobalOperations?.mapper?.eventRouter) {
        const foundEntry = Object.entries(
          webhookGlobalOperations.mapper.eventRouter
        ).find(([_route, events]) => events[model]);

        if (foundEntry && webhookGlobalOperations?.subscribe) {
          const [globalRoute] = foundEntry;
          const { data, error } = await webhookGlobalOperations.subscribe.run(
            this.connection,
            {
              model,
              trigger,
              globalRoute,
              settings: this.connector.connector.getOptions(),
            }
          );

          if (error) {
            this.logger?.error("Failed to create webhook with global method.", {
              error,
            });
          } else {
            webhookResponse = {
              type: "global",
              identifierKey: data.identifierKey,
              meta: data?.meta,
            };
          }
        }
      }

      if (!webhookResponse) {
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
        connectorId: ids.connectorId,
        ownerId: ids.ownerId,
        type: webhookResponse.type,
        identifierKey: webhookResponse.identifierKey,
        model,
        trigger,
        meta: webhookResponse.meta
          ? JSON.stringify(webhookResponse.meta)
          : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        let createdWebhook: AdapterWebhook;
        const existingWebhook =
          await this.morph.m_.database.adapter.retrieveWebhook({
            connectorId: webhook.connectorId,
            ownerId: webhook.ownerId,
            model,
            trigger,
          });

        if (existingWebhook) {
          createdWebhook = await this.morph.m_.database.adapter.updateWebhook(
            {
              connectorId: existingWebhook.connectorId,
              ownerId: existingWebhook.ownerId,
              model,
              trigger,
            },
            {
              ...webhook,
              updatedAt: new Date(),
            }
          );
        } else {
          createdWebhook =
            await this.morph.m_.database.adapter.createWebhook(webhook);
        }

        results.push({
          object: "webhook",
          connectorId: createdWebhook.connectorId,
          ownerId: createdWebhook.ownerId,
          model: createdWebhook.model,
          trigger: createdWebhook.trigger,
          createdAt: createdWebhook.createdAt,
          updatedAt: createdWebhook.updatedAt,
        });
      } catch (error) {
        this.logger?.error("Failed to store webhook in adapter", {
          error,
          model,
          trigger,
        });
        return {
          error: {
            code: "ADAPTER::WEBHOOK::CREATE_FAILED",
            message: `Failed to store webhook in adapter for ${model}::${trigger}`,
          },
        };
      }
    }

    return { data: results };
  };

  unsubscribe = async (params: {
    events: [
      `${GetWebhookModels<C["webhookOperations"]>}::${EventTrigger}`,
      ...`${GetWebhookModels<C["webhookOperations"]>}::${EventTrigger}`[],
    ];
  }): Promise<EitherDataOrError<void>> => {
    this.logger?.debug("Unsubscribing from webhook", { params });

    for (const event of params.events) {
      const [model, trigger] = event.split("::") as [
        ResourceModelId,
        EventTrigger,
      ];

      const { data: ids, error } = this.connection.getConnectionIds();
      if (error) {
        this.logger?.error("WebhookClient : Failed to get connection ids", {
          error,
        });
        throw "WebhookClient : Failed to get connection ids";
      }

      const existingWebhook =
        await this.morph.m_.database.adapter.retrieveWebhook({
          connectorId: ids.connectorId,
          ownerId: ids.ownerId,
          model,
          trigger,
        });

      if (!existingWebhook) {
        continue; // Skip if webhook doesn't exist
      }

      if (existingWebhook.type === "global") {
        const webhookGlobalOperations =
          this.connector.webhookOperations?.global;
        if (!webhookGlobalOperations?.unsubscribe) {
          return {
            error: {
              code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
              message: `Global webhook unsubscribe not supported for ${model}::${trigger}`,
            },
          };
        }

        const foundEntry = Object.entries(
          webhookGlobalOperations.mapper.eventRouter
        ).find(([_route, events]) => events[model]);

        if (!foundEntry) {
          return {
            error: {
              code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
              message: "Global webhook route not found for model",
            },
          };
        }

        const [globalRoute] = foundEntry;
        const { error } = await webhookGlobalOperations.unsubscribe.run(
          this.connection,
          {
            identifierKey: existingWebhook.identifierKey || "",
            model,
            trigger,
            globalRoute,
            settings: this.connector.connector.getOptions(),
          }
        );

        if (error) {
          return { error };
        }
      }

      try {
        await this.morph.m_.database.adapter.deleteWebhook({
          connectorId: ids.connectorId,
          ownerId: ids.ownerId,
          model,
          trigger,
        });
      } catch (error) {
        this.logger?.error("Failed to delete webhook from adapter", {
          error,
          model,
          trigger,
        });
        return {
          error: {
            code: "ADAPTER::WEBHOOK::DELETE_FAILED",
            message: `Failed to delete webhook from adapter for ${model}::${trigger}`,
          },
        };
      }
    }

    return { data: undefined };
  };
}

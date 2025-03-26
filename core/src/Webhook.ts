import type {
  ConnectorBundle,
  ResourceModelOperations,
  WebhookOperations,
  ResourceEvents,
  EitherDataOrError,
  Logger,
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
import { AdapterWebhook } from "./types";

export function generateHookUrl(
  params: {
    connectorId: string;
    ownerId: string;
    model: string;
    trigger: string;
  },
  baseUrl?: string
): string {
  const hookBaseUrl = baseUrl || process.env.MORPH_HOOK_BASE_URL;
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

  return `${hookBaseUrl}/${params.connectorId}/subscription/${subscriptionToken}`;
}

export class WebhookClient<
  C extends ConnectorBundle<
    string,
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
  >,
  CA extends ConnectorBundle<
    string,
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

  subscribe = async (
    params: {
      events: [
        `${GetWebhookModels<C["webhookOperations"]>}::${EventTrigger}`,
        ...`${GetWebhookModels<C["webhookOperations"]>}::${EventTrigger}`[],
      ];
    },
    options?: { baseUrl: string }
  ): Promise<EitherDataOrError<WebhookData[]>> => {
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

      // Check if webhook already exists
      const existingWebhook =
        await this.morph.m_.database.adapter.retrieveWebhook({
          connectorId: ids.connectorId,
          ownerId: ids.ownerId,
          model,
          trigger,
        });

      if (existingWebhook) {
        // Skip if webhook already exists and add to results
        results.push({
          object: "webhook",
          connectorId: existingWebhook.connectorId,
          ownerId: existingWebhook.ownerId,
          model: existingWebhook.model,
          trigger: existingWebhook.trigger,
          createdAt: existingWebhook.createdAt,
          updatedAt: existingWebhook.updatedAt,
        });
        continue;
      }

      const webhookSubscriptionOperations =
        this.connector.webhookOperations?.subscription;
      const webhookGlobalOperations = this.connector.webhookOperations?.global;

      let webhookResponse:
        | {
            type: "global";
            identifierKey: string;
            metadata?: Partial<Record<string, string>>;
          }
        | {
            type: "subscription";
            identifierKey?: string;
            metadata?: Partial<Record<string, string>>;
          }
        | undefined;

      if (
        webhookSubscriptionOperations?.mapper?.events[model] &&
        webhookSubscriptionOperations?.subscribe
      ) {
        let url;
        try {
          url = generateHookUrl(
            {
              connectorId: ids.connectorId,
              ownerId: ids.ownerId,
              model,
              trigger,
            },
            options?.baseUrl
          );
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
            metadata: data?.metadata || {},
          };
        }
      }

      // Try global webhook if subscription failed or wasn't available
      if (!webhookResponse && webhookGlobalOperations?.mapper?.eventRoutes) {
        const foundEntry = Object.entries(
          webhookGlobalOperations.mapper.eventRoutes
        ).find(([_route, events]) => events[model]);

        if (foundEntry && webhookGlobalOperations?.subscribe) {
          const [route] = foundEntry;
          const { data, error } = await webhookGlobalOperations.subscribe.run(
            this.connection,
            {
              model,
              trigger,
              route,
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
              metadata: data?.metadata && {},
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
        metadata: webhookResponse.metadata
          ? JSON.stringify(webhookResponse.metadata)
          : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const createdWebhook =
          await this.morph.m_.database.adapter.createWebhook(webhook);

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

      if (existingWebhook.type === "subscription") {
        const webhookSubscriptionOperations =
          this.connector.webhookOperations?.subscription;
        if (!webhookSubscriptionOperations?.unsubscribe) {
          return {
            error: {
              code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
              message: `Subscription webhook unsubscribe not supported for ${model}::${trigger}`,
            },
          };
        }

        let metadata = {};
        try {
          if (existingWebhook.metadata) {
            metadata = JSON.parse(existingWebhook.metadata);
          }
        } catch (e) {
          this.logger?.error("Failed to parse webhook metadata", {
            error: e,
            metadata: existingWebhook.metadata,
          });
        }

        const { error } = await webhookSubscriptionOperations.unsubscribe.run(
          this.connection,
          {
            metadata,
            model,
            trigger,
          }
        );

        if (error) {
          return { error };
        }
      } else if (existingWebhook.type === "global") {
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
          webhookGlobalOperations.mapper.eventRoutes
        ).find(([_route, events]) => events[model]);

        if (!foundEntry) {
          return {
            error: {
              code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
              message: "Global webhook route not found for model",
            },
          };
        }
        let metadata = {};
        try {
          if (existingWebhook.metadata) {
            metadata = JSON.parse(existingWebhook.metadata);
          }
        } catch (e) {
          this.logger?.error("Failed to parse webhook metadata", {
            error: e,
            metadata: existingWebhook.metadata,
          });
        }
        const [route] = foundEntry;
        const { error } = await webhookGlobalOperations.unsubscribe.run(
          this.connection,
          {
            identifierKey: existingWebhook.identifierKey || "",
            model,
            trigger,
            route,
            metadata,
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

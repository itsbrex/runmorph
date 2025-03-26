import { EventEmitter } from "events";

import type {
  ConnectorBundle,
  EventTrigger,
  ResourceEvents,
  ResourceModelOperations,
  WebhookOperations,
  RawEventRequest,
  ResourceData,
  EventType,
  Awaitable,
  EitherTypeOrError,
  Settings,
} from "@runmorph/cdk";
import {
  ExtractResponseSchemaFromResourceModel,
  InferredSchemaOutput,
  ResourceModel,
  ResourceModelId,
  resourceModels,
  z,
} from "@runmorph/resource-models";
import { verify } from "jsonwebtoken";

import { ConnectionClient } from "./Connection";
import { MorphClient } from "./Morph";

export type WebhookCallback<
  RTI extends ResourceModelId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CON extends ConnectionClient<any, any>,
  R extends Record<string, z.ZodTypeAny> | undefined,
> = (
  connection: CON,
  event: {
    model: RTI;
    trigger: EventTrigger;
    idempotencyKey: string;
    data: ResourceData<
      ResourceModel<
        RTI,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        R extends undefined ? Record<string, z.ZodTypeAny> : R
      >
    >;
  }
) => Awaitable<
  R extends Record<string, z.ZodTypeAny>
    ? R extends Record<string, never>
      ? void | { processed: boolean; data?: unknown }
      : { processed: boolean; data: InferredSchemaOutput<R> }
    : void | { processed: boolean; data?: unknown }
>;

export class WebhookRegistry<
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instance: WebhookRegistry<any>;
  private eventEmitter: EventEmitter;
  private morph: MorphClient<CA>;
  private constructor(morph: MorphClient<CA>) {
    this.morph = morph;
    this.eventEmitter = new EventEmitter();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getInstance(
    morph: MorphClient<any>,
    tempInstance?: boolean
  ): WebhookRegistry<any> {
    if (!WebhookRegistry.instance) {
      WebhookRegistry.instance = new WebhookRegistry(morph);
    }
    if (tempInstance) {
      return new WebhookRegistry(morph);
    }
    return WebhookRegistry.instance;
  }

  onEvents<
    RTI extends ResourceModelId,
    R extends (typeof resourceModels)[RTI]["responseSchema"] extends undefined
      ? undefined
      : ExtractResponseSchemaFromResourceModel<(typeof resourceModels)[RTI]>,
  >(
    eventName: EventType<RTI> | EventType<RTI>[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: WebhookCallback<RTI, ConnectionClient<any, any>, R>
  ): void {
    if (typeof eventName === "string") {
      this.eventEmitter.on(eventName, callback);
    } else if (Array.isArray(eventName)) {
      eventName.forEach((name) => {
        this.eventEmitter.on(name, callback);
      });
    }
  }

  /*
  removeEventListeners(eventName: string): void {
    this.eventEmitter.removeAllListeners(eventName);
  }
 */

  // TODO Type to fix
  private subscriptionHandler?: (params: {
    webhookToken: string;
    request: RawEventRequest;
  }) => void;
  private globalHandler?: (params: {
    globalRoute: string;
    request: RawEventRequest;
  }) => void;

  requestHandler = async <I extends CA[number]["id"]>(
    params:
      | {
          webhookType: "subscription";
          webhookToken: string;
          connectorId: I;
          request: RawEventRequest;
          // handler: (request: RawEventRequest) => Awaitable<void>;
        }
      | {
          webhookType: "global";
          route: string;
          connectorId: I;
          request: RawEventRequest;
          //  handler: (request: RawEventRequest) => Awaitable<void>;
        }
  ): Promise<EitherTypeOrError<{ processed: boolean; data?: unknown }>> => {
    const { connectorId, webhookType, request } = params;

    const connectors = this.morph.m_.connectors;

    let connector;
    if (Object.keys(connectors).includes(connectorId)) {
      connector = connectors[connectorId];
    } else {
      throw "Connector not found : " + connectorId;
    }

    const resourceModelOperations = connector.resourceModelOperations;

    const results = [];

    if (webhookType === "subscription") {
      // TO CONTINUE
      // TYEP IS STCUK TO GLOBAL →  CHECK API
      const { webhookToken } = params;
      const subscriptonMapper =
        connector.webhookOperations.subscription?.mapper;
      if (!subscriptonMapper) {
        return {
          error: {
            code: "MORPH::BAD_CONFIGURATION",
            message:
              "Webhook token missing required fields: ownerId, model, and trigger must be present",
          },
        };
      }

      const JWT_SECRET = process.env.MORPH_ENCRYPTION_KEY;
      if (!JWT_SECRET) {
        return {
          error: {
            code: "MORPH::BAD_CONFIGURATION",
            message: "MORPH_ENCRYPTION_KEY missing.",
          },
        };
      }

      const { ownerId, model, trigger } = verify(webhookToken, JWT_SECRET) as {
        ownerId: string;
        model: ResourceModelId;
        trigger: EventTrigger;
      };

      if (!ownerId || !model || !trigger) {
        return {
          error: {
            code: "MORPH::BAD_CONFIGURATION",
            message:
              "Webhook token missing required fields: ownerId, model, and trigger must be present",
          },
        };
      }

      const webhookAdapter =
        await this.morph.m_.database.adapter.retrieveWebhook({
          connectorId,
          ownerId,
          model,
          trigger,
        });
      if (!webhookAdapter) {
        return {
          error: {
            code: "MORPH::BAD_CONFIGURATION",
            message:
              "Webhook token missing required fields: ownerId, model, and trigger must be present",
          },
        };
      }

      let metadata = {}; // Preserve existing metadata if JSON parsing fails
      try {
        if (webhookAdapter.metadata) {
          metadata = JSON.parse(webhookAdapter.metadata);
        }
      } catch (e) {
        // Do nothing, keeping metadata unchanged
      }

      const { error, data: mappedEvent } = await subscriptonMapper.run(
        request,
        {
          connection: this.morph.connections({ connectorId, ownerId }),
          model,
          trigger,
          metadata,
        }
      );
      if (error) {
        return { error };
      }

      const idempotencyKey = mappedEvent.idempotencyKey;
      const resourceMapper = subscriptonMapper.getMapper(model);
      if (!resourceMapper) {
        return {
          error: {
            code: "MORPH::BAD_CONFIGURATION",
            message: `No resource mapper found for model: ${model}`,
          },
        };
      }

      let mappedResource;
      if ("rawResource" in mappedEvent) {
        mappedResource = resourceMapper.read(
          mappedEvent.rawResource
        ) as ResourceData<ResourceModel<typeof model, any, any>>;
      } else if ("resourceRef" in mappedEvent) {
        const resourceId = mappedEvent.resourceRef.id;

        const { data, error } = await this.morph
          .connections({ connectorId, ownerId })
          .resources(model)
          .retrieve(resourceId);

        if (error) {
          return { error };
        }

        mappedResource = data;
      }

      if (!mappedResource) {
        return {
          error: {
            code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND",
            message:
              "Could retrieve the resource related to this webhook event.",
          },
        };
      }

      if (resourceMapper.expectResponse()) {
        const processedEvent = await this.porcesseEvent({
          connectorId,
          ownerId,
          model,
          trigger,
          mappedResource: mappedResource,
          idempotencyKey: mappedEvent.idempotencyKey,
        });

        if (
          processedEvent.processed &&
          processedEvent.data &&
          !processedEvent.error
        ) {
          const mappedEventResponse = resourceMapper.writeResponse(
            processedEvent.data
          );

          return { data: mappedEventResponse, processed: true };
        }

        return processedEvent;
      }

      const response = await this.porcesseEvent({
        connectorId,
        ownerId,
        model,
        trigger,
        mappedResource,
        idempotencyKey,
      });
      results.push(response);
    } else if (webhookType === "global") {
      const { route } = params;

      const globalMapper =
        connector.webhookOperations[webhookType as "global"]?.mapper;
      if (!globalMapper) {
        return {
          error: {
            code: "MORPH::BAD_CONFIGURATION",
            message: "Connector has no global mapper: " + connectorId,
          },
        };
      }
      const { data: identifiedEvents } = await globalMapper.runIdentifier(
        request,
        { route }
      );
      // Use Promise.all with map to properly handle async operations

      results.push(
        ...(await Promise.all(
          (identifiedEvents || []).map(async (identifiedEvent) => {
            const {
              model,
              trigger,
              identifierKey,
              request: editedRequest,
            } = identifiedEvent;
            const webhookAdapter =
              await this.morph.m_.database.adapter.retrieveWebhookByIdentifierKey(
                {
                  connectorId,
                  model,
                  trigger,
                  identifierKey,
                }
              );
            if (!webhookAdapter) {
              return [];
            }

            const ownerId = webhookAdapter.ownerId;

            let metadata = {}; // Preserve existing metadata if JSON parsing fails
            try {
              if (webhookAdapter.metadata) {
                metadata = JSON.parse(webhookAdapter.metadata);
              }
            } catch (e) {
              // Do nothing, keeping metadata unchanged
            }
            const { error, data: mappedEvent } = await globalMapper.run(
              editedRequest ? editedRequest : request,
              {
                connection: this.morph.connections({ connectorId, ownerId }),
                model,
                trigger,
                metadata,
              }
            );

            if (error) {
              return { error };
            }

            if (mappedEvent) {
              mappedEvent;
            }

            let mappedResource;
            const idempotencyKey = mappedEvent.idempotencyKey;
            const resourceMapper = globalMapper.getMapper(route, model);

            if (!resourceMapper) {
              return {
                error: {
                  code: "CONNECTOR::WEBHOOK::MAPPER_FAILED",
                  message: `Could not find mapper for route ${route} and model ${model}`,
                },
              };
            }

            if ("rawResource" in mappedEvent) {
              mappedResource = resourceMapper.read(
                mappedEvent.rawResource
              ) as ResourceData<
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ResourceModel<keyof typeof resourceModelOperations, any, any>
              >;
            } else if ("resourceRef" in mappedEvent) {
              const resourceId = mappedEvent.resourceRef.id;

              const { data, error } = await this.morph
                .connections({ connectorId, ownerId })
                .resources(model)
                .retrieve(resourceId);

              if (error) {
                return { error };
              }

              mappedResource = data;
            }

            if (!mappedResource) {
              return {
                error: {
                  code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND",
                  message:
                    "Could retrieve the resource related to this webhook event.",
                },
              };
            }

            if (resourceMapper.expectResponse()) {
              const processedEvent = await this.porcesseEvent({
                connectorId,
                ownerId,
                model,
                trigger,
                mappedResource: mappedResource,
                idempotencyKey: mappedEvent.idempotencyKey,
              });

              if (
                processedEvent.processed &&
                processedEvent.data &&
                !processedEvent.error
              ) {
                const mappedEventResponse = resourceMapper.writeResponse(
                  processedEvent.data
                );

                return { data: mappedEventResponse, processed: true };
              }

              return processedEvent;
            }

            return this.porcesseEvent({
              connectorId,
              ownerId,
              model,
              trigger,
              mappedResource,
              idempotencyKey,
            });
          })
        ))
      );
    } else {
      return {
        error: {
          code: "MORPH::UNKNOWN_ERROR",
          message: "Webhook type not supported : " + webhookType,
        },
      };
    }

    const processed = results.reduce((acc, result) => {
      if ("error" in result) return false;
      if (Array.isArray(result)) return false; // Handle the case when result is an array
      return acc && (result.processed ?? false);
    }, true);

    const data = results.reduce<unknown>((acc, result) => {
      if (acc !== undefined) return acc;
      if ("error" in result) return undefined;
      if (Array.isArray(result)) return undefined; // Handle the case when result is an array
      return result.processed ? result.data : undefined;
    }, undefined);

    return { processed, data };
  };

  private async porcesseEvent<
    RTI extends ResourceModelId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    RD extends ResourceData<ResourceModel<RTI, any, any>>,
  >(params: {
    connectorId: CA[number]["id"];
    ownerId: string;
    model: RTI;
    trigger: EventTrigger;
    mappedResource: RD;
    idempotencyKey: string;
  }): Promise<EitherTypeOrError<{ processed: boolean; data?: unknown }>> {
    const {
      ownerId,
      model,
      trigger,
      mappedResource,
      connectorId,
      idempotencyKey,
    } = params;
    if (ownerId && model && trigger && mappedResource) {
      const connection = this.morph.connections({
        connectorId,
        ownerId: ownerId,
      });
      const eventPayload = {
        model,
        trigger,
        data: mappedResource,
        idempotencyKey,
      };
      const eventType: EventType<typeof model> = `${model}::${trigger}`;
      // Get both specific and wildcard listeners
      const specificListeners = this.eventEmitter.listeners(
        eventType
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as WebhookCallback<typeof model, typeof connection, any>[];
      const wildcardListeners = this.eventEmitter.listeners(
        "*"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as WebhookCallback<typeof model, typeof connection, any>[];

      try {
        // Execute all listeners and collect results
        const results = await Promise.all([
          ...specificListeners.map((listener) =>
            listener(connection, eventPayload)
          ),
          ...wildcardListeners.map((listener) =>
            listener(connection, eventPayload)
          ),
        ]);

        let allProcessed = true;
        // Check if any listener returned data

        for (const result of results) {
          if (result) {
            const { processed, data } = result;
            if (data) {
              return { processed, data: data };
            }
            allProcessed = !processed ? false : allProcessed;
          }
        }

        return { processed: allProcessed };
      } catch (error) {
        return {
          error: {
            code: "CONNECTOR::UNKNOWN_ERROR",
            message: `Error calling listner functions (${specificListeners.length + wildcardListeners.length}): ${JSON.stringify(error)}`,
          },
        };
      }
    } else {
      return {
        error: {
          code: "CONNECTOR::UNKNOWN_ERROR",
          message: "Missing required event data.",
        },
      };
    }
  }
}

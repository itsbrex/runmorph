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
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
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
  static getInstance(morph: MorphClient<any>): WebhookRegistry<any> {
    if (!WebhookRegistry.instance) {
      WebhookRegistry.instance = new WebhookRegistry(morph);
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
          globalRoute: string;
          connectorId: I;
          request: RawEventRequest;
          //  handler: (request: RawEventRequest) => Awaitable<void>;
        }
  ): Promise<EitherTypeOrError<{ processed: boolean; data?: unknown }>> => {
    const { connectorId, webhookType, request } = params;

    const connectors = this.morph.m_.connectors;
    console.log("Available connectors:", Object.keys(connectors));

    let connector;
    if (Object.keys(connectors).includes(connectorId)) {
      connector = connectors[connectorId];
      console.log("Found connector:", connectorId);
    } else {
      throw "Connector not found : " + connectorId;
    }

    const resourceModelOperations = connector.resourceModelOperations;

    console.log("webhookType:", webhookType);
    console.log("resourceModelOperations:", resourceModelOperations);
    const results = [];

    if (webhookType === "subscription") {
      /*const { webhookToken } = params;
      const subscriptonMapper = webhookOperations.subscription?.mapper;
      if (!subscriptonMapper) {
        throw "Connector has no subscription mapper : " + connectorId;
      }

      const mappedSubEvent = await subscriptonMapper.run(request);
      const idempotencyKey = mappedSubEvent.idempotencyKey;
      const model = mappedSubEvent.mapper
        .resourceModelId as keyof typeof resourceModelOperations;
      const trigger = mappedSubEvent.trigger;

      if ("rawResource" in mappedSubEvent) {
        const mappedResource = mappedSubEvent.mapper.read(
          mappedSubEvent.rawResource
        ) as ResourceData<
          ResourceModel<keyof typeof resourceModelOperations, any>
        >;
      } else if ("resourceRef" in mappedSubEvent) {

      }

      const response = await this.porcesseEvent({
        connectorId,
        ownerId: "FOOO",
        model,
        trigger,
        mappedResource:,
        idempotencyKey,
      });
      results.push(response);*/
    } else if (webhookType === "global") {
      const { globalRoute } = params;
      console.log("connector.webhookOperations", connector.webhookOperations);
      const globalMapper =
        connector.webhookOperations[webhookType as "global"]?.mapper;
      console.log("globalMapper", globalMapper);
      if (!globalMapper) {
        throw "Connector has no global mapper : " + connectorId;
      }
      const { error, data: mappedEvent } = await globalMapper.run({
        request,
        globalRoute,
        connector: connector.connector,
      });

      if (error) {
        return { error };
      }
      console.log("mappedEvent", mappedEvent);
      // Handle case where mappedEvent can be single event or array of events
      const events = Array.isArray(mappedEvent) ? mappedEvent : [mappedEvent];
      console.log("events", events);
      // Replace forEach with Promise.all + map
      const eventPromises = events.map(async (event) => {
        const model = event.mapper
          .resourceModelId as keyof typeof resourceModelOperations;
        const trigger = event.trigger;
        const identifierKey = event.identifierKey;

        const webhookAdapter =
          await this.morph.m_.database.adapter.retrieveWebhookByIdentifierKey(
            identifierKey
          );

        console.log("identifierKey", identifierKey, webhookAdapter);

        if (!webhookAdapter) {
          throw "Couldn't found related webhook subscriton";
        }

        let mappedResource;
        const ownerId = webhookAdapter.ownerId;
        if ("rawResource" in event) {
          mappedResource = event.mapper.read(event.rawResource) as ResourceData<
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ResourceModel<keyof typeof resourceModelOperations, any, any>
          >;
        } else if ("resourceRef" in event) {
          const resourceId = event.resourceRef.id;

          const { data, error } = await this.morph
            .connections({ connectorId, ownerId })
            .resources(model)
            .retrieve(resourceId);

          if (error) {
            return { error };
          }

          mappedResource = data;
        }

        console.log("mappedResource", mappedResource);

        if (!mappedResource) {
          return {
            error: {
              code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND",
              message:
                "Could retrieve the resource related to this webhook event.",
            },
          };
        }

        console.log("Expect repsonse", event.mapper.expectResponse());
        if (event.mapper.expectResponse()) {
          const processedEvent = await this.porcesseEvent({
            connectorId,
            ownerId,
            model,
            trigger,
            mappedResource: mappedResource,
            idempotencyKey: event.idempotencyKey,
          });
          console.log("processedEvent", processedEvent);

          if (
            processedEvent.processed &&
            processedEvent.data &&
            !processedEvent.error
          ) {
            const mappedEventResponse = event.mapper.writeResponse(
              processedEvent.data
            );

            console.log("mappedEventResponse", mappedEventResponse);

            return { data: mappedEventResponse, processed: true };
          }

          return processedEvent;
        }

        return this.porcesseEvent({
          connectorId,
          ownerId,
          model,
          trigger,
          mappedResource: mappedResource,
          idempotencyKey: event.idempotencyKey,
        });
      });

      results.push(...(await Promise.all(eventPromises)));
    } else {
      return {
        error: {
          code: "MORPH::UNKNOWN_ERROR",
          message: "Webhook type not supporteed : " + webhookType,
        },
      };
    }

    const processed = results.reduce((acc, result) => {
      if ("error" in result) return false;
      return acc && (result.processed ?? false);
    }, true);

    const data = results.reduce<unknown>((acc, result) => {
      if (acc !== undefined) return acc;
      if ("error" in result) return undefined;
      return result.processed ? result.data : undefined;
    }, undefined);

    console.log("RESULTS", results);
    console.log("RESULTS", processed);
    console.log("RESULTS", data);

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
        console.log("results", results);
        for (const result of results) {
          if (result) {
            const { processed, data } = result;
            if (data) {
              return { processed, data: data };
            }
            allProcessed = !processed ? false : allProcessed;
          }
        }
        console.log("allProcessed", allProcessed);

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
      console.log("Missing required event data:", {
        ownerId,
        model,
        trigger,
        mappedResource,
      });
      return {
        error: {
          code: "CONNECTOR::UNKNOWN_ERROR",
          message: "Missing required event data.",
        },
      };
    }
  }
}

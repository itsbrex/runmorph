import {
  SubscribeToGlobalEvent,
  SubscribeToGlobalEventParams,
} from "@runmorph/cdk";

import HubSpotGlobalEventMapper from "./mapper";

const hubspotObjectProperties = {
  genericContact: {
    type: "contact",
    properties: ["firstname", "lastname", "email", "phone"],
  },
  genericCompany: {
    type: "company",
    properties: [
      "name",
      "domain",
      "phone",
      "address",
      "city",
      "state",
      "country",
    ],
  },
  crmOpportunity: {
    type: "deal",
    properties: ["dealname", "amount", "pipeline", "dealstage", "closedate"],
  },
};

const hubspotEventType = {
  created: "creation",
  updated: "propertyChange",
  deleted: "deletion",
} as const;

type HubspotModel = keyof typeof hubspotObjectProperties;
type HubspotEvent = keyof typeof hubspotEventType;

async function subscribeToEvent(
  appId: number,
  hapikey: string,
  body: any
): Promise<Response> {
  const response = await fetch(
    `https://api.hubapi.com/webhooks/v1/${appId}/subscriptions?hapikey=${hapikey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  return response;
}

export default new SubscribeToGlobalEvent({
  globalEventMapper: HubSpotGlobalEventMapper,
  handler: async (connection, { model, trigger, globalRoute }) => {
    // Type guard to ensure model is HubspotModel
    if (!(model in hubspotObjectProperties)) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
          message: `Model '${model}' not supported for HubSpot global webhook`,
        },
      };
    }

    const object = hubspotObjectProperties[model as HubspotModel];
    const eventType = hubspotEventType[trigger as HubspotEvent];
    // TODO : add in conenction meta data
    const portalId = 43833156;
    // TODO : add in connector custom config
    const appId = 4591533;
    const hapikey = "ebe982b9-5fce-4478-8140-f5f5b3f4d849";

    // TODO : fix type inference
    if (globalRoute === "main") {
      try {
        let responses: any[] = [];
        if (eventType === "propertyChange") {
          responses = await Promise.all(
            object.properties.map((p) => {
              const body = {
                enabled: true,
                subscriptionDetails: {
                  subscriptionType: `${object.type}.${eventType}`,
                  propertyName: p,
                },
              };
              return subscribeToEvent(appId, hapikey, body);
            })
          );
        } else {
          const body = {
            enabled: true,
            subscriptionDetails: {
              subscriptionType: `${object.type}.${eventType}`,
            },
          };
          const response = await subscribeToEvent(appId, hapikey, body);
          responses = [response];
        }

        responses.forEach(async (response) => {
          const responseData = await response.json();
          console.log("responseData", responseData);
          if (!response.ok) {
            if (
              responseData.category === "VALIDATION_ERROR" &&
              responseData.subCategory ===
                "SubscriptionErrors.DUPLICATE_SUBSCRIPTIONS"
            ) {
              // This is expected behavior for duplicate subscriptions, continue
            } else {
              return {
                error: {
                  code: "CONNECTOR::UNKNOWN_ERROR",
                  message: JSON.stringify(response),
                },
              };
            }
          }
        });
      } catch (subscriptionError) {
        return {
          error: {
            code: "CONNECTOR::UNKNOWN_ERROR",
            message: JSON.stringify(subscriptionError),
          },
        };
      }

      return {
        identifierKey: `${appId}::${portalId}::${globalRoute}::${model}::${trigger}`,
      };
    } else {
      // TODO : if route infered proeperly, this shouldn't be necessary
      return {
        error: {
          code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
          message: `The global webhook route '${globalRoute}' does not exist on the HubSpot connector.`,
        },
      };
    }
  },
});

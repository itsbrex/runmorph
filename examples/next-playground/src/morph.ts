import HubSpotConnector from "@runmorph/connector-hubspot";
import { MorphClient, type Adapter } from "@runmorph/core";
import { NextMorph } from "@runmorph/framework-next";

// Conditional import based on environment
const getAdapter = async (): Promise<Adapter> => {
  if (process.env.NODE_ENV === "development") {
    const { LocalAdapter } = await import("@runmorph/adapter-local");
    return LocalAdapter();
  }
  const { MemoryAdapter } = await import("@runmorph/adapter-memory");
  return MemoryAdapter();
};

const hubspot = HubSpotConnector({
  clientId: process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_ID,
  clientSecret: process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_SECRET,
});

const initializeMorph = async () => {
  const adapter = await getAdapter();

  return NextMorph({
    connectors: [hubspot],
    database: { adapter },
    logger: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      newTracer: function () {
        return this;
      },
      closeTracer: function () {
        return this;
      },
    },
  });
};

const { morph, handlers } = await initializeMorph();

morph
  .webhooks()
  .onEvents(
    "genericContact::updated",
    async (connection, { model, trigger, data, idempotencyKey }) => {
      console.log("ON_EVENT_CALLBACK", model, trigger, data, idempotencyKey);

      return { processed: true };
    }
  );

morph.webhooks().onEvents("*", async (connection, { model, trigger, data }) => {
  // console.log("SECOND_CALLBACK", model, trigger, data);
});

export { morph, handlers };
export type morph = typeof morph;

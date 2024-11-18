import { MemoryAdapter } from "@runmorph/adapter-memory";
import HubSpotConnector from "@runmorph/connector-hubspot";
import { NextMorph } from "@runmorph/framework-next";

const { morph, handlers } = NextMorph({
  connectors: [
    HubSpotConnector({
      clientId: process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_ID,
      clientSecret: process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_SECRET,
    }),
  ],
  database: { adapter: MemoryAdapter() },
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

export { morph, handlers };
export type morph = typeof morph;

/**
 * WARNING
 * To view your connectors in the playground – make sure to add them as well in ./connector-listing.ts
 **/

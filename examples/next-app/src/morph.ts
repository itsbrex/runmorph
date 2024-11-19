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
});

export { morph, handlers };
export type morph = typeof morph;

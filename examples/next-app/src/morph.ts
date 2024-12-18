import { MemoryAdapter } from "@runmorph/adapter-memory";
import HubSpotConnector from "@runmorph/connector-hubspot";
import { NextMorph } from "@runmorph/framework-next";

// Validate required environment variables
if (!process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_ID) {
  throw new Error(
    "Missing MORPH_CONNECTOR_HUBSPOT_CLIENT_ID environment variable"
  );
}
if (!process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_SECRET) {
  throw new Error(
    "Missing MORPH_CONNECTOR_HUBSPOT_CLIENT_SECRET environment variable"
  );
}
if (!process.env.MORPH_CONNECTOR_HUBSPOT_APP_ID) {
  throw new Error(
    "Missing MORPH_CONNECTOR_HUBSPOT_APP_ID environment variable"
  );
}
if (!process.env.MORPH_CONNECTOR_HUBSPOT_DEV_API_KEY) {
  throw new Error(
    "Missing MORPH_CONNECTOR_HUBSPOT_DEV_API_KEY environment variable"
  );
}

const { morph, handlers } = NextMorph({
  connectors: [
    HubSpotConnector({
      clientId: process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_ID,
      clientSecret: process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_SECRET,
      appId: process.env.MORPH_CONNECTOR_HUBSPOT_APP_ID,
      hapikey: process.env.MORPH_CONNECTOR_HUBSPOT_DEV_API_KEY,
    }),
  ],
  database: { adapter: MemoryAdapter() },
});

export { morph, handlers };
export type morph = typeof morph;

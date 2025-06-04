import { Morph } from "@runmorph/core";
import { MemoryAdapter } from "@runmorph/adapter-memory";
import HubSpotConnector from "@runmorph/connector-hubspot";
import SalesforceConnector from "@runmorph/connector-salesforce";

// create morph instance
const morph = Morph({
  connectors: [
    HubSpotConnector({
      clientId: "xxxx",
      clientSecret: "xxxx",
      appId: "xxxx",
      hapikey: "xxxx",
    }),
    SalesforceConnector({
      clientId: "xxxx",
      clientSecret: "xxxx",
    }),
  ],
  database: {
    adapter: MemoryAdapter(),
  },
});

// Playground
async function playground() {
  try {
    // Create a connection instance
    const connection = morph.connections({
      connectorId: "hubspot",
      ownerId: "user-123",
    });

    // Create the connection with desired resource operations scope
    await connection.create({
      operations: ["genericCompany::retrieve"],
    });

    const { data: authorizationData } = await connection.authorize();

    // url to allow the user to auhtorize the connection
    const { authorizationUrl } = authorizationData!;

    // new resource instance for a given connection
    const contacts = connection.resources("genericContact");

    const { data, error } = await contacts.retrieve("foo", {
      fields: ["firstName"],
    });

    if (error) return error;

    data.fields.firstName;

    // make auhtorized API call
    await connection.proxy({
      method: "GET",
      path: `/crm/v3/objects/contacts/foo`,
    });
  } catch (error) {
    console.error("Error in playground:", error);
  }
}

// Execute the playground
void playground();

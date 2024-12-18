import { Morph } from "./../index";
import testAdapter from "./adapater.test";
import { connectorBundleTest, connectorBundleTest2 } from "./connector.test";

const morph = Morph({
  connectors: [
    connectorBundleTest({
      clientId: "foo",
      clientSecret: "bar",
    }),
    connectorBundleTest2({
      clientId: "foo",
      clientSecret: "bar",
    }),
  ],
  database: {
    adapter: testAdapter,
  },
});

async function main() {
  // Initialize Morph instance

  try {
    let response;

    /**
     * CALLBACKS
     */

    // Connections callback handler  ✅
    morph.callbacks("oauth").handle({
      code: "foo",
      state: "bar",
    });

    // Connections callback handler with invalid input ❌
    // @ts-expect-error
    morph.callbacks("oauth").handle({});

    /**
     * CONNECTION
     */

    // Connection instance with available conenctor  ✅
    const connectionSessionOk = morph.connections({ sessionToken: "foo" });

    // Connection instance with available conenctor  ✅
    const connectionOk = morph.connections({
      connectorId: "test-2",
      ownerId: "foo",
    });

    connectionOk.create({
      operations: ["crmOpportunity::create"],
    });

    // Getting resource model ID only availabel in test-2 ✅
    connectionOk.resources("crmOpportunity");

    // Connection instance with missing conenctor  ✅
    const connectionKo = morph.connections({
      // @ts-expect-error
      connectorId: "soem-fake-connector-id",
      ownerId: "foo",
    });

    // isConnector with available conenctor id  ✅
    connectionSessionOk.isConnector("test", "test-2");

    // isConnector with missing conenctor id  ❌
    // @ts-expect-error
    connectionSessionOk.isConnector("fake-connector-id");
    // @ts-expect-error
    connectionSessionOk.isConnector("test", "fake-connector-id");

    // isOwner with valid input  ✅
    connectionSessionOk.isOwner("foo");

    // Create connection with valid operation ✅
    response = await connectionSessionOk.create({
      operations: ["genericContact::create", "genericContact::retrieve"],
    });

    // Create connection with invalid operation ❌
    response = await connectionSessionOk.create({
      // @ts-expect-error
      operations: ["missingModel::create"],
    });

    // Create connection with invalid operation ❌
    response = await connectionSessionOk.create({
      // @ts-expect-error
      operations: ["genericContact::invalidOperation"],
    });

    const test2Connection = connectionSessionOk.isConnector("test-2");
    if (test2Connection) {
      test2Connection.create({
        operations: ["crmOpportunity::create"],
      });
    }

    // Retrieve connection with valid connector ✅
    response = await connectionSessionOk.retrieve();
    // Update connection with valid operation ✅
    response = await connectionSessionOk.update({
      operations: ["genericContact::create", "genericContact::retrieve"],
    });

    // Update connection with invalid operation ❌
    response = await connectionSessionOk.update({
      // @ts-expect-error
      operations: ["missingModel::create"],
    });

    // Update connection with invalid operation ❌
    response = await connectionSessionOk.update({
      // @ts-expect-error
      operations: ["genericContact::invalidOperation"],
    });

    // UpdateOrCreate connection with valid operation ✅
    response = await connectionSessionOk.updateOrCreate({
      operations: ["genericContact::create", "genericContact::retrieve"],
    });

    // UpdateOrCreate connection with invalid operation ❌
    response = await connectionSessionOk.updateOrCreate({
      // @ts-expect-error
      operations: ["missingModel::create"],
    });

    // UpdateOrCreate connection with invalid operation ❌
    response = await connectionSessionOk.updateOrCreate({
      // @ts-expect-error
      operations: ["genericContact::invalidOperation"],
    });

    // Delete connection with valid connector ✅
    response = await connectionSessionOk.delete();

    // Valide auhtorization ✅ TODO refactor – settings should be connector specific 🔴
    response = await connectionSessionOk.authorize({
      redirectUrl: "url",
      scopes: ["foo"],
      settings: {
        foo: "bar",
      },
    });

    /**
     * RESOURCES
     */

    // Retrieve availabel model ✅
    response = await connectionSessionOk
      .resources("genericContact")
      .retrieve("foo", {
        fields: ["firstName", "email", "lastName"],
      });

    // Retrieve availabel mode, with missing field ❌
    response = await connectionSessionOk
      .resources("genericContact")
      .retrieve("foo", {
        // @ts-expect-error
        fields: ["someFakeField"],
      });

    // Retrieve missing model ❌
    response = await connectionSessionOk
      // @ts-expect-error
      .resources("someFakeModel");

    // Resource not present on both connector ❌
    response = await connectionSessionOk
      // @ts-expect-error
      .resources("crmOpportunity");

    // List available model ✅
    response = await connectionSessionOk.resources("genericContact").list({
      limit: 10,
    });

    // Create with valid fields ✅
    response = await connectionSessionOk.resources("genericContact").create({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "123456789",
    });

    // Create with invalid fields ❌
    response = await connectionSessionOk.resources("genericContact").create({
      // @ts-expect-error
      invalidField: "John",
    });

    // Update with valid fields ✅
    response = await connectionSessionOk
      .resources("genericContact")
      .update("contact_id", {
        firstName: "John",
        lastName: "Doe",
      });

    // Update with invalid fields ❌
    response = await connectionSessionOk
      .resources("genericContact")
      .update("contact_id", {
        // @ts-expect-error
        invalidField: "value",
      });

    // Delete with valid ID ✅
    response = await connectionSessionOk
      .resources("genericContact")
      .delete("contact_id");

    /**
     * PROXY
     */
    // Proxy with valid params ✅
    response = await connectionSessionOk.proxy({
      method: "POST",
      path: "/some/api/path",
      data: {
        foo: "bar",
      },
      headers: {
        foo: "bar",
      },
      query: { foo: { bar: "baz" } },
    });

    // Proxy with missing required path ❌
    // @ts-expect-error
    response = await connectionSessionOk.proxy({
      method: "GET",
    });

    // Proxy with invalid input ❌
    response = await connectionSessionOk.proxy({
      // @ts-expect-error
      method: "INVALID",
      // @ts-expect-error
      path: undefined,
      headers: {
        // @ts-expect-error
        foo: { bar: "baz" },
      },
      // @ts-expect-error
      query: true,
    });

    /**
     * WEBHOOK
     */

    // Create webhook with valid params ✅
    response = await connectionSessionOk.webhooks().subscribe({
      events: ["genericContact::created"],
    });

    // Create webhook with invalid parameter ❌
    response = await connectionSessionOk.webhooks().subscribe({
      // @ts-expect-error
      events: ["invalidModel::created"],
    });

    // Create webhook without required parameters ❌
    // @ts-expect-error
    response = await connectionSessionOk.webhooks().subscribe({});

    // Unsubscribe webhook with valid params ✅
    response = await connectionSessionOk.webhooks().unsubscribe({
      events: ["genericContact::created"],
    });

    // Unsubscribe webhook with invalid parameter ❌
    response = await connectionSessionOk.webhooks().unsubscribe({
      // @ts-expect-error
      events: ["invalidModel::created"],
    });

    // Unsubscribe webhook without required parameters ❌
    // @ts-expect-error
    response = await connectionSessionOk.webhooks().unsubscribe({});

    morph
      .webhooks()
      .onEvents(
        "crmOpportunity::updated",
        (connection, { model, trigger, data }) => {
          model === "crmOpportunity";
          // @ts-expect-error
          model === "genericContact";

          trigger === "updated";
          // SHOULD FAILED
          trigger === "created";

          data.fields.name;
          // SHOULD FAILED
          data.fields.missingField;
        }
      );
    morph.webhooks().requestHandler({
      webhookType: "subscription",
      webhookToken: "token",
      connectorId: "test",
      request: {
        url: "foo",
        body: { foo: "bar" },
        headers: { foo: "bar" },
        method: "POST",
        params: { foo: "bar" },
        query: { foo: "bar" },
      },
    });
    morph.webhooks().requestHandler({
      webhookType: "global",
      globalRoute: "main",
      connectorId: "test-2",
      request: {
        url: "foo",
        body: { foo: "bar" },
        headers: { foo: "bar" },
        method: "POST",
        params: { foo: "bar" },
        query: { foo: "bar" },
      },
    });

    morph.webhooks().requestHandler({
      webhookType: "subscription",
      webhookToken: "token",
      // @ts-expect-error
      connectorId: "missingConnectorId",
      handler: async () => {},
    });

    /*
    morph
      .webhooks()
      .handlers("global")
      .processRequest({
        globalRoute: "test",
        request: {
          url: "test",
          method: "POST",
          headers: {},
          body: {},
        },
      });
*/
    /**
     * CONNECTOR
     */

    // Retrieve connector with valid ID ✅
    response = await morph.connectors().retrieve("test-2");
    const connectorData = response.data!;
    connectorData.id === "test-2";

    // Type checking for connector ID
    const connectorId = connectorData.id;
    type validId = typeof connectorId extends "test-2" ? true : false;
    const validId: validId = true;

    type invalidId = typeof connectorId extends "invalid" ? true : false;
    // @ts-expect-error
    const invalidId: invalidId = true;

    // Retrieve connector with invalid ID ❌
    // @ts-expect-error
    const invalidResponse = await morph.connectors().retrieve("invalid-id");

    morph.m_.connectors["test-2"].resourceModelOperations.crmOpportunity;
    morph.m_.connectors["test-2"].resourceModelOperations.genericContact;
    // @ts-expect-error
    morph.m_.connectors["test"].resourceModelOperations.crmOpportunity;
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Run the example
main().catch(console.error);

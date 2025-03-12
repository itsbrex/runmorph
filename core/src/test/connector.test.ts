import {
  Connector,
  List,
  Retrieve,
  Create,
  Update,
  Mapper,
  ConnectorBundle,
  EventMapper,
  SubscribeToGlobalEvent,
  GlobalEventMapper,
  SubscribeToEvent,
  UnsubscribeFromGlobalEvent,
  UnsubscribeFromGlobalEventHandlerResult,
  UnsubscribeFromEvent,
} from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

// Define the test contact model
const testContact = {
  id: "test-contact-123",
  properties: {
    firstname: "Jane",
    lastname: "Smith",
    email: "jane.smith@example.com",
    phone: "555-0123",
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// Define the type for a test contact
export type TestContact = {
  id: string;
  properties: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
};

// Create a mapper for the test contact
const TestContactMapper = new Mapper<
  ResourceModels["genericContact"],
  TestContact
>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    firstName: {
      read: (from) => from("properties.firstname"),
      write: (to) => to("properties.firstname"),
      key: "firstname",
      filter: "firstname",
    },
    lastName: {
      read: (from) => from("properties.lastname"),
      write: (to) => to("properties.lastname"),
      key: "lastname",
      filter: "lastname",
    },
    email: {
      read: (from) => from("properties.email"),
      write: (to) => to("properties.email"),
      key: "email",
      filter: "email",
    },
    phone: {
      read: (from) => from("properties.phone"),
      write: (to) => to("properties.phone"),
      key: "phone",
      filter: "phone",
    },
  },
  createdAt: {
    read: (from) => from("createdAt", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("updatedAt", (v) => new Date(v)),
  },
});

// Define the opportunity type
type TestOpportunity = {
  id: string;
  properties: {
    name: string;
    amount: number;
    stage: string;
    probability: number;
    expectedCloseDate: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
};

// Create mapper for CRM opportunity
const TestOpportunityMapper = new Mapper<
  ResourceModels["crmOpportunity"],
  TestOpportunity
>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    name: {
      read: (from) => from("properties.name"),
      write: (to) => to("properties.name"),
      key: "name",
      filter: "name",
    },
    amount: {
      read: (from) => from("properties.amount"),
      write: (to) => to("properties.amount"),
      key: "amount",
      filter: "amount",
    },

    stage: {
      read: (from) => from("properties.stage", (value) => ({ id: value })),
      write: (to) => to("properties.stage", (value) => value.id),
      key: "stage",
      filter: "stage",
    },
  },
  createdAt: {
    read: (from) => from("createdAt", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("updatedAt", (v) => new Date(v)),
  },
});

// Define the connector with comprehensive settings
const connectorTest = new Connector({
  id: "test",
  name: "Test Connector",
  settings: {
    textSetting: {
      type: "text",
      name: "Text Setting",
      required: true,
      description: "A test text setting",
      default: "default-text",
    },
    numberSetting: {
      type: "number",
      name: "Number Setting",
      required: false,
      description: "A test number setting",
      default: 42,
    },
    selectSetting: {
      type: "select",
      name: "Select Setting",
      required: true,
      description: "A test select setting",
      options: {
        option1: "Option 1",
        option2: "Option 2",
        option3: "Option 3",
      },
      default: "option1",
    },
    multiSelectSetting: {
      type: "multiselect",
      name: "Multi Select Setting",
      required: false,
      description: "A test multiselect setting",
      options: {
        choice1: "Choice 1",
        choice2: "Choice 2",
        choice3: "Choice 3",
      },
      default: ["choice1", "choice2"],
    },
  },
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://test.com/oauth/authorize",
    accessTokenUrl: "https://test.com/oauth/token",
    defaultScopes: ["contacts.read"],
    settings: {
      authTextSetting: {
        type: "text",
        name: "Auth Text Setting",
        required: true,
        description: "Authentication text setting",
      },
      authNumberSetting: {
        type: "number",
        name: "Auth Number Setting",
        required: false,
        description: "Authentication number setting",
        default: 100,
      },
      authSelectSetting: {
        type: "select",
        name: "Auth Select Setting",
        required: true,
        description: "Authentication select setting",
        options: {
          auth1: "Auth Option 1",
          auth2: "Auth Option 2",
          auth3: "Auth Option 3",
        },
      },
      authMultiSelectSetting: {
        type: "multiselect",
        name: "Auth multi-select Setting",
        required: true,
        description: "Authentication select setting",
        options: {
          auth1: "Auth Option 1",
          auth2: "Auth Option 2",
          auth3: "Auth Option 3",
        },
      },
    },
    metadataKeys: ["meta1", "meta2", "meta3"],
  },
  proxy: {
    baseUrl: "https://api.test.com",
  },
});

const connectorTest2 = new Connector({
  id: "test-2",
  name: "Test Connector",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://test.com/oauth/authorize",
    accessTokenUrl: "https://test.com/oauth/token",
    defaultScopes: ["contacts.read"],
  },
  proxy: {
    baseUrl: "https://api.test.com",
  },
});

// Define the list operation
const listContacts = (
  mapper: typeof TestOpportunityMapper | typeof TestContactMapper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any =>
  new List({
    scopes: ["contacts.read"],
    mapper: mapper,
    handler: async (
      _connection,
      { limit: _l, cursor: _c, fields: _f, filters: _fl }
    ) => {
      // Mock implementation for listing contacts
      return {
        data: [testContact], // Return an empty array for simplicity
        next: null,
      };
    },
  });

// Define the retrieve operation
const retrieveContact = (
  mapper: typeof TestOpportunityMapper | typeof TestContactMapper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any =>
  new Retrieve({
    scopes: ["contacts.read"],
    mapper: mapper,
    handler: async (_connection, { id: _i, fields: _f }) => {
      // Mock implementation for retrieving a contact
      return testContact;
    },
  });

// Define the create operation
const createContact = (
  mapper: typeof TestOpportunityMapper | typeof TestContactMapper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any =>
  new Create({
    scopes: ["contacts.write"],
    mapper: mapper,
    handler: async (_connection, { data }) => {
      // Mock implementation for creating a contact
      const retrunedContact = { ...testContact, ...{ propeeties: data } };
      return retrunedContact;
    },
  });

// Define the update operation
const updateContact = (
  mapper: typeof TestOpportunityMapper | typeof TestContactMapper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any =>
  new Update({
    scopes: ["contacts.write"],
    mapper: mapper,
    handler: async (connection, { id: _i, data }) => {
      // Mock implementation for updating a contact
      const retrunedContact = { ...testContact, ...{ propeeties: data } };
      return retrunedContact;
    },
  });

// ... previous code ...

// Define webhook mappers and operations
const TestWebhookGlobalMapper = new GlobalEventMapper({
  eventRoutes: {
    main: {
      crmOpportunity: {
        mapper: TestOpportunityMapper,
        triggers: ["created", "updated"],
      },
    },
  },
  metadataKeys: ["sss"],
  identifier: async ({}) => {
    return {
      model: "crmOpportunity",
      trigger: "created",
      identifierKey: "test::main::crmOpportunity::created",
    };
  },
  handler: async ({}) => {
    return {
      rawResource: {},
      idempotencyKey: "test_event_1",
    };
  },
});

const TestWebhookSubscriptionMapper = new EventMapper({
  events: {
    genericContact: {
      mapper: TestContactMapper,
      triggers: ["created", "updated", "deleted"],
    },
  },
  metadataKeys: ["test"],
  handler: async (_request) => {
    return {
      resourceRef: { id: "foo" },
      idempotencyKey: "test_event_1",
    };
  },
});

const TestWebhookGlobalSubscribe = new SubscribeToGlobalEvent({
  globalEventMapper: TestWebhookGlobalMapper,
  handler: async (connection, params) => {
    return {
      identifierKey: `test::${params.route}::${params.model}::${params.trigger}`,
      metadata: { sss: "ss" },
    };
  },
});

const TestWebhookSubscription = new SubscribeToEvent({
  eventMapper: TestWebhookSubscriptionMapper,
  handler: async (_connection, { model: _m, trigger: _t, url: _u }) => {
    return {
      id: "whk_test",
      metadata: {
        test: "test_secret",
      },
    };
  },
});

const TestWebhookUnsubscribe = new UnsubscribeFromEvent({
  eventMapper: TestWebhookSubscriptionMapper,
  handler: async (_connection, { model: _m, trigger: _t }) => {
    return {};
  },
});

const TestWebhookGlobalUnsubscribe = new UnsubscribeFromGlobalEvent({
  globalEventMapper: TestWebhookGlobalMapper,
  handler: (
    _connection,
    { identifierKey: _ }
  ): UnsubscribeFromGlobalEventHandlerResult => {},
});

const connectorBundleTest = new ConnectorBundle({
  connector: connectorTest,
  resourceModelOperations: {
    genericContact: {
      list: listContacts(TestContactMapper),
      retrieve: retrieveContact(TestContactMapper),
      create: createContact(TestContactMapper),
      update: updateContact(TestContactMapper),
      mapper: TestContactMapper,
    },
  },
  webhookOperations: {
    subscription: {
      // TO REFACTOR
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mapper: TestWebhookSubscriptionMapper as any,
      subscribe: TestWebhookSubscription,
      unsubscribe: TestWebhookUnsubscribe,
    },
  },
}).init;

const connectorBundleTest2 = new ConnectorBundle({
  connector: connectorTest2,
  resourceModelOperations: {
    genericContact: {
      list: listContacts(TestContactMapper),
      retrieve: retrieveContact(TestContactMapper),
      create: createContact(TestContactMapper),
      update: updateContact(TestContactMapper),
      mapper: TestContactMapper,
    },
    crmOpportunity: {
      list: listContacts(TestOpportunityMapper),
      retrieve: retrieveContact(TestOpportunityMapper),
      create: createContact(TestOpportunityMapper),
      update: updateContact(TestOpportunityMapper),
      mapper: TestOpportunityMapper,
    },
  },
  webhookOperations: {
    global: {
      mapper: TestWebhookGlobalMapper,
      subscribe: TestWebhookGlobalSubscribe,
      unsubscribe: TestWebhookGlobalUnsubscribe,
    },
  },
}).init;

export { connectorBundleTest, connectorBundleTest2 };

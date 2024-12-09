import type {
  Adapter,
  AdapterConnection,
  AdapterWebhook,
} from "../types/adapter";

const testAdapter: Adapter = {
  createConnection: async () => ({
    connectorId: "test",
    ownerId: "test",
    status: "active",
    operations: [],
    authorizationType: "none",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  retrieveConnection: async () => null,
  updateConnection: async () => ({
    connectorId: "test",
    ownerId: "test",
    status: "active",
    operations: [],
    authorizationType: "none",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  deleteConnection: async () => {},
  createWebhook: async () => ({
    connectorId: "test",
    ownerId: "test",
    id: "whk_test",
    type: "subscription",
    model: "test",
    trigger: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  retrieveWebhook: async () => null,
  retrieveWebhookByIdentifierKey: async () => null,
  updateWebhook: async () => ({
    connectorId: "test",
    ownerId: "test",
    id: "whk_test",
    type: "subscription",
    model: "test",
    trigger: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  deleteWebhook: async () => {},
};

export default testAdapter;

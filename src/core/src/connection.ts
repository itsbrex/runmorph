import { Adapter, AdapterConnection, Connector } from "./types";
import { MorphClient } from "./client";
import { encryptState } from "./utils/encryption";
import { generateAuthorizationUrl } from "./utils/oauth";

export class Connection<A extends Adapter, C extends Connector[]> {
  private morph: MorphClient<A, C>;
  id: string;
  connectorId: string;
  config: Record<string, string>;
  status: "pending" | "authorized" = "pending";
  authorization: {
    type: "oauth2" | "apiKey";
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  };

  constructor({
    morph,
    adaperConnection,
  }: {
    morph: MorphClient<A, C>;
    adaperConnection: AdapterConnection;
  }) {
    this.morph = morph;
    this.id = adaperConnection.id;
    this.connectorId = adaperConnection.connectorId;
    this.config = {};
    this.authorization = { type: "oauth2" };
  }

  generateAuthorizationUrl(): string | undefined {
    const connector = this.morph.connector.retrieve(this.connectorId);
    if (!connector || connector.authorization.type !== "oauth2") {
      return undefined;
    }

    const authorizationUrl = generateAuthorizationUrl({
      connector,
      connectionId: this.id,
      scopes: ["crm.objects.contacts.read"],
    });

    return authorizationUrl;
  }
}

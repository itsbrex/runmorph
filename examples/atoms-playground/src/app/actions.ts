"use server";

import { Morph } from "@runmorph/cloud";
import type { ConnectorId } from "@/components/connector-select";

const morph = Morph({
  publicKey: process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY!,
  secretKey: process.env.MORPH_SECRET_KEY,
});
export async function createSession({
  ownerId,
  connectorId,
}: {
  ownerId: string;
  connectorId: ConnectorId;
}) {
  return await morph.sessions().create({
    connection: {
      connectorId: connectorId as "hubspot",
      ownerId: ownerId,
      operations: ["genericContact::retrieve"],
    },
  });
}

export async function listContacts(sessionToken: string) {
  return await morph
    .connections({ sessionToken })
    .resources("genericContact")
    .list({
      limit: 3,
    });
}

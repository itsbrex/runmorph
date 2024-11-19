"use server";

import { headers } from "next/headers";

import { ConnectionButton } from "@/components/morph-connection-button";
import ConnectionCard from "@/components/morph-connection-card";
import { ResourceList } from "@/components/morph-resource-list";
import { Badge } from "@/components/ui/badge";
import { morph } from "@/morph";

export default async function Home() {
  // Fake owner id; to be replaced by authenticated user / organization id
  const OWNER_ID = "demo_owner_id";

  // Get the hostname dynamically
  const host = (await headers()).get("host") || "localhost:3000";

  const { data, error } = await morph.sessions().create({
    connection: {
      ownerId: OWNER_ID,
      connectorId: "hubspot",
      operations: ["genericContact::list"],
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const { sessionToken } = data;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="text-center">
        <Badge variant="outline" className="">
          ownerId: {OWNER_ID}
        </Badge>
      </header>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <p className="text-sm text-muted-foreground bg-black/[.05] dark:bg-white/[.06] p-4 rounded-md">
          Make sure to set these environment variables:
          <br />
          <code>MORPH_CALLBACK_BASE_URL=https://{host}/api/morph</code>
          <br />
          <code>NEXT_PUBLIC_MORPH_API_BASE_URL=https://{host}/api/morph</code>
          <br />
          <br />
          And set the OAuth app callback URL in third-party service to:
          <br />
          <code>
            https://{host}/api/morph/callback/{`{connectorId}`}
          </code>
        </p>
        Connection API
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Generate a sessionToken{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              {`morph.sessions().create( ... )`}
            </code>
          </li>
          <li>
            Add a connection button{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              {`<ConnectionButton sessionToken={sessionToken} />`}
            </code>
          </li>
        </ol>
        <ConnectionCard name="HubSpot">
          <ConnectionButton sessionToken={sessionToken} />
        </ConnectionCard>
        Resource API
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Retrieve a connection{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              {`const connection = morphClient.connections({ sessionToken })`}
            </code>
          </li>
          <li>
            List resources{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              {`const { data, error } = await connection.resources("genericContact").list();`}
            </code>
          </li>
        </ol>
        <ResourceList sessionToken={sessionToken} />
      </main>
    </div>
  );
}

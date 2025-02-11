import { ConnectionWrapper } from "./connection-wrapper";
import { createSession } from "./actions";

export default async function Page({
  params,
  searchParams,
}: {
  params: { connectorId: string; ownerId: string };
  searchParams: { dark?: string };
}) {
  const { connectorId, ownerId } = await params;
  const { dark } = await searchParams;
  const isDark = dark === "true";

  if (!connectorId) return <p>No connector id provided</p>;

  // Create session on the server
  const result = await createSession({
    ownerId,
    connectorId: connectorId as "hubspot",
  });

  if (result.error) {
    return <p>Could not create morph sessionToken</p>;
  }

  return (
    <div
      data-theme={isDark ? "dark" : "light"}
      className="flex flex-col items-center min-h-screen pt-4 gap-8"
    >
      <div className="w-full">
        <ConnectionWrapper
          sessionToken={result.data.sessionToken}
          connectorId={connectorId}
          ownerId={ownerId}
        />
      </div>
    </div>
  );
}

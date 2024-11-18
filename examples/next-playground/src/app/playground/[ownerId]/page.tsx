import { redirect } from "next/navigation";

interface PlaygroundParams {
  ownerId: string;
}

export default async function PlaygroundRedirect({
  params,
}: {
  params: Promise<PlaygroundParams>;
}) {
  // Generate a random ownerId
  const { ownerId } = await params;

  // Redirect to /{ownerId}
  redirect(`/playground/${ownerId}/connectors`);
}

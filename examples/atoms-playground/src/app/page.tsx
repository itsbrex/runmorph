"use server";
import { ConnectCard } from "@/components/connect-card";
import { Morph } from "@runmorph/cloud";

// Server morph instance with both publicKey and secretKey
const morph = Morph({
  publicKey:
    "pk_prod_Sm5sSuH3d6GeUtAJydrWAP0FatWQDsuwPqaXq4lPdBUSjiXYC3sDg26q6",
  secretKey:
    "sk_prod_0gRXF9TqZzUDKOECQYHA8k5RK8umMt3x7ABvSM5FNJXipgAMwlzeziW5l",
});

export default async function Home() {
  const { data, error } = await morph.sessions().create({
    connection: {
      connectorId: "hubspot",
      ownerId: "temp_" + Date.now(),
      operations: ["genericContact::retrieve"],
    },
  });
  console.log({ data, error });
  if (error) return <p>Could not create morph sessionToken</p>;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <ConnectCard sessionToken={data.sessionToken} />
    </div>
  );
}

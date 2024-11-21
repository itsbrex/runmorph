"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PlaygroundRedirect(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    // Generate a random ownerId
    const ownerId = Math.random().toString(36).substring(2, 15);

    // Redirect to /{ownerId} using client-side navigation
    router.push(`/playground/fake-user-${ownerId}`);
  }, [router]);

  return <></>;
}

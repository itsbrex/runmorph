"use client";

import { NextMorphClient } from "@runmorph/framework-next";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

// Import only the type of morph to avoid client error
import type { morph } from "@/morph";

export const nextMorphClient = NextMorphClient<morph>();

import { Button } from "./ui/button";

interface ConnectionButtonProps {
  sessionToken: string;
}

type ConnectionButtonState =
  | "loading"
  | "not_connected"
  | "connected"
  | "error";

export function ConnectionButton({
  sessionToken,
}: ConnectionButtonProps): JSX.Element {
  const [status, setStatus] = useState<ConnectionButtonState>("loading");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConnectionStatus();

    const handleMessage = (event: MessageEvent): void => {
      if (event.data === "connection_callback_complete") {
        checkConnectionStatus();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const checkConnectionStatus = async (): Promise<void> => {
    try {
      const { data, error } = await nextMorphClient
        .connections({ sessionToken })
        .retrieve();

      if (error) {
        setStatus("not_connected");
        return;
      }

      setStatus(data?.status === "authorized" ? "connected" : "not_connected");
    } catch (error) {
      if (error instanceof Error && error.message === "Load failed") {
        alert(
          "Make sure you have correctly set the NEXT_PUBLIC_MORPH_API_BASE_URL and that you are loading the playground on the main domain (and not a subdeployment domain)."
        );
      } else {
        alert(error);
      }
      console.error("Error checking connection status:", error);
      setStatus("error");
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await nextMorphClient
        .connections({ sessionToken })
        .delete();

      if (error) {
        alert(error.code + ": " + error.message);
        return;
      }

      setStatus("not_connected");
    } catch (error) {
      console.error("Error deleting connection:", error);
      alert("Failed to delete connection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (): Promise<void> => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const { data, error } = await nextMorphClient
        .connections({ sessionToken })
        .authorize();

      if (error) {
        alert(error.code + ": " + error.message);
        return;
      }

      const width = 700;
      const height = 900;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authorizationUrl,
        "ConnectWithMorph",
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,status=0,menubar=0,scrollbars=1,resizable=1`
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        alert("Please allow popups for this website");
      }
    } catch (error) {
      console.error("An error occurred during authorization:", error);
      alert("Failed to initiate connection");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <Button disabled>Loading...</Button>;
  }

  if (status === "error") {
    return <Button variant="destructive">Error</Button>;
  }

  if (status === "connected") {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={isLoading || status === "connected"}
        >
          Connected
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={isLoading}>
      {isLoading ? "Loading..." : "Connect"}
    </Button>
  );
}

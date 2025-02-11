"use client";

import * as React from "react";
import { ConnectCard } from "@/components/connect-card";
import { ContactsTable } from "@/components/contacts-table";
import type { ConnectionCallbacks } from "@runmorph/atoms";
import { Morph } from "@runmorph/cloud";
import { useSearchParams } from "next/navigation";
import {
  type ConnectorId,
  ConnectorSelect,
} from "@/components/connector-select";

interface ConnectionWrapperProps {
  sessionToken: string;
  connectorId: string;
  ownerId: string;
}

export function ConnectionWrapper({
  sessionToken,
  connectorId,
  ownerId,
}: ConnectionWrapperProps) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [unavailableMessage, setUnavailableMessage] = React.useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [selectedConnector, setSelectedConnector] = React.useState(connectorId);
  const searchParams = useSearchParams();
  const themeParam =
    searchParams.get("theme") === "light" ? "?theme=light" : "";

  // Handle unavailable connector selection
  const handleUnavailableConnector = (message: string) => {
    setUnavailableMessage(message);
    setErrorMessage(null);
    setIsConnected(false);
    setSelectedConnector(`unavailable-${Date.now()}`); // Force ContactsTable remount
  };

  // Reset all states when connector changes
  React.useEffect(() => {
    setUnavailableMessage(null);
    setErrorMessage(null);
    setIsConnected(false);
    setSelectedConnector(connectorId);
  }, [connectorId]);

  // Check connection status when connector changes
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const morph = Morph({
          publicKey: process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY!,
        });
        const connection = morph.connections({ sessionToken });
        const { data, error } = await connection.retrieve();

        if (error) {
          console.error("Error retrieving connection:", error);
          setIsConnected(false);
          return;
        }

        const isAuthorized = data.status === "authorized";
        setIsConnected(isAuthorized);
        if (isAuthorized) {
          setUnavailableMessage(null);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Error checking connection status:", error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, [sessionToken, connectorId]);

  const connectionCallbacks: ConnectionCallbacks = {
    authorized: () => {
      setIsConnected(true);
      setUnavailableMessage(null);
      setErrorMessage(null);
    },
    onError: (error: { message: string }) => {
      console.error("Connection error:", error);
      setErrorMessage(error.message);
      setIsConnected(false);
    },
  };

  return (
    <div className="pt-4">
      <div className="mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <ConnectorSelect
            defaultValue={connectorId as ConnectorId}
            ownerId={ownerId}
            onUnavailableConnector={handleUnavailableConnector}
          />
          <ConnectCard
            sessionToken={sessionToken}
            connectorId={connectorId}
            connectionCallbacks={connectionCallbacks}
          />
        </div>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        {unavailableMessage && !isConnected && !errorMessage && (
          <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg text-yellow-800 dark:text-yellow-200">
            {unavailableMessage} can&apos;t be tested in the playground as it
            requires a custom CLIENT_ID and CLIENT_SECRET. Try another connector
            like{" "}
            <a
              href={`/${ownerId}/connectors/salesforce${themeParam}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Salesforce
            </a>{" "}
            or{" "}
            <a
              href={`/${ownerId}/connectors/hubspot${themeParam}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              HubSpot
            </a>{" "}
            – or{" "}
            <a
              href={`https://cal.com/morphhq/sign-up-onboarding`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              book a demo
            </a>{" "}
            to test {unavailableMessage} live ✨
          </div>
        )}

        <ContactsTable
          isConnected={isConnected}
          sessionToken={sessionToken}
          key={selectedConnector}
        />
      </div>
    </div>
  );
}

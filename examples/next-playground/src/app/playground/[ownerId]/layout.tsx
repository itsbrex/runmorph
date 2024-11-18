"use server";

import { User } from "lucide-react";
import { headers } from "next/headers";

import { ConnectorCard } from "@/components/connector-card";
import { ConnectionButton } from "@/components/morph-connection-button";
import ConnectionCard from "@/components/morph-connection-card";
import { ResourceList } from "@/components/morph-resource-list";
import { PlaygroundSidebar } from "@/components/playground-sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { morph } from "@/morph";

interface Connector {
  id: string;
  name: string;
  description: string;
  logo?: string;
}

const connectors: Connector[] = [
  {
    id: "hubspot",
    name: "Hubspot",
    description:
      "A leading CRM platform that provides tools for marketing, sales, and customer service.",
    logo: "/connectors/hubspot.svg",
  },
];

interface PlaygroundParams {
  ownerId: string;
}

/**
 * Creates a session for a given connector.
 * @param ownerId - The ID of the owner (user or organization).
 * @param connectorId - The ID of the connector.
 * @param operations - The list of operations to be performed.
 * @returns A promise that resolves to the session data or an error.
 */
async function createConnectorSession(
  params: Parameters<ReturnType<(typeof morph)["sessions"]>["create"]>[0]
): Promise<string> {
  try {
    const { data, error } = await morph.sessions().create(params);

    if (error) {
      throw { error: new Error(error.message) };
    }

    return data.sessionToken;
  } catch (err) {
    throw { error: new Error("Failed to create connector session") };
  }
}

export default async function Playground({
  children,
  params,
}: {
  children: React.ReactNode;
  breadcrumbs: React.ReactNode;
  params: Promise<PlaygroundParams>;
}) {
  const { ownerId } = await params;

  // Fake owner id; to be replaced by authenticated user / organization id
  const OWNER_ID = ownerId || "fake-user-id";

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
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as React.CSSProperties
      }
    >
      <PlaygroundSidebar ownerId={ownerId} />
      <SidebarInset className="p-2">{children}</SidebarInset>
    </SidebarProvider>
  );
}

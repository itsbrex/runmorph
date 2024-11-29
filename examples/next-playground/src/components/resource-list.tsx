"use client";
import {
  MorphResource,
  NextMorphClient,
  resourceModelIds,
  type ResourceModelId,
} from "@runmorph/framework-next";
import Image from "next/image";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { connectorListing } from "@/connector-listing";
// Import only the type of morph to avoid client error
import type { morph } from "@/morph";

import { Button } from "./ui/button";

export const morphClient = NextMorphClient<morph>();

interface ResourceListProps {
  connections: {
    sessionToken: string;
    connectorId: string;
  }[];
}

export function ResourceList({ connections }: ResourceListProps): JSX.Element {
  const [selectedConnection, setSelectedConnection] = useState<
    string | undefined
  >(connectorListing[0]?.id);
  const [selectedResource, setSelectedResource] =
    useState<ResourceModelId>("genericContact");
  const [resources, setResources] = useState<
    MorphResource<typeof selectedResource>[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Move fetch logic to a separate function
  const fetchResources = async (): Promise<void> => {
    if (!selectedConnection) return;

    setIsLoading(true);
    try {
      const connection = connections.find(
        (c) => c.connectorId === selectedConnection
      );
      if (!connection) return;

      setError(null);
      const morphConnection = morphClient.connections({
        sessionToken: connection.sessionToken,
      });

      const { data: w, error: ew } = await morphConnection.webhook().create({
        model: "genericContact",
        trigger: "created",
      });

      console.log("w", w);
      console.log("ew", ew);
      const { data, error } = await morphConnection
        .resources(selectedResource)
        .list({ limit: 3 });

      if (error) {
        setError(error.message);
        setResources([]);
        return;
      }

      if (data && data.length > 0) {
        const fieldKeys = Object.keys(data[0].fields);
        setColumns(fieldKeys);
        setResources(data);
      } else {
        setResources([]);
        setColumns([]);
      }
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        if (error.message === "Load failed") {
          setError(
            "Make sure you have correctly set the NEXT_PUBLIC_MORPH_API_BASE_URL and that you are loading the playground on the main domain (and not a subdeployment domain)."
          );
        } else {
          setError(error.message);
        }
      } else {
        setError("An unknown error occurred");
      }
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="space-y-4 mb-4">
          <div className="flex space-x-4 mt-4">
            <Select
              value={selectedConnection}
              onValueChange={setSelectedConnection}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((connection) => {
                  return (
                    <SelectItem
                      key={`${connection.connectorId}-${connection.sessionToken}`}
                      value={connection.connectorId}
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={
                            connectorListing.find(
                              (c) => c.id === connection.connectorId
                            )?.logo || "/morph-light.svg"
                          }
                          alt={`icon`}
                          width={20}
                          height={20}
                          className="mr-2"
                        />
                        {connectorListing.find(
                          (c) => c.id === connection.connectorId
                        )?.name || connection.connectorId}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select
              value={selectedResource}
              onValueChange={(v) => setSelectedResource(v as ResourceModelId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a resource type" />
              </SelectTrigger>
              <SelectContent>
                {resourceModelIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={fetchResources}
              disabled={!selectedConnection || !selectedResource || isLoading}
            >
              {isLoading ? "Listing Resources..." : "List Resources"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              {columns.map((column) => (
                <TableHead key={column}>
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                </TableHead>
              ))}
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center">
                  <div className="flex flex-col items-center justify-start h-full">
                    <p className="text-muted-foreground">No resources found</p>
                    <p className="text-sm text-muted-foreground">
                      Select a connection and resource type to view data
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              resources.slice(0, 5).map((resource, index) => (
                <TableRow key={index}>
                  <TableCell>{resource.id}</TableCell>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
                      {Array.isArray((resource.fields as any)[column]) &&
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      typeof (resource.fields as any)[column][0] === "object"
                        ? "[" +
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (resource.fields as any)[column]
                            .map((item: { id: string }) => item.id)
                            .join(", ") +
                          "]"
                        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          typeof (resource.fields as any)[column] === "object"
                          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (resource.fields as any)[column].id
                          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            String((resource.fields as any)[column])}
                    </TableCell>
                  ))}
                  <TableCell>
                    {new Date(resource.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(resource.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Accordion type="single" collapsible>
          <AccordionItem value="raw-data">
            <AccordionTrigger>Raw Response</AccordionTrigger>
            <AccordionContent>
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{ margin: 0 }}
              >
                {JSON.stringify(resources || error, null, 2)}
              </SyntaxHighlighter>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

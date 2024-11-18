"use client";
import {
  MorphResource,
  NextMorphClient,
  resourceModelIds,
  type ResourceModelId,
} from "@runmorph/framework-next";
import { useState } from "react";

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
  >();
  const [selectedResource, setSelectedResource] =
    useState<ResourceModelId>("genericContact");
  const [resources, setResources] = useState<MorphResource<any>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);

  // Move fetch logic to a separate function
  const fetchResources = async () => {
    if (!selectedConnection) return;

    const connection = connections.find(
      (c) => c.connectorId === selectedConnection
    );
    if (!connection) return;

    try {
      setError(null);
      const morphConnection = morphClient.connections({
        sessionToken: connection.sessionToken,
      });
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
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setResources([]);
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
                        {connection.connectorId}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select
              value={selectedResource}
              onValueChange={(v) =>
                setSelectedResource(
                  v as Parameters<
                    ReturnType<morph["connections"]>["resources"]
                  >[0]
                )
              }
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
              disabled={!selectedConnection || !selectedResource}
            >
              Fetch Resources
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
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {Array.isArray(resource.fields[column]) &&
                      typeof resource.fields[column][0] === "object"
                        ? resource.fields[column]
                            .map((item) => item.id)
                            .join(", ")
                        : typeof resource.fields[column] === "object"
                          ? resource.fields[column].id
                          : String(resource.fields[column])}
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
      </CardContent>
    </Card>
  );
}

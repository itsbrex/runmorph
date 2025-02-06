"use client";
import { MorphProvider } from "@runmorph/atoms";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Connect } from "@runmorph/atoms";

interface ConnectCardProps {
  sessionToken: string;
}

export function ConnectCard({ sessionToken }: ConnectCardProps) {
  return (
    <MorphProvider>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>HubSpot</CardTitle>
          <CardDescription>
            Connect your HubSpot account to get started with our service.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Connect
            sessionToken={sessionToken}
            connectionCallbacks={{
              authorized: (connectionData) => {},
            }}
          />
        </CardContent>
      </Card>
    </MorphProvider>
  );
}

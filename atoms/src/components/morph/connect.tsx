"use client";

import * as React from "react";
import { VariantProps } from "class-variance-authority";
import { CircleCheck, EllipsisVertical, LoaderCircle } from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { Connection } from "./connection";
import { useMorph } from "./morph-provider";
import type { ConnectionCallbacks } from "./connection-triggers";

export interface ConnectButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "onError"
  > {
  sessionToken: string;
  className?: string;
  variant?: VariantProps<typeof Button>["variant"];
  size?: VariantProps<typeof Button>["size"];
  asChild?: boolean;
  connectionCallbacks?: ConnectionCallbacks;
  mode?: "popup" | "redirect";
  redirectUrl?: string;
}

export function Connect({
  sessionToken,
  className,
  variant = "default",
  size = "default",
  asChild,
  connectionCallbacks,
  mode = "popup",
  redirectUrl,
  ...props
}: ConnectButtonProps): React.ReactElement {
  // Validate redirectUrl when mode is redirect
  if (mode === "redirect" && !redirectUrl) {
    throw new Error("redirectUrl is required when mode is set to 'redirect'");
  }

  const morph = useMorph();
  const [connectionData, setConnectionData] = React.useState<any>(null);
  const [connectionError, setConnectionError] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  // Update combined callbacks to handle loading state
  const combinedCallbacks: ConnectionCallbacks = {
    ...connectionCallbacks,
    onConnectionDataChange: (data: any) => {
      setConnectionData(data);
      setConnectionError(null);
      setIsActionLoading(false);
      connectionCallbacks?.onConnectionDataChange?.(data);
    },
    onStart: () => {
      setIsActionLoading(true);
      connectionCallbacks?.onStart?.();
    },
    onError: (error: any) => {
      setIsActionLoading(false);
      connectionCallbacks?.onError?.(error);
    },
  };

  React.useEffect(() => {
    const loadConnection = async () => {
      try {
        const connection = morph.connections({ sessionToken });
        const { data, error } = await connection.retrieve();

        setConnectionData(data);
        setConnectionError(error);
      } catch (error) {
        const morphError = {
          code: "MORPH::CONNECTION::UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : String(error),
        };
        setConnectionError(morphError);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnection();
  }, [sessionToken, morph]);

  if (isLoading) {
    return (
      <Button
        className={className}
        variant={variant}
        size={size}
        asChild={asChild}
        {...props}
        disabled
      >
        <LoaderCircle className="animate-spin" />
        Connect
      </Button>
    );
  }

  if (connectionError) {
    return <p>Error</p>;
  }

  if (connectionData.status === "unauthorized") {
    return (
      <Connection.Provider sessionToken={sessionToken}>
        <Connection.Triggers.Authorize
          mode={mode}
          redirectUrl={redirectUrl}
          connectionCallbacks={combinedCallbacks}
        >
          <Button
            className={className}
            variant={variant}
            size={size}
            asChild={asChild}
            disabled={isActionLoading}
            {...props}
          >
            {isActionLoading ? (
              <LoaderCircle className="animate-spin mr-2" />
            ) : null}
            Connect
          </Button>
        </Connection.Triggers.Authorize>
      </Connection.Provider>
    );
  }

  return (
    <Connection.Provider sessionToken={sessionToken}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={className}
            variant="outline"
            size={size}
            disabled={isActionLoading}
            {...props}
          >
            {isActionLoading ? (
              <LoaderCircle className="animate-spin mr-2" />
            ) : (
              <CircleCheck className="mr-2" />
            )}
            Connected
            <EllipsisVertical className="ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Connection.Triggers.Authorize
            mode={mode}
            redirectUrl={redirectUrl}
            connectionCallbacks={combinedCallbacks}
          >
            <DropdownMenuItem disabled={isActionLoading}>
              Re-authorize
            </DropdownMenuItem>
          </Connection.Triggers.Authorize>
          <Connection.Triggers.Delete connectionCallbacks={combinedCallbacks}>
            <DropdownMenuItem disabled={isActionLoading}>
              Delete
            </DropdownMenuItem>
          </Connection.Triggers.Delete>
        </DropdownMenuContent>
      </DropdownMenu>
    </Connection.Provider>
  );
}

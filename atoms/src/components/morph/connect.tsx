"use client";

import * as React from "react";
import { VariantProps } from "class-variance-authority";
import { EllipsisVertical } from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { Connection } from "./connection";
import { useMorph } from "./morph-provider";
import { useConnection } from "./connection-context";
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
  windowMode?: "popup" | "redirect";
  redirectUrl?: string;
}

export function Connect({
  sessionToken,
  className,
  variant = "default",
  size = "default",
  asChild,
  connectionCallbacks,
  windowMode = "popup",
  redirectUrl,
  ...props
}: ConnectButtonProps): React.ReactElement {
  // Validate redirectUrl when windowMode is redirect
  if (windowMode === "redirect" && !redirectUrl) {
    throw new Error(
      "redirectUrl is required when windowMode is set to 'redirect'"
    );
  }

  return (
    <Connection.Provider sessionToken={sessionToken}>
      <ConnectContent
        sessionToken={sessionToken}
        className={className}
        variant={variant}
        size={size}
        asChild={asChild}
        connectionCallbacks={connectionCallbacks}
        windowMode={windowMode}
        redirectUrl={redirectUrl}
        {...props}
      />
    </Connection.Provider>
  );
}

function ConnectContent({
  sessionToken,
  className,
  variant = "default",
  size = "default",
  asChild,
  connectionCallbacks,
  windowMode = "popup",
  redirectUrl,
  ...props
}: ConnectButtonProps): React.ReactElement {
  const morph = useMorph();
  const { t } = useConnection();
  const [connectionData, setConnectionData] = React.useState<any>(null);
  const [connectionError, setConnectionError] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  // Helper function to get translated text or fallback
  const getTranslatedText = (
    key: string,
    defaultText: string,
    vars?: Record<string, any>
  ) => {
    if (!t) return defaultText;
    const translatedText = t(`connect.${key}`, vars);
    return translatedText === `connect.${key}` ? defaultText : translatedText;
  };

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
        {getTranslatedText("status.loading", "Connect")}
      </Button>
    );
  }

  if (connectionError) {
    return <p>{getTranslatedText("status.error", "Error")}</p>;
  }

  if (connectionData.status === "unauthorized") {
    return (
      <Connection.Triggers.Authorize
        windowMode={windowMode}
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
          {getTranslatedText("actions.connect", "Connect")}
        </Button>
      </Connection.Triggers.Authorize>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={className}
          variant="outline"
          size={size}
          disabled={isActionLoading}
          {...props}
        >
          {getTranslatedText("status.authorized", "Connected")}
          <EllipsisVertical className="ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Connection.Triggers.Authorize
          windowMode={windowMode}
          redirectUrl={redirectUrl}
          connectionCallbacks={combinedCallbacks}
        >
          <DropdownMenuItem disabled={isActionLoading}>
            {getTranslatedText("actions.reauthorize", "Re-authorize")}
          </DropdownMenuItem>
        </Connection.Triggers.Authorize>
        {/**<Connection.Triggers.Delete connectionCallbacks={combinedCallbacks}>
          <DropdownMenuItem disabled={isActionLoading}>
            {getTranslatedText("actions.delete", "Delete")}
          </DropdownMenuItem>
        </Connection.Triggers.Delete>**/}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

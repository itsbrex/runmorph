"use client";

import * as React from "react";
import { useMorph } from "./morph-provider";
import { useConnection } from "./connection-context";

export interface ConnectionCallbacks {
  authorized?: (connectionData: any) => void;
  onConnectionDataChange?: (connectionData: any) => void;
  onStart?: () => void;
  onError?: (error: any) => void;
}

export interface ConnectionTriggerClientProps<T = HTMLElement> {
  children: React.ReactElement<{
    onClick?: (e: React.MouseEvent<T>) => void;
    onKeyDown?: (e: React.KeyboardEvent<T>) => void;
  }>;
  mode?: "popup" | "redirect";
  redirectUrl?: string;
  connectionCallbacks?: ConnectionCallbacks;
  settings?: Record<string, any>;
  sessionToken?: string;
}

function BaseTriggerClient<T = HTMLElement>({
  children,
  action,
  mode = "popup",
  redirectUrl,
  connectionCallbacks,
  settings: propSettings,
  sessionToken: propSessionToken,
}: ConnectionTriggerClientProps<T> & {
  action: "authorize" | "delete";
}): JSX.Element {
  const morph = useMorph();
  const connectionContext = useConnection();

  // Use context values if available, otherwise fall back to props
  const sessionToken = connectionContext?.sessionToken || propSessionToken;
  const settings = connectionContext?.settings || propSettings || {};
  const t = connectionContext?.t;

  // Helper function to get trigger-specific translated text
  const getTriggerTranslatedText = (
    triggerKey: string,
    textKey: string,
    defaultText: string,
    vars?: Record<string, any>
  ) => {
    if (!t) return defaultText;
    const translatedText = t(`triggers.${triggerKey}.${textKey}`, vars);
    return translatedText === `triggers.${triggerKey}.${textKey}`
      ? defaultText
      : translatedText;
  };

  if (!sessionToken) {
    throw new Error(
      getTriggerTranslatedText(
        action,
        "errors.missingToken",
        "Missing sessionToken. Provide it via ConnectionProvider context or as a prop."
      )
    );
  }

  const onClick = async () => {
    if (!morph.connections) {
      throw new Error(
        getTriggerTranslatedText(
          action,
          "errors.missingMethod",
          "Missing morph.connections() method"
        )
      );
    }

    const connection = morph.connections({ sessionToken });

    if (action === "authorize") {
      connectionCallbacks?.onStart?.();
      const { data, error } = await connection.authorize({
        redirectUrl,
        mode: "direct",
        settings,
      });

      if (error) {
        connectionCallbacks?.onError?.(error);
        return;
      }

      if (data?.authorizationUrl) {
        if (mode === "redirect") {
          // Redirect to authorization URL
          window.location.href = data.authorizationUrl;
        } else {
          // Open in popup
          const width = 600;
          const height = 800;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;
          const popup = window.open(
            data.authorizationUrl,
            "MorphConnect",
            `width=${width},height=${height},left=${left},top=${top}`
          );

          if (!popup) {
            throw new Error(
              getTriggerTranslatedText(
                action,
                "errors.popupBlocked",
                "Please allow popups for this site to continue with authorization"
              )
            );
          }

          // Check connection status when popup closes
          const checkConnection = async () => {
            if (popup?.closed) {
              const { data: connectionData, error: connectionError } =
                await connection.retrieve();

              if (!connectionError && connectionData) {
                // Update parent component state
                connectionCallbacks?.onConnectionDataChange?.(connectionData);
                // Trigger authorized callback
                connectionCallbacks?.authorized?.(connectionData);
              } else if (connectionError) {
                connectionCallbacks?.onError?.(connectionError);
              }
              // Remove interval once we've checked
              clearInterval(popupChecker);
            }
          };

          // Check every second if the popup is closed
          const popupChecker = setInterval(checkConnection, 1000);
        }
      } else {
        throw new Error(
          getTriggerTranslatedText(
            action,
            "errors.noAuthUrl",
            "No authorization URL received"
          )
        );
      }
    } else if (action === "delete") {
      // Update parent component state to show unauthorized
      connectionCallbacks?.onConnectionDataChange?.({ status: "unauthorized" });
    }
  };

  if (!React.isValidElement(children)) {
    throw new Error(
      getTriggerTranslatedText(
        action,
        "errors.invalidChildren",
        "ConnectionTrigger children must be a valid React element"
      )
    );
  }

  return React.cloneElement(children, {
    onClick: async (e: React.MouseEvent<T>) => {
      children.props.onClick?.(e);
      await onClick();
    },
  });
}

export function AuthorizeClient<T = HTMLElement>(
  props: ConnectionTriggerClientProps<T>
) {
  return <BaseTriggerClient<T> {...props} action="authorize" />;
}

export function DeleteClient<T = HTMLElement>(
  props: ConnectionTriggerClientProps<T>
) {
  return <BaseTriggerClient<T> {...props} action="delete" />;
}

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
  windowMode?: "popup" | "redirect";
  mode?: "direct" | "connect";
  redirectUrl?: string;
  connectionCallbacks?: ConnectionCallbacks;
  settings?: Record<string, any>;
  sessionToken?: string;
}

function BaseTriggerClient<T = HTMLElement>({
  children,
  action,
  mode = "connect",
  windowMode = "popup",
  redirectUrl,
  connectionCallbacks,
  settings: propSettings,
  sessionToken: propSessionToken,
}: ConnectionTriggerClientProps<T> & {
  action: "authorize" | "delete";
}): React.ReactElement {
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
    try {
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
          mode,
          settings,
        });

        if (error) {
          connectionCallbacks?.onError?.(error);
          return;
        }

        if (data?.authorizationUrl) {
          if (windowMode === "redirect") {
            // Redirect to authorization URL
            window.location.href = data.authorizationUrl;
          } else {
            // Proceed with authorization popup
            const width = 600;
            const height = 800;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            // Check if popups are allowed first
            const checkPopupPermission = () => {
              const testPopup = window.open(
                "https://connect.runmorph.dev/messages/popup-blocked",
                "MorphPopupCheck",
                `width=${width},height=${height},left=${left},top=${top}`
              );

              if (testPopup) {
                testPopup.close();
                return true;
              }
              return false;
            };

            if (!checkPopupPermission()) {
              connectionCallbacks?.onError?.({
                code: "MORPH_ATOMS::POPUP_BLOCKED",
                message: getTriggerTranslatedText(
                  action,
                  "errors.popupBlocked",
                  "Please allow popups for this site and try again"
                ),
              });
              return;
            }

            const popup = window.open(
              data.authorizationUrl,
              "MorphConnect",
              `width=${width},height=${height},left=${left},top=${top}`
            );

            if (popup) {
              let popupChecker: NodeJS.Timeout | null = null;

              // Check connection status when popup closes
              const checkConnection = async () => {
                if (popup.closed) {
                  if (popupChecker) {
                    clearInterval(popupChecker);
                  }

                  const { data: connectionData, error: connectionError } =
                    await connection.retrieve();

                  if (!connectionError && connectionData) {
                    connectionCallbacks?.onConnectionDataChange?.(
                      connectionData
                    );
                    connectionCallbacks?.authorized?.(connectionData);
                  } else if (connectionError) {
                    connectionCallbacks?.onError?.(connectionError);
                  }
                }
              };

              popupChecker = setInterval(checkConnection, 1000);
            }
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
        await connection.delete();

        connectionCallbacks?.onConnectionDataChange?.({
          status: "unauthorized",
        });
      }
    } catch (error) {
      console.error(error);
      connectionCallbacks?.onError?.(error);
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

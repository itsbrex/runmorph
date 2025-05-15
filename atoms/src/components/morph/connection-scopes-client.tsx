"use client";

import * as React from "react";
import { useConnection } from "./connection-context";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export interface ConnectionScopesClientProps {
  initialScopes?: string[];
  hidden?: boolean;
}

export function ConnectionScopesClient({
  initialScopes,
  hidden = false,
}: ConnectionScopesClientProps) {
  const { scopes, setScopes, t } = useConnection();
  const [inputValue, setInputValue] = React.useState<string>("");
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize input value with current scopes or initial scopes if provided
  // Only run once on component mount
  React.useEffect(() => {
    if (!isInitialized) {
      if (initialScopes && initialScopes.length > 0) {
        setInputValue(initialScopes.join(", "));
        setScopes(initialScopes);
      } else if (scopes.length > 0) {
        setInputValue(scopes.join(", "));
      }
      setIsInitialized(true);
    }
  }, [scopes, initialScopes, setScopes, isInitialized]);

  // If hidden is true, only set the scopes and don't render the UI
  if (hidden) {
    return null;
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle input blur to update scopes
  const handleInputBlur = () => {
    // If input is empty or just whitespace, set empty array
    if (!inputValue || inputValue.trim() === "") {
      setScopes([]);
      return;
    }

    // Split by comma and trim whitespace
    const newScopes = inputValue
      .split(",")
      .map((scope) => scope.trim())
      .filter((scope) => scope !== ""); // Remove empty strings

    setScopes(newScopes);
  };

  // Get translated text or fallback
  const getTranslatedText = (key: string, defaultText: string) => {
    if (!t) return defaultText;
    const translatedText = t(`scopes.${key}`);
    return translatedText === `scopes.${key}` ? defaultText : translatedText;
  };

  return (
    <div className="space-y-2">
      <Label>{getTranslatedText("label", "Additional Scopes")}</Label>
      <Input
        id="scopes"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={getTranslatedText(
          "placeholder",
          "scope_1, scope_2, scope_3"
        )}
      />
    </div>
  );
}

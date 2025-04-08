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

  // Initialize input value with current scopes or initial scopes if provided
  React.useEffect(() => {
    if (initialScopes && initialScopes.length > 0) {
      setInputValue(initialScopes.join(", "));
      setScopes(initialScopes);
    } else {
      setInputValue(scopes.join(", "));
    }
  }, [scopes, initialScopes, setScopes]);

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
      <div className="text-sm font-medium">
        {getTranslatedText("label", "Additional Scopes")}
      </div>
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

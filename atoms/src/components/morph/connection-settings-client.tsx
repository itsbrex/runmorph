"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useMorph } from "./morph-provider";
import { useConnection } from "./connection-context";

export interface ConnectorSetting {
  key: string;
  type: "select";
  name: string;
  required: boolean;
  description: string;
  options: Array<{
    value: string;
    name: string;
  }>;
  default: string;
}

export interface Connector {
  object: "connector";
  id: string;
  name: string;
  settings: ConnectorSetting[];
}

export function ConnectionSettingsClient() {
  const { sessionToken, setSettings, t } = useConnection();
  const morph = useMorph();
  const [connector, setConnector] = React.useState<Connector | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Helper function to get translated text or fallback
  const getTranslatedText = (
    key: string,
    defaultText: string,
    vars?: Record<string, any>
  ) => {
    if (!t) return defaultText;
    const translatedText = t(`settings.${key}`, vars);
    return translatedText === `settings.${key}` ? defaultText : translatedText;
  };

  // Helper function to get connector-specific translated text
  const getConnectorTranslatedText = (
    connectorId: string,
    settingKey: string,
    textKey: string,
    defaultText: string,
    vars?: Record<string, any>
  ) => {
    if (!t) return defaultText;
    const translatedText = t(
      `settings.connectors.${connectorId}.${settingKey}.${textKey}`,
      vars
    );
    return translatedText ===
      `settings.connectors.${connectorId}.${settingKey}.${textKey}`
      ? defaultText
      : translatedText;
  };

  // Dynamically create zod schema based on connector settings
  const createFormSchema = (settings: ConnectorSetting[]) => {
    const schemaFields: Record<string, any> = {};

    settings.forEach((setting) => {
      if (setting.type === "select") {
        schemaFields[setting.key] = setting.required
          ? z.string({
              required_error: getConnectorTranslatedText(
                connector?.id || "",
                setting.key,
                "required",
                `${setting.name} is required`
              ),
            })
          : z.string().optional();
      }
    });

    return z.object(schemaFields);
  };

  // Initialize form with dynamic schema
  const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
    // @ts-expect-error -- to fix
    resolver: zodResolver(createFormSchema(connector?.settings || [])),
    defaultValues: {},
  });

  React.useEffect(() => {
    const fetchConnector = async () => {
      try {
        if (!morph.connections) {
          throw new Error(
            getTranslatedText(
              "errors.missingMethod",
              "Missing morph.connections() method"
            )
          );
        }

        const connection = morph.connections({ sessionToken });
        const { data, error } = await connection.getConnector();

        if (error) {
          throw error;
        }

        setConnector(data as Connector);

        // Set default values
        const defaultValues: Record<string, any> = {};
        data.settings.forEach((setting) => {
          defaultValues[setting.key] = setting.default;
        });
        form.reset(defaultValues);

        // Notify parent of initial settings
        setSettings(defaultValues);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : getTranslatedText(
                "errors.fetchFailed",
                "Failed to fetch connector"
              )
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConnector();
  }, [sessionToken, morph, setSettings, form, t]);

  // Watch for form changes and notify parent
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setSettings(value);
    });
    return () => subscription.unsubscribe();
  }, [form, setSettings]);

  if (loading) {
    return <div>{getTranslatedText("status.loading", "Loading...")}</div>;
  }

  if (error) {
    return (
      <div>
        {getTranslatedText("status.error", "Error")}: {error}
      </div>
    );
  }

  if (!connector) {
    return (
      <div>{getTranslatedText("status.noConnector", "No connector found")}</div>
    );
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        {connector.settings.map((setting) => (
          <FormField
            key={setting.key}
            control={form.control}
            name={setting.key}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {getConnectorTranslatedText(
                    connector.id,
                    setting.key,
                    "label",
                    setting.name
                  )}
                </FormLabel>
                {/** @ts-expect-error -- to fix */}
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={getConnectorTranslatedText(
                          connector.id,
                          setting.key,
                          "placeholder",
                          `Select ${setting.name.toLowerCase()}`
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {setting.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {getConnectorTranslatedText(
                            connector.id,
                            setting.key,
                            `options.${option.value}`,
                            option.name
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  {getConnectorTranslatedText(
                    connector.id,
                    setting.key,
                    "description",
                    setting.description
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </Form>
  );
}

import { URL } from "url";

import {
  SettingField,
  SettingValues,
  StringOrFunction,
  ConnectorOptions,
  ConnectorAuth,
  ConnectorClientOptions,
} from "./types";

/**
 * Connector class for handling connector information and authentication processes.
 */
export class Connector<I extends string> {
  public id: I;
  public name: string;
  public auth: ConnectorAuth;
  private proxy: {
    baseUrl: StringOrFunction;
  };
  private options?: ConnectorClientOptions;

  /**
   * Creates an instance of the Connector class.
   * @param options - The options object containing connector information and authentication details.
   */
  constructor(options: ConnectorOptions<I>) {
    this.id = options.id;
    this.name = options.name;
    this.proxy = options.proxy;

    this.auth = {
      type: options.auth.type,
      getSettingFields: () =>
        this.getAuthSettingFields(options.auth.settingFields),
      getDefaultScopes: () => options.auth.defaultScopes || [],
      generateAuthorizeUrl: (settings: SettingValues) =>
        this.generateUrl(settings, options.auth.authorizeUrl),
      generateAccessTokenUrl: (settings: SettingValues) =>
        this.generateUrl(settings, options.auth.accessTokenUrl),
    };
  }

  /**
   * Generates the proxy base URL based on the provided settings.
   * @param settings - The settings object containing the values for the setting fields.
   * @returns The proxy base URL.
   * @throws {Error} If required settings are missing.
   */
  public generateProxyBaseUrl(settings: SettingValues): URL {
    return this.generateUrl(settings, this.proxy.baseUrl);
  }

  private getAuthSettingFields(
    settingFields?: SettingField[] | (() => SettingField[]),
  ): SettingField[] {
    return settingFields
      ? typeof settingFields === "function"
        ? settingFields()
        : settingFields
      : [];
  }

  private generateUrl(
    settings: SettingValues,
    urlOrFunction: StringOrFunction,
  ): URL {
    this.validateSettings(settings);
    const url =
      typeof urlOrFunction === "function"
        ? urlOrFunction(settings)
        : urlOrFunction;
    return new URL(url);
  }

  /**
   * Validates the provided settings against the required setting fields.
   * Sets default values for fields with defaults if not provided by the user.
   * @param settings - The settings object to validate.
   * @throws {Error} If required settings are missing and have no default value.
   */
  private validateSettings(settings: SettingValues): void {
    const fields = this.auth.getSettingFields();
    for (const field of fields) {
      if (!(field.key in settings)) {
        if (field.required && field.default === undefined) {
          throw new Error(`Missing required setting: ${field.key}`);
        } else if (field.default !== undefined) {
          settings[field.key] = field.default;
        }
      }
    }
  }

  /**
   * Sets or updates the client options for the connector.
   * @param newOptions - The new options to set or update.
   */
  public setOptions(newOptions: Partial<ConnectorClientOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Gets the current client options.
   * @returns The current client options.
   */
  public getOptions(): ConnectorClientOptions {
    return { ...this.options };
  }
}

// Re-export types for convenience
export * from "./types";

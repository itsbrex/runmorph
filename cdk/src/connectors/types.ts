export interface SettingField {
  key: string;
  type: "text" | "select" | "multiselect" | "number";
  required: boolean;
  description: string;
  default?: string;
  options?: Array<{
    key: string;
    value: string;
  }>;
}

export type SettingValues = {
  [key: string]: string | number | string[];
};

export type StringOrFunction = string | ((settings: SettingValues) => string); // eslint-disable-line @typescript-eslint/no-unused-vars

export interface ConnectorClientOptions {
  clientId?: string;
  clientSecret?: string;
}

export interface ConnectorOptions<I extends string> {
  id: I;
  name: string;
  auth: {
    type: string;
    settingFields?: SettingField[] | (() => SettingField[]);
    defaultScopes?: string[];
    authorizeUrl: StringOrFunction;
    accessTokenUrl: StringOrFunction;
  };
  proxy: {
    baseUrl: StringOrFunction;
  };
}

export interface ConnectorAuth {
  type: string;
  getSettingFields: () => SettingField[];
  getDefaultScopes: () => string[];
  generateAuthorizeUrl: (settings: SettingValues) => URL;
  generateAccessTokenUrl: (settings: SettingValues) => URL;
}

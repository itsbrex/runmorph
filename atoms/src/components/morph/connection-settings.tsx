import { ConnectionSettingsClient } from "./connection-settings-client";

export function ConnectionSettings() {
  return <ConnectionSettingsClient />;
}

// Re-export types if needed
export type { ConnectorSetting, Connector } from "./connection-settings-client";

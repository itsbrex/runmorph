import type { morph } from "@/morph";

// Example of how to export a Morph connector for generating an app marketplace listing
// This structure allows you to list and display connectors available for integration in the playground/connectors/page.tsx
export interface ConnectorListingEntry {
  id: Parameters<ReturnType<(typeof morph)["connectors"]>["retrieve"]>[0];
  name: string;
  description: string;
  logo?: string;
}

export const connectorListing: ConnectorListingEntry[] = [
  {
    id: "hubspot",
    name: "Hubspot",
    description:
      "Public test credentials: \n→ conscience-limousines0f@icloud.com \n→ faqcir-butvo2-xynbEs",
    logo: "/connectors/hubspot.svg",
  },
];

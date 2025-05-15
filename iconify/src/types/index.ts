import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

export type ConnectorId = "hubspot" | "salesforce" | "figma";

export type Tone =
  | "tinted"
  | "lightened"
  | "darkened"
  | "balanced"
  | "duotone"
  | "tritone"
  | "blend";

export type Preset = string;

export type Palette = string[];

import { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

export type Tone =
  | "solid"
  | "tinted"
  | "duotone"
  | "tritone"
  | "blend"
  | "lightened"
  | "darkened"
  | "balanced";

export type PresetResult = {
  props?: Partial<IconComponentProps>;
  children?: React.ReactNode;
};

export type PresetFunction = (args: {
  props: IconComponentProps & {
    defaultPalette: Palette;
  };
  children: React.ReactNode;
}) => PresetResult;

export type IconComponentProps = {
  tone?: Tone;
  colors?: Palette;
  color?: string;
  size?: number;
  preset?: string;
};

export type Palette = string[];

export type SvgBundle<TPalette extends Palette> = {
  palette: TPalette;
  svg: React.FC<{
    palette: TPalette;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
  }>;
};

export type IconPresetFunction = (
  props: Partial<IconComponentProps>
) => IconComponentProps;

export type IconPresets = Record<string, IconPresetFunction>;

export interface IconWithPresetProps extends IconComponentProps {
  preset?: string;
}

export interface SvgComponentProps {
  width?: number;
  height?: number;
  colors?: string[];
  style?: React.CSSProperties;
}

// Updated custom icon builder types
export type CustomIconPresetFunction<TCustomProperties> = (
  props: Partial<IconComponentProps>,
  customProps: TCustomProperties
) => IconComponentProps;

// Change this to use a generic for preset names
export type CustomIconPresets<
  TPresetNames extends string,
  TCustomProperties,
> = {
  [K in TPresetNames]: CustomIconPresetFunction<TCustomProperties>;
};

export type CustomIconProps<
  TPresetNames extends string,
  TCustomProperties,
> = Omit<IconComponentProps, "preset"> &
  TCustomProperties & {
    preset?: TPresetNames;
  };

// Update the config interface to include the preset names
export interface IconComponentConfig<
  TPresetNames extends string,
  TCustomProperties,
> {
  properties: readonly (keyof TCustomProperties)[];
  presets: CustomIconPresets<TPresetNames, TCustomProperties>;
}

export type IconComponent = ForwardRefExoticComponent<
  IconComponentProps & RefAttributes<SVGSVGElement>
>;

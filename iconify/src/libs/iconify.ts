import React, { forwardRef } from "react";
import type {
  IconComponentProps,
  Palette,
  PresetFunction,
  SvgBundle,
  Tone,
} from "@/types";
import { hexToHsl, hexToRgb } from "@/libs/utils";

// Color scale levels and their corresponding lightness values
const COLOR_SCALE_MAP = {
  "50": 98, // Very light
  "100": 95,
  "200": 90,
  "300": 83,
  "400": 75,
  "500": 65,
  "600": 55,
  "700": 45,
  "800": 35,
  "900": 25,
  "950": 15, // Very dark
} as const;

// Split scale into light and dark ranges
const LIGHT_SCALE = ["50", "100", "200", "300", "400", "500"] as const;
const DARK_SCALE = ["600", "700", "800", "900", "950"] as const;
const BALANCED_SCALE = ["400", "500", "600"] as const;

type LightScaleKey = (typeof LIGHT_SCALE)[number];
type DarkScaleKey = (typeof DARK_SCALE)[number];
type BalancedScaleKey = (typeof BALANCED_SCALE)[number];

function generateColorScale(
  baseColor: string
): Record<keyof typeof COLOR_SCALE_MAP, string> {
  const baseHsl = hexToHsl(baseColor).match(/\d+/g);
  if (!baseHsl || baseHsl.length !== 3)
    return Object.fromEntries(
      Object.entries(COLOR_SCALE_MAP).map(([key]) => [key, baseColor])
    ) as Record<keyof typeof COLOR_SCALE_MAP, string>;

  const [h, s] = baseHsl.map(Number);

  // Find the closest lightness in the scale to determine the base scale position
  const baseLightness = Number(baseHsl[2]);
  const scaleEntries = Object.entries(COLOR_SCALE_MAP);
  const baseScalePosition = scaleEntries.reduce((closest, [key, l]) =>
    Math.abs(l - baseLightness) < Math.abs(closest[1] - baseLightness)
      ? [key, l]
      : closest
  )[0];

  // Generate the full scale
  return Object.fromEntries(
    Object.entries(COLOR_SCALE_MAP).map(([key, targetLightness]) => {
      // Adjust saturation based on lightness (more saturated in the middle, less at extremes)
      const saturationAdjust = 1 - Math.abs(targetLightness - 65) / 100;
      const adjustedS = Math.min(100, s * (0.8 + saturationAdjust * 0.4));

      return [key, `hsl(${h}, ${adjustedS}%, ${targetLightness}%)`];
    })
  ) as Record<keyof typeof COLOR_SCALE_MAP, string>;
}

function setDuotonePalette(
  defaultPalette: Palette,
  colors: [string, string]
): Palette {
  // Get lightness values for the two input colors
  const [color1, color2] = colors;

  // If there's only one color in default palette, use the first input color
  if (defaultPalette.length === 1) {
    return [color1] as Palette;
  }

  // Map default palette colors to their lightness values
  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return {
      l: hsl ? Number(hsl[2]) : 50,
      original: color,
    };
  });

  // Sort by lightness and find a weighted split point (60/40 split favoring first color)
  const sortedLightness = [...originalHSLs].sort((a, b) => a.l - b.l);
  const splitIndex = Math.ceil(sortedLightness.length * 0.6); // 60% of colors use first color
  const splitLightness = sortedLightness[splitIndex - 1].l;

  // Replace each color with the appropriate input color
  const duotoneColors = originalHSLs.map(({ l }) => {
    return l <= splitLightness ? color1 : color2;
  });

  return [duotoneColors[0], ...duotoneColors.slice(1)] as Palette;
}

function setTintedPalette(defaultPalette: Palette, baseColor: string): Palette {
  // Generate the color scale for the base color
  const colorScale = generateColorScale(baseColor);
  const scaleEntries = Object.entries(COLOR_SCALE_MAP);

  // Map default palette colors to their lightness values
  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  // Map each color to the closest color in the generated scale
  const tintedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const targetLightness = minLightness + normalizedLightness * (98 - 15); // Map to scale range (15-98)

    // Find the closest lightness in the scale
    const [scaleKey] = scaleEntries.reduce((closest, [key, scaleLightness]) =>
      Math.abs(scaleLightness - targetLightness) <
      Math.abs(closest[1] - targetLightness)
        ? [key, scaleLightness]
        : closest
    );

    return colorScale[scaleKey as keyof typeof COLOR_SCALE_MAP];
  });

  return [tintedColors[0], ...tintedColors.slice(1)] as Palette;
}

function setTritonePalette(
  defaultPalette: Palette,
  colors: [string, string, string]
): Palette {
  // Get the three input colors
  const [color1, color2, color3] = colors;

  // If there's only one color in default palette, use the first input color
  if (defaultPalette.length === 1) {
    return [color1] as Palette;
  }

  // Map default palette colors to their lightness values
  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return {
      l: hsl ? Number(hsl[2]) : 50,
      original: color,
    };
  });

  // Sort by lightness and find weighted split points (40/35/25 split)
  const sortedLightness = [...originalHSLs].sort((a, b) => a.l - b.l);
  const firstSplitIndex = Math.ceil(sortedLightness.length * 0.4); // First 40% uses color1
  const secondSplitIndex = Math.ceil(sortedLightness.length * 0.75); // Next 35% uses color2, remaining 25% uses color3
  const firstSplitLightness = sortedLightness[firstSplitIndex - 1].l;
  const secondSplitLightness = sortedLightness[secondSplitIndex - 1].l;

  // Replace each color with the appropriate input color
  const tritoneColors = originalHSLs.map(({ l }) => {
    if (l <= firstSplitLightness) return color1;
    if (l <= secondSplitLightness) return color2;
    return color3;
  });

  return [tritoneColors[0], ...tritoneColors.slice(1)] as Palette;
}

function setBlendPalette(defaultPalette: Palette, baseColor: string): Palette {
  // Get lightness distribution from original palette
  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  // Create base color variants
  const baseHsl = hexToHsl(baseColor).match(/\d+/g);
  const baseLightness = baseHsl ? Number(baseHsl[2]) : 50;
  const isDarkColor = baseLightness < 50;

  const blendedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const rgb = hexToRgb(baseColor).match(/\d+/g);
    if (!rgb || rgb.length !== 3) return baseColor;

    const [r, g, b] = rgb.map(Number);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return baseColor;

    // First create a scale similar to tinted
    let scaledColor: { r: number; g: number; b: number };
    if (isDarkColor) {
      const maxBrightness = 0.7;
      const brightness = normalizedLightness * maxBrightness;
      scaledColor = {
        r: Math.round(r + (255 - r) * brightness),
        g: Math.round(g + (255 - g) * brightness),
        b: Math.round(b + (255 - b) * brightness),
      };
    } else {
      const minBrightness = 0.6;
      const brightness =
        minBrightness + (1 - minBrightness) * normalizedLightness;
      scaledColor = {
        r: Math.round(r * brightness),
        g: Math.round(g * brightness),
        b: Math.round(b * brightness),
      };
    }

    // Then apply transparency based on lightness
    const alpha = Math.round((0.4 + normalizedLightness * 0.6) * 255); // 40-100% opacity range
    const toHex = (n: number) =>
      Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
    return `#${toHex(scaledColor.r)}${toHex(scaledColor.g)}${toHex(scaledColor.b)}${toHex(alpha)}`;
  });

  return [blendedColors[0], ...blendedColors.slice(1)] as Palette;
}

function setLightenedPalette(
  defaultPalette: Palette,
  baseColor: string
): Palette {
  // Generate the color scale for the base color
  const colorScale = generateColorScale(baseColor);
  const scaleEntries = Object.entries(COLOR_SCALE_MAP)
    .filter(([key]) => LIGHT_SCALE.includes(key as LightScaleKey))
    .map(([key, value]) => [key as LightScaleKey, value] as const);

  // Map default palette colors to their lightness values
  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  // Map each color to the closest color in the light range of the scale
  const lightenedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const targetLightness = 65 + normalizedLightness * (98 - 65); // Map to light range (65-98)

    // Find the closest lightness in the scale
    const [scaleKey] = scaleEntries.reduce((closest, [key, scaleLightness]) =>
      Math.abs(scaleLightness - targetLightness) <
      Math.abs(closest[1] - targetLightness)
        ? [key, scaleLightness]
        : closest
    );

    return colorScale[scaleKey];
  });

  return [lightenedColors[0], ...lightenedColors.slice(1)] as Palette;
}

function setDarkenedPalette(
  defaultPalette: Palette,
  baseColor: string
): Palette {
  // Generate the color scale for the base color
  const colorScale = generateColorScale(baseColor);
  const scaleEntries = Object.entries(COLOR_SCALE_MAP)
    .filter(([key]) => DARK_SCALE.includes(key as DarkScaleKey))
    .map(([key, value]) => [key as DarkScaleKey, value] as const);

  // Map default palette colors to their lightness values
  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  // Map each color to the closest color in the dark range of the scale
  const darkenedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const targetLightness = 15 + normalizedLightness * (55 - 15); // Map to dark range (15-55)

    // Find the closest lightness in the scale
    const [scaleKey] = scaleEntries.reduce((closest, [key, scaleLightness]) =>
      Math.abs(scaleLightness - targetLightness) <
      Math.abs(closest[1] - targetLightness)
        ? [key, scaleLightness]
        : closest
    );

    return colorScale[scaleKey];
  });

  return [darkenedColors[0], ...darkenedColors.slice(1)] as Palette;
}

function setBalancedPalette(
  defaultPalette: Palette,
  baseColor: string
): Palette {
  // Generate the color scale for the base color
  const colorScale = generateColorScale(baseColor);
  const scaleEntries = Object.entries(COLOR_SCALE_MAP)
    .filter(([key]) => BALANCED_SCALE.includes(key as BalancedScaleKey))
    .map(([key, value]) => [key as BalancedScaleKey, value] as const);

  // Map default palette colors to their lightness values
  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  // Map each color to the closest color in the balanced range of the scale
  const balancedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const targetLightness = 55 + normalizedLightness * (75 - 55); // Map to balanced range (55-75)

    // Find the closest lightness in the scale
    const [scaleKey] = scaleEntries.reduce((closest, [key, scaleLightness]) =>
      Math.abs(scaleLightness - targetLightness) <
      Math.abs(closest[1] - targetLightness)
        ? [key, scaleLightness]
        : closest
    );

    return colorScale[scaleKey];
  });

  return [balancedColors[0], ...balancedColors.slice(1)] as Palette;
}

// Static presets store
const svgPresets = new Map<string, PresetFunction>();

/**
 * Static preset management for SVG components
 */
export const IconPresets = {
  add: (name: string, preset: PresetFunction) => {
    svgPresets.set(name, preset);
  },
  get: (name: string) => svgPresets.get(name),
  has: (name: string) => svgPresets.has(name),
  remove: (name: string) => svgPresets.delete(name),
  clear: () => svgPresets.clear(),
};

/**
 * Creates a standardized SVG bundle with a palette and render function
 * @param palette - Array of colors used in the SVG
 * @param renderSvg - Function that renders the SVG using the provided palette
 * @returns A typed SvgBundle object containing the palette and render function
 */
export function iconify<TPalette extends Palette>({
  defaultPalette,
  renderSvg,
}: {
  defaultPalette: TPalette;
  renderSvg: React.FC<{
    palette: TPalette | Palette;
    size: number;
  }>;
}): React.FC<IconComponentProps> {
  return (props) => {
    // Apply preset transformations to props if specified
    let currentProps = { ...props, defaultPalette };
    let renderedContent;

    // Apply preset props first if specified
    if (props.preset && svgPresets.has(props.preset)) {
      const preset = svgPresets.get(props.preset)!;
      const presetResult = preset({
        props: currentProps,
        // Pass a placeholder for children since we haven't rendered yet
        children: null,
      });

      // Update props based on preset result
      if (presetResult.props) {
        currentProps = {
          ...currentProps,
          ...presetResult.props,
        };
      }
    }

    // Now render the SVG with the potentially modified props
    let finalPalette: Palette;

    // Handle single color case
    if (currentProps.color) {
      finalPalette = [currentProps.color] as Palette;
    } else {
      finalPalette = currentProps.colors ?? defaultPalette;
    }

    if (finalPalette.length < defaultPalette.length) {
      const repeatedColors = Array(
        Math.ceil(defaultPalette.length / finalPalette.length)
      )
        .fill(finalPalette)
        .flat()
        .slice(0, defaultPalette.length) as unknown as Palette;
      finalPalette = repeatedColors;
    }

    const getPaletteForTone = (tone: Tone | undefined): Palette => {
      if (!tone) return finalPalette;

      switch (tone) {
        case "tinted":
          return setTintedPalette(defaultPalette, finalPalette[0]);
        case "lightened":
          return setLightenedPalette(defaultPalette, finalPalette[0]);
        case "darkened":
          return setDarkenedPalette(defaultPalette, finalPalette[0]);
        case "balanced":
          return setBalancedPalette(defaultPalette, finalPalette[0]);
        case "duotone":
          return finalPalette.length >= 2
            ? setDuotonePalette(defaultPalette, [
                finalPalette[0],
                finalPalette[1],
              ])
            : finalPalette;
        case "tritone":
          return finalPalette.length >= 3
            ? setTritonePalette(defaultPalette, [
                finalPalette[0],
                finalPalette[1],
                finalPalette[2],
              ])
            : finalPalette;
        case "blend":
          return setBlendPalette(defaultPalette, finalPalette[0]);
        default:
          return finalPalette;
      }
    };

    const renderProps = {
      palette: getPaletteForTone(currentProps.tone),
      size: currentProps.size ?? 20,
      tone: currentProps.tone ?? "solid",
    };

    const renderedSvg = renderSvg(renderProps);

    // Apply preset wrapper if specified
    if (props.preset && svgPresets.has(props.preset)) {
      const preset = svgPresets.get(props.preset)!;
      const presetResult = preset({
        props: currentProps,
        children: renderedSvg,
      });

      // Return the wrapped content
      return presetResult.children ?? renderedSvg;
    }

    return renderedSvg;
  };
}

interface iconifyOptions {
  defaultPalette: Palette;
  renderSvg: (props: { palette: Palette; size: number }) => JSX.Element;
}
/*
export function iconify({
  defaultPalette,
  renderSvg,
}: iconifyOptions): IconComponent {
  return forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, palette = defaultPalette, ...props }, ref) => {
      return renderSvg({ palette, size });
    }
  );
}
*/

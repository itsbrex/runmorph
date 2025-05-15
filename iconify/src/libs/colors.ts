import type { Palette } from "@/types";
import { hexToHsl, hexToRgb } from "./utils";

// Color scale levels and their corresponding lightness values
export const COLOR_SCALE_MAP = {
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

export const LIGHT_SCALE = ["50", "100", "200", "300", "400", "500"] as const;
export const DARK_SCALE = ["600", "700", "800", "900", "950"] as const;
export const BALANCED_SCALE = ["400", "500", "600"] as const;

export type LightScaleKey = (typeof LIGHT_SCALE)[number];
export type DarkScaleKey = (typeof DARK_SCALE)[number];
export type BalancedScaleKey = (typeof BALANCED_SCALE)[number];

export function generateColorScale(
  baseColor: string
): Record<keyof typeof COLOR_SCALE_MAP, string> {
  const baseHsl = hexToHsl(baseColor).match(/\d+/g);
  if (!baseHsl || baseHsl.length !== 3)
    return Object.fromEntries(
      Object.entries(COLOR_SCALE_MAP).map(([key]) => [key, baseColor])
    ) as Record<keyof typeof COLOR_SCALE_MAP, string>;

  const [h, s] = baseHsl.map(Number);

  return Object.fromEntries(
    Object.entries(COLOR_SCALE_MAP).map(([key, targetLightness]) => {
      const saturationAdjust = 1 - Math.abs(targetLightness - 65) / 100;
      const adjustedS = Math.min(100, s * (0.8 + saturationAdjust * 0.4));
      return [key, `hsl(${h}, ${adjustedS}%, ${targetLightness}%)`];
    })
  ) as Record<keyof typeof COLOR_SCALE_MAP, string>;
}

export function setDuotonePalette(
  defaultPalette: Palette,
  colors: [string, string]
): Palette {
  const [color1, color2] = colors;
  if (defaultPalette.length === 1) return [color1] as Palette;

  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return { l: hsl ? Number(hsl[2]) : 50, original: color };
  });

  const sortedLightness = [...originalHSLs].sort((a, b) => a.l - b.l);
  const splitIndex = Math.ceil(sortedLightness.length * 0.6);
  const splitLightness = sortedLightness[splitIndex - 1].l;

  const duotoneColors = originalHSLs.map(({ l }) =>
    l <= splitLightness ? color1 : color2
  );
  return [duotoneColors[0], ...duotoneColors.slice(1)] as Palette;
}

export function setTintedPalette(
  defaultPalette: Palette,
  baseColor: string
): Palette {
  const colorScale = generateColorScale(baseColor);
  const scaleEntries = Object.entries(COLOR_SCALE_MAP);

  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  const tintedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const targetLightness = minLightness + normalizedLightness * (98 - 15);

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

export function setTritonePalette(
  defaultPalette: Palette,
  colors: [string, string, string]
): Palette {
  const [color1, color2, color3] = colors;
  if (defaultPalette.length === 1) return [color1] as Palette;

  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return { l: hsl ? Number(hsl[2]) : 50, original: color };
  });

  const sortedLightness = [...originalHSLs].sort((a, b) => a.l - b.l);
  const firstSplitIndex = Math.ceil(sortedLightness.length * 0.4);
  const secondSplitIndex = Math.ceil(sortedLightness.length * 0.75);
  const firstSplitLightness = sortedLightness[firstSplitIndex - 1].l;
  const secondSplitLightness = sortedLightness[secondSplitIndex - 1].l;

  const tritoneColors = originalHSLs.map(({ l }) => {
    if (l <= firstSplitLightness) return color1;
    if (l <= secondSplitLightness) return color2;
    return color3;
  });

  return [tritoneColors[0], ...tritoneColors.slice(1)] as Palette;
}

export function setBlendPalette(
  defaultPalette: Palette,
  baseColor: string
): Palette {
  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  const baseHsl = hexToHsl(baseColor).match(/\d+/g);
  const baseLightness = baseHsl ? Number(baseHsl[2]) : 50;
  const isDarkColor = baseLightness < 50;

  const blendedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const rgb = hexToRgb(baseColor).match(/\d+/g);
    if (!rgb || rgb.length !== 3) return baseColor;

    const [r, g, b] = rgb.map(Number);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return baseColor;

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

    const alpha = Math.round((0.4 + normalizedLightness * 0.6) * 255);
    const toHex = (n: number) =>
      Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
    return `#${toHex(scaledColor.r)}${toHex(scaledColor.g)}${toHex(scaledColor.b)}${toHex(alpha)}`;
  });

  return [blendedColors[0], ...blendedColors.slice(1)] as Palette;
}

export function setLightenedPalette(
  defaultPalette: Palette,
  baseColor: string
): Palette {
  const colorScale = generateColorScale(baseColor);
  const scaleEntries = Object.entries(COLOR_SCALE_MAP)
    .filter(([key]) => LIGHT_SCALE.includes(key as LightScaleKey))
    .map(([key, value]) => [key as LightScaleKey, value] as const);

  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  const lightenedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const targetLightness = 65 + normalizedLightness * (98 - 65);

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

export function setDarkenedPalette(
  defaultPalette: Palette,
  baseColor: string
): Palette {
  const colorScale = generateColorScale(baseColor);
  const scaleEntries = Object.entries(COLOR_SCALE_MAP)
    .filter(([key]) => DARK_SCALE.includes(key as DarkScaleKey))
    .map(([key, value]) => [key as DarkScaleKey, value] as const);

  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  const darkenedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const targetLightness = 15 + normalizedLightness * (55 - 15);

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

export function setBalancedPalette(
  defaultPalette: Palette,
  baseColor: string
): Palette {
  const colorScale = generateColorScale(baseColor);
  const scaleEntries = Object.entries(COLOR_SCALE_MAP)
    .filter(([key]) => BALANCED_SCALE.includes(key as BalancedScaleKey))
    .map(([key, value]) => [key as BalancedScaleKey, value] as const);

  const originalHSLs = defaultPalette.map((color) => {
    const hsl = hexToHsl(color).match(/\d+/g);
    return hsl
      ? { l: Number(hsl[2]), original: color }
      : { l: 50, original: color };
  });

  const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
  const minLightness = Math.min(...originalHSLs.map((h) => h.l));
  const lightnessRange = maxLightness - minLightness || 1;

  const balancedColors = originalHSLs.map(({ l }) => {
    const normalizedLightness = (l - minLightness) / lightnessRange;
    const targetLightness = 55 + normalizedLightness * (75 - 55);

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

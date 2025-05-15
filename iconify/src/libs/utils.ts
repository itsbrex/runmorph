export function hexToRgb(hex: string): string {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "rgb(0, 0, 0)";

  const [, r, g, b] = result;
  return `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`;
}

export function hexToHsl(hex: string): string {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.match(/\d+/g)?.map(Number) || [0, 0, 0];

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }

    h *= 60;
  }

  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// Get relative luminance of a color
export function getLuminance(hex: string): number {
  try {
    const rgb = hexToRgb(hex).match(/\d+/g);
    if (!rgb || rgb.length !== 3) return 0;
    const [r, g, b] = rgb.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  } catch (error) {
    return 0;
  }
}

// Adjust color brightness
export function adjustBrightness(hex: string, factor: number): string {
  try {
    const rgb = hexToRgb(hex).match(/\d+/g);
    if (!rgb || rgb.length !== 3) return hex;

    const hsl = hexToHsl(hex).match(/\d+/g);
    if (!hsl || hsl.length !== 3) return hex;

    const [h, s, l] = hsl.map(Number);
    const newL = Math.min(100, Math.max(0, l * factor));
    return hslToHex(h, s, newL);
  } catch (error) {
    return hex;
  }
}

// Convert HSL to Hex with error handling
function hslToHex(h: number, s: number, l: number): string {
  try {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch (error) {
    return "#000000";
  }
}

// Create a color scale based on original palette luminance ratios
export function createColorScale(
  baseColor: string,
  originalPalette: readonly string[]
): readonly string[] {
  try {
    // Handle invalid inputs
    if (!baseColor || !originalPalette || originalPalette.length === 0) {
      return [baseColor] as const;
    }

    // Get the HSL values from the original palette
    const originalHSLs = originalPalette.map((color) => {
      try {
        const hsl = hexToHsl(color).match(/\d+/g);
        if (!hsl) return { l: 50, original: color };
        return { l: Number(hsl[2]), original: color };
      } catch (error) {
        return { l: 50, original: color };
      }
    });

    // Find the brightest color's lightness
    const maxLightness = Math.max(...originalHSLs.map((h) => h.l));
    if (maxLightness === 0) return originalPalette;

    // Calculate the scaling factor to map the brightest color to the base color
    const newPalette = originalHSLs.map(({ l }) => {
      try {
        const relativeBrightness = l / maxLightness;
        const baseRgb = hexToRgb(baseColor).match(/\d+/g);
        if (!baseRgb) return baseColor;

        const [r, g, b] = baseRgb.map(Number);
        const scaledR = Math.round(r * relativeBrightness);
        const scaledG = Math.round(g * relativeBrightness);
        const scaledB = Math.round(b * relativeBrightness);

        const toHex = (n: number) =>
          Math.min(255, n).toString(16).padStart(2, "0");
        return `#${toHex(scaledR)}${toHex(scaledG)}${toHex(scaledB)}`;
      } catch (error) {
        return baseColor;
      }
    });

    return newPalette;
  } catch (error) {
    return originalPalette;
  }
}

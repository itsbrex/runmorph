# @runmorph/iconify

A powerful CLI tool for converting SVG files into fully-typed React components with advanced color manipulation, preset system, and global styling capabilities.

[![npm version](https://badge.fury.io/js/@runmorph%2Ficons.svg)](https://badge.fury.io/js/@runmorph%2Ficons)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🛠️ CLI tool for batch SVG to React component conversion
- 🎨 Advanced color manipulation with tones (tinted, lightened, darkened, etc.)
- 🎭 Multiple color modes: duotone, tritone, blend, and more
- 🎯 Global preset system for consistent icon styling
- 💪 Full TypeScript support with type-safe presets
- 🔄 Automatic color scale generation
- 📦 Tree-shakeable exports
- 🎪 Support for complex SVG features (masks, clip paths, groups)
- 🌈 HSL/RGB color space transformations
- 🎛️ Extensive customization options

## Table of Contents

- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [Component Usage](#component-usage)
- [Color Manipulation](#color-manipulation)
- [Preset System](#preset-system)
- [API Reference](#api-reference)
- [Development](#development)

## Installation

```bash
# Using yarn (recommended)
yarn add @runmorph/iconify

# Using npm
npm install @runmorph/iconify

# Using pnpm
pnpm add @runmorph/iconify
```

## CLI Usage

Convert your SVG files into React components:

```bash
# Basic usage
iconify generate --source ./svgs --target ./src/components/icons
```

### CLI Options

| Option   | Description                     | Default                          |
| -------- | ------------------------------- | -------------------------------- |
| --source | Source directory with SVG files | "./src/components/icons/.source" |
| --target | Output directory                | "./src/components/icons"         |

## Component Usage

### Basic Usage

```tsx
import { HubSpotIcon } from "@/components/icons";

function App() {
  return <HubSpotIcon size={32} />;
}
```

### Color Manipulation

The package provides several color manipulation modes (tones):

```tsx
import { HubSpotIcon } from "@/components/icons";

function App() {
  return (
    <div>
      {/* Basic color customization */}
      <HubSpotIcon color="#FF0000" />

      {/* Using tones */}
      <HubSpotIcon tone="tinted" color="#FF0000" />
      <HubSpotIcon tone="lightened" color="#FF0000" />
      <HubSpotIcon tone="darkened" color="#FF0000" />
      <HubSpotIcon tone="balanced" color="#FF0000" />

      {/* Multi-color modes */}
      <HubSpotIcon tone="duotone" colors={["#FF0000", "#00FF00"]} />

      <HubSpotIcon tone="tritone" colors={["#FF0000", "#00FF00", "#0000FF"]} />

      <HubSpotIcon tone="blend" color="#FF0000" />
    </div>
  );
}
```

### Global Presets

Create reusable icon styles with the preset system:

```tsx
import { IconPresets } from "@runmorph/iconify";

// Define a global preset
IconPresets.add("black-bg", ({ props, children }) => {
  return {
    props: {
      // Modify the SVG color palette
      color: "#FFFFFF",
      tone: "blend",
      // Increase the size
      size: (props.size || 20) * 4,
    },
    // Wrap the SVg in a div with black bg
    children: (
      <div
        style={{
          background: "#000000",
          padding: "5px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    ),
  };
});

// Use the preset
function App() {
  return <HubSpotIcon preset="black-bg" />;
}
```

### Custom Icon Component

Create your own icon component with the `iconify` utility:

```tsx
import { iconify } from "@runmorph/iconify";

const MyCustomIcon = iconify({
  defaultPalette: ["#000000", "#FF0000"],
  renderSvg: ({ palette, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="..." fill={palette[0]} />
      <path d="..." fill={palette[1]} />
    </svg>
  ),
});
```

## Color Manipulation Features

### Color Scale Generation

The package automatically generates color scales based on your base color:

- 11 scale levels (50-950)
- Intelligent saturation adjustment
- Maintains color harmony
- Supports HSL and RGB color spaces

### Available Tones

| Tone      | Description                                           |
| --------- | ----------------------------------------------------- |
| tinted    | Creates a tinted variation of the base color          |
| lightened | Generates lighter shades while maintaining hue        |
| darkened  | Generates darker shades while maintaining hue         |
| balanced  | Creates a balanced palette around the base color      |
| duotone   | Two-color palette with intelligent color distribution |
| tritone   | Three-color palette with weighted distribution        |
| blend     | Smooth color blending with transparency               |

## API Reference

### Icon Component Props

| Prop   | Type                                                                                     | Default | Description                    |
| ------ | ---------------------------------------------------------------------------------------- | ------- | ------------------------------ |
| size   | number                                                                                   | 24      | Icon size in pixels            |
| color  | string                                                                                   | -       | Primary color                  |
| colors | string[]                                                                                 | -       | Multiple colors for multi-tone |
| tone   | "tinted" \| "lightened" \| "darkened" \| "balanced" \| "duotone" \| "tritone" \| "blend" | -       | Color tone                     |
| preset | string                                                                                   | -       | Global preset name             |

### Utility Functions

The package exports several utility functions for color manipulation:

```tsx
import {
  hexToRgb,
  hexToHsl,
  generateColorScale,
  getLuminance,
  adjustBrightness,
} from "@runmorph/iconify";

// Convert colors between formats
const rgb = hexToRgb("#FF0000"); // "rgb(255, 0, 0)"
const hsl = hexToHsl("#FF0000"); // "hsl(0, 100%, 50%)"

// Generate a color scale
const scale = generateColorScale("#FF0000");
// Returns an object with 11 color variations (50-950)
```

## License

This project is licensed under the MIT License - see the [LICENSE](#LICENSE) file for details.

---

Made with ❤️ by [Morph](https://runmorph.dev)

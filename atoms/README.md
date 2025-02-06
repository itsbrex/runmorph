# @morph/ui

A modern React component library built with React 19, Tailwind CSS, and TypeScript.

## Installation

```bash
yarn add @morph/ui
```

## Setup

1. Add the following to your `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // ... your existing content
    "./node_modules/@morph/ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("@morph/ui/dist/tailwind.config.js")],
};
```

2. Add the following CSS to your global styles:

```css
@import "@morph/ui/dist/styles/globals.css";
```

## Usage

```tsx
import { Button } from "@morph/ui";

export default function MyComponent() {
  return (
    <Button variant="default" size="lg">
      Click me
    </Button>
  );
}
```

## Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
<Button variant="default" size="default">
  Default Button
</Button>

<Button variant="destructive" size="lg">
  Destructive Button
</Button>

<Button variant="outline" size="sm">
  Outline Button
</Button>
```

## Development

1. Install dependencies:

```bash
yarn install
```

2. Start the development environment:

```bash
yarn dev
```

3. Build the package:

```bash
yarn build
```

## License

MIT

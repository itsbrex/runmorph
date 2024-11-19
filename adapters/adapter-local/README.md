# @runmorph/adapter-local

A local file-system adapter for Morph SDK, perfect for development and testing purposes.

## Features

- Persists connections to `~/.morph/connections.json`
- No database setup required
- Implements the full Morph Adapter interface
- TypeScript support out of the box
- Maintains connections between application restarts

## Installation

```bash
yarn add @runmorph/adapter-local
```

## Usage

```typescript
import { Morph } from "@runmorph/core";
import { LocalAdapter } from "@runmorph/adapter-local";
import HubSpotConnector from "@runmorph/connector-hubspot";

const morph = Morph({
  connectors: [HubSpotConnector({})],
  database: { adapter: LocalAdapter() },
});
```

## Storage Location

Connections are stored in:

- `~/.morph/connections.json` on Unix-like systems (Linux, macOS)
- `C:\Users\YourUsername\.morph\connections.json` on Windows

This ensures your connections persist between application restarts during development.

## Important Notes

- Data is stored locally on the filesystem
- Perfect for development and testing scenarios
- Not suitable for production use
- Connections persist between application restarts

## License

ISC

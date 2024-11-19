# @runmorph/adapter-memory

An in-memory adapter for Morph SDK, perfect for prototyping and demo deployments.

## Features

- Simple in-memory storage
- No setup required
- Implements the full Morph Adapter interface
- TypeScript support out of the box
- Lightweight and fast

## Installation

```bash
yarn add @runmorph/adapter-memory
```

## Usage

```typescript
import { Morph } from "@runmorph/core";
import { MemoryAdapter } from "@runmorph/adapter-memory";
import HubSpotConnector from "@runmorph/connector-hubspot";

const morph = Morph({
  connectors: [HubSpotConnector({})],
  database: { adapter: MemoryAdapter() },
});
```

## Important Notes

- Data is stored in memory and will be cleared when the server restarts
- Perfect for prototyping and demo deployments
- Not suitable for production use
- No persistence between server restarts
- Should not be used in serverless environments where function instances may be recycled

## License

ISC

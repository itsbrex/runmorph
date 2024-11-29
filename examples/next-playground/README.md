![morph-next-playground-template-thumb](https://github.com/user-attachments/assets/d1c42af7-8186-42d9-b997-fe3e5aa2028f)

# Morph NextJS Starter Kit

A modern Next.js starter template for building third-party integrations with Morph SDK.

[Demo Playground](https://morph-next-playground-clone.vercel.app/playground/fake-user-6ivhxgnknnt/connectors)

## Deploy to Vercel

### Option 1: Deploy as part of monorepo

1. Fork the `runmorph` repository on GitHub
2. Create a new project in Vercel and import your forked repository
3. In the Vercel project settings:
   - Set the Root Directory to `examples/next-playground`
   - Leave the default Build Command and Output Directory
4. Deploy the project

### Option 2: Deploy standalone example

You can also deploy just this example directly to Vercel with one click:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/morphHQ/runmorph/tree/main/examples/next-playground&env=MORPH_ENCRYPTION_KEY,MORPH_CALLBACK_BASE_URL,NEXT_PUBLIC_MORPH_API_BASE_URL,MORPH_CONNECTOR_HUBSPOT_CLIENT_ID,MORPH_CONNECTOR_HUBSPOT_CLIENT_SECRET&envDescription=Environment%20variables%20for%20Morph%20integration&envLink=https://github.com/morphHQ/runmorph/tree/main/examples/next-playground#environment-variables)

## Features

- 🚀 Built with Next.js 14 and TypeScript
- 🔌 Unified connector interface
- 🔐 Built-in authentication handling (only OAuth2 for now)
- 📦 Modular architecture with pluggable connectors
- 🔄 Standardized CRUD operations for resources
- 🌐 Proxy capabilities for direct API access
- 📝 Type-safe operations with full TypeScript support
- 🗄️ Database adapter system for connection management

## Prerequisites

Before you begin, ensure you have installed:

- Node.js (v18 or higher)
- Yarn package manager

## Getting Started

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd next-app
yarn install
```

2. Set up your environment variables:

Copy `.env.example` to `.env.local` and update it with your configuration:

3. Start the development server:

```bash
yarn dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/morph/[...runmorph]/route.ts    # Morph next route handlers
│   └── page.tsx                             # Creating morph session
├── components/
│   ├── morph-connection-button.tsx          # Example of connection button component
│   └── morph-resource-list.tsx              # Example usage of .resources(...) method
└── morph.ts                                 # Morph configuration
```

## Configuration

### 1. Start with `morph.ts`

The Morph SDK is pre-configured in `src/morph.ts`. You can customize the configuration by modifying this file:

```typescript
// Import morph for Next
import { NextMorph } from "@runmorph/framework-next";
// Choose your database adapter (using local for quick local test)
import { LocalAdapter } from "@runmorph/adapter-local";
// Import connectors built with @runmorph/cdl
import HubSpotConnector from "@runmorph/connector-hubspot";

const { morph, handlers } = NextMorph({
  connectors: [
    // Add and setup connectors
    HubSpotConnector({
      clientId: process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_ID,
      clientSecret: process.env.MORPH_CONNECTOR_HUBSPOT_CLIENT_SECRET,
    }),
  ],
  database: { adapter: LocalAdapter() },
});

export { morph, handlers };
export type morph = typeof morph;
```

### 2. Add `route.ts` handlers

```typescript
import { handlers } from "@/morph";
export const { GET, POST } = handlers;
```

### 3. Add conection button to your `page.tsx`

```typescript
// Import morph instance
import { morph } from "@/morph";
// Import or create your own connection button
import { ConnectionButton } from "@/components/morph-connection-button";

export default async function Home() {
  // Fake owner id; to be replaced by authenticated user / organization id
  const OWNER_ID = "demo_owner_id";

  // Create a sessionToken to pass on to the connection button
  const { data, error } = await morph.sessions().create({
    connection: {
      ownerId: OWNER_ID,
      connectorId: "hubspot",
      operations: ["genericContact::list"],
    },
  });

  if (error) {
    throw error.message;
  }

  const { sessionToken } = data;

  return (<ConnectionButton sessionToken={sessionToken} />)
}
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
Join our [Slack community](https://join.slack.com/t/morphcommunity/shared_invite/zt-2tc1vo0n7-8lUPL8~D7wwjC4UmbujAUA)

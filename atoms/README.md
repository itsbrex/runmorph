# @runmorph/atoms

A powerful React SDK for seamlessly integrating Morph's unified connectors into your applications. Built with TypeScript for type safety and modern development practices.

## Features

- 🔒 Secure authentication and authorization flows
- 🎯 Easy-to-use React components
- 🌍 Internationalization support
- 🛠️ Customizable connection settings
- 📦 Framework agnostic (works with Next.js, Vite, CRA, Remix)
- 💪 Type-safe with full TypeScript support

## Installation

```bash
yarn add @runmorph/atoms @runmorph/cloud
```

## Quick Start

### 1. Configure Environment Variables

Add your Morph API credentials to your environment variables:

```env
# .env.local
NEXT_PUBLIC_MORPH_PUBLIC_KEY=pk_demo_xxxxxxxxxxxxxxx
MORPH_API_SECRET=sk_demo_xxxxxxxxxxxxxxx
```

Note: You can use these demo credentials to quickly test the SDK. For production use, replace them with your own API keys from the [Morph dashboard](https://runmorph.dev).

### 2. Add Morph Provider

Wrap your application with the `<Morph.Provider />` component in your root layout:

```tsx
// app/layout.tsx
import { Morph } from "@runmorph/atoms";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Morph.Provider>{children}</Morph.Provider>
      </body>
    </html>
  );
}
```

### 3. Generate Session Token

Create a server action or API route to generate the session token:

```tsx
// app/actions.ts
"use server";

import { Morph } from "@runmorph/cloud";

const morph = new Morph({
  publicKey: process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY!,
  secretKey: process.env.MORPH_API_SECRET!,
});

export async function generateSessionToken(ownerId: string) {
  const { sessionToken } = await morph.sessions().create({
    connectorId: "salesforce", // or any supported connector
    ownerId, // A unique identifier for your end-user (e.g. "user_123"). Use "demo" with demo credentials
    operations: ["genericContact::list"], // Specify the operations you need - this will determines the required OAuth scopes
  });

  return sessionToken;
}
```

### 4. Implement Connection Component

Create a client component that uses the session token:

```tsx
// app/components/ConnectionComponent.tsx
"use client";

import { Connect } from "@runmorph/atoms";

export function ConnectionComponent({
  sessionToken,
}: {
  sessionToken: string;
}) {
  return (
    <Connect
      sessionToken={sessionToken}
      connectionCallbacks={{
        onError: (error) => console.error(error),
        onSuccess: (connection) => console.log("Connected!", connection),
      }}
    />
  );
}
```

Use the components in your page:

```tsx
// app/page.tsx
"use server";

import { generateSessionToken } from "./actions";
import { ConnectionComponent } from "./components/ConnectionComponent";

export default async function Page() {
  const sessionToken = await generateSessionToken("demo");

  return <ConnectionComponent sessionToken={sessionToken} />;
}
```

## Core Components

### Morph.Provider

The foundation of the SDK that initializes Morph and provides configuration context:

```tsx
<Morph.Provider config={{ publicKey: "pk_demo_xxxxxxxxxxxxxxx" }}>
  {children}
</Morph.Provider>
```

### Connect

Handles the connection and authorization flow:

```tsx
<Connect
  sessionToken={sessionToken}
  connectionCallbacks={{
    onSuccess: (connection) => console.log("Connected!", connection),
    onError: (error) => console.error("Connection failed:", error),
  }}
/>
```

## Advanced Usage

### Custom Authorization Flow

Create custom authorization UI with fine-grained control using the `<Connection.Triggers.Authorize />` component:

```tsx
"use client";
import { Connection } from "@runmorph/atoms";
import { Button } from "./ui/button";

function CustomConnectButton({ sessionToken }) {
  return (
    <Connection.Provider sessionToken={sessionToken}>
      <Connection.Triggers.Authorize
        windowMode="popup" // or "redirect"
        connectionCallbacks={{
          onError: (error) => console.error("Error:", error),
        }}
      >
        <Button>Connect Account</Button>
      </Connection.Triggers.Authorize>
    </Connection.Provider>
  );
}
```

### Connection Management

Handle connection deletion with confirmation using `Connection.Triggers.Delete`:

```tsx
"use client";
import { Connection } from "@runmorph/atoms";
import { Button } from "./ui/button";

function DeleteConnectionButton({ sessionToken }) {
  return (
    <Connection.Provider sessionToken={sessionToken}>
      <Connection.Triggers.Delete
        connectionCallbacks={{
          onError: (error) => console.error("Deletion failed:", error),
        }}
      >
        <Button variant="destructive">Delete Connection</Button>
      </Connection.Triggers.Delete>
    </Connection.Provider>
  );
}
```

### Connection Settings

Configure connector-specific settings using the `Connection.Settings` component:

```tsx
"use client";
import { Connection } from "@runmorph/atoms";
import { Button } from "./ui/button";

function ConnectorSettings({ sessionToken }) {
  return (
    <Connection.Provider sessionToken={sessionToken}>
      <Connection.Settings />
      <Connection.Triggers.Authorize
        windowMode="popup" // or "redirect"
        connectionCallbacks={{
          onError: (error) => console.error("Error:", error),
        }}
      >
        <Button>Connect</Button>
      </Connection.Triggers.Authorize>
    </Connection.Provider>
  );
}
```

### Internationalization

Support multiple languages by providing translations through the provider:

```tsx
"use client";
import { Connection } from "@runmorph/atoms";

const translations = {
  "settings.status.loading": "Loading settings...",
  "settings.status.error": "Error loading settings",
  "settings.status.noConnector": "No connector found",
  "triggers.authorize.errors.popupBlocked": "Popup was blocked",
  "triggers.delete.errors.missingToken": "Session token is required",
};

function LocalizedConnection({ sessionToken, children }) {
  return (
    <Connection.Provider
      sessionToken={sessionToken}
      t={(key) => translations[key] || key}
    >
      {children}
    </Connection.Provider>
  );
}
```

## Security Best Practices

1. Never expose your private key in client-side code
2. Use environment variables for key management
3. Implement proper CSP policies
4. Keep your public key secure and rotate if compromised

## TypeScript Support

The package is written in TypeScript and includes comprehensive type definitions. Enable strict mode in your `tsconfig.json` for the best development experience:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

## API Reference

For detailed API documentation, visit our [official documentation](https://docs.runmorph.dev/api-reference/atoms).

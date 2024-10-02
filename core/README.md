### Core SDK Strucutre

morph-core/
├── src/
│ ├── Morph.ts
│ ├── Connection.ts
│ ├── Session.ts
│ ├── Resource.ts
│ ├── clients/
│ │ ├── BaseClient.ts
│ │ ├── ConnectionClient.ts
│ │ ├── SessionClient.ts
│ │ └── ResourceClient.ts
│ ├── authorization/
│ │ ├── BaseAuth.ts
│ │ ├── OAuth2/
│ │ │ ├── OAuth2Client.ts
│ │ │ ├── AuthorizationCodeFlow.ts
│ │ │ └── TokenManager.ts
│ │ ├── APIKey/
│ │ │ └── APIKeyAuth.ts
│ │ ├── BasicAuth/
│ │ │ └── BasicAuth.ts
│ │ └── PKE/
│ │ └── PKEAuth.ts
│ ├── types/
│ │ ├── index.ts
│ │ ├── connection.ts
│ │ ├── session.ts
│ │ ├── resource.ts
│ │ └── error.ts
│ ├── utils/
│ │ ├── encryption.ts
│ │ ├── httpClient.ts
│ │ └── iterator.ts
│ ├── errors/
│ │ ├── MorphError.ts
│ │ ├── ConnectionError.ts
│ │ └── AuthError.ts
│ └── index.ts
├── tests/
│ ├── unit/
│ ├── integration/
│ └── mocks/
├── examples/
│ ├── basic-usage.ts
│ ├── connection-management.ts
│ ├── session-handling.ts
│ ├── resource-operations.ts
│ └── auth-methods/
│ ├── oauth2-example.ts
│ ├── api-key-example.ts
│ ├── basic-auth-example.ts
│ └── pke-auth-example.ts
├── docs/
│ ├── API.md
│ ├── AUTHENTICATION.md
│ └── CONTRIBUTING.md
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── CHANGELOG.md
└── README.md

### SDK Usage

Creating an instance of Morph client:

```jsx
// Import runmorph packages
import { NextMorph } from "@runmorph/framework-nextjs";
import { PrismaAdapter } from "@runmorph/adapter-prisma";
import HubSpot from "@runmorph/connector-hubspot";
import Salesforce from "@runmorph/connector-salesforce";

// Import from current project
import { prisma, PrismaClient, Prisma } from "@repo/database/server";

// Create a morph instance and export it
export const morph = NextMorph({
  database: {
    adapter: PrismaAdapter(prisma),
  },
  connectors: [HubSpot, Salesforce],
});
```

Creating and authorizing a new connection:

```jsx
const { data, error } = await morph
  .connection({
    connectorId: "salesforce",
    ownerId: "user123",
  })
  .create({
    authorization: {
      scopes: ["read_contacts", "write_opportunities"],
      setting: {
        environment: "sandbox",
      },
    },
    operations: ["generic.contact.list", "crm.opportunity.create"],
  });

/* data
{
	"object": "connection",
  "connectorId": "string",
  "ownerId": "string",
  "operations": ["string"],  
  "authorization": {	  
	  "scopes": ["string"],
	  "settings": {
		  "environment":"sandbox"
	  }
	}
  "status": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
*/
/* error
{
	"object": "error",
	"type": "MORPH_....",
	"message": Some message"
}
*/
```

Listing and paginating through contacts from the server:

```jsx
// No await as this just store the connectorId and ownerId in the Conection class it returns
const connection = morph.connection({
  connectorId: "salesforce",
  ownerId: "user123",
});

const contactIterator = connection.resource("generic.contact").list({
  limit: 50,
  filter: {
    first_name: "john",
  },
  sort: "createdAt:desc",
  iterator: true,
});

for await (const contact of contactIterator) {
  console.log("Contact:", contact);
}
```

Creating a new opportunity from the server:

```jsx
const connection = morph.connection({
  connectorId: "salesforce",
  ownerId: "user123",
});

const { data, error } = await connection.resource("crm.opportunity").create({
  name: "Big Deal Q3",
  amount: 100000,
  closeDate: "2024-09-30",
  stage: "Proposal",
});
```

Updating a contact from the server::

```jsx
const connection = morph.connection({
  connectorId: "salesforce",
  ownerId: "user123",
});

const { data, error } = await connection
  .resource("generic.contact")
  .update("cont456", {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
  });
```

Deleting a resource from the server:

```jsx
const connection = morph.connection({
  connectorId: "salesforce",
  ownerId: "user123",
});
await connection.resource("generic.contact").delete("cont789");
```

Creating a session for an existing connection:

```jsx
const { data, error } = await morph.session.create({
  connection: {
    connectorId: "salesforce",
    ownerId: "user123",
  },
  expiresIn: 3600,
});
/* data
{
	"object": "session",
	"connection": {
		"connectorId": "string",
	  "ownerId": "string"
	},
	"sessionToken": "string",
  "expiresAt": "string"
}
*/
/* error
{
	"error": "MORPH_CONNECTION_DOES_NOT_EXIST",
	"message": "No connection exist for 'salesforce' and 'user123'. If you meant to create an intent connection, add the 'connectionIntent' attribute to your session creation."
}
*/
```

Creating a session for a connection not yet create – but can be used to create it:

```jsx
const { data, error } = await morph.session.create({
	connectionItent: {
		connectorId: "string",
	  ownerId: "string"
	  authorization: {
	    scopes: ['read_contacts', 'write_opportunities'],
	    "setting": {
		    "environment":"sandbox"
		  }
	  },
    operations: ['generic.contact.list', 'crm.opportunity.create']
  },
	expiresIn: 3600,
});
/* data
{
	"object": "session",
  "connectionIntent":{
	  "connectorId": "string",
	  "ownerId": "string",
	  "operations": ["string"],
	  "authorization": {
		  "scopes": ["string"],
		  "settings": {
			  "environment":"sandbox"
		  }
		}
	},
	"sessionToken": "string",
  "expiresAt": "string"
}
*/
```

Using a session token for operations in fronted / client app:

```jsx
const sessionToken = "jwtToken";
const connection = morph.connection({ sessionToken });

// In case of an connectionIntent session, this will create the actual connection
const { data, error } = await connection.authorize();
/* data
{ 
	"object": "connection.authorize",
	"connectorId": "string",
  "ownerId": "string",
  "status": "string",
  "authorizationUrl": "string"
}
*/

if (authorizationUrl) {
  // open pop up windows with authorizationUrl
}

const { data, error } = await connection.resource("crm.opportunity").list({
  filter: { stage: "Closed Won" },
  sort: "amount:desc",
  iterator: false,
});

/* data
[{ "object":"resource", ...}, {...}]
*/
```

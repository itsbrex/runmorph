"use server";

import { AlertTriangle, Info } from "lucide-react";
import { headers } from "next/headers";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { ConnectionButton } from "@/components/connection-button";
import { ConnectorCard } from "@/components/connector-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { connectorListing } from "@/connector-listing";
/**
 * Import the morph instance to use it for generating session tokens on the server side.
 */
import { morph } from "@/morph";

/**
 * Creates a session for a given connector and owner.
 * See owner as connected user or organization depending on your business model.
 */
async function createMorphSession({
  ownerId,
  connectorId,
}: {
  ownerId: string;
  connectorId: Parameters<
    ReturnType<(typeof morph)["connectors"]>["retrieve"]
  >[0];
}): Promise<string> {
  try {
    // Create a session for the connector with the specified owner and operations
    // This will generate a session token that can be used to authenticate the user on this connector
    const { data, error } = await morph.sessions().create({
      connection: {
        connectorId,
        ownerId,
        operations: ["genericContact::list", "crmOpportunity::list"],
      },
    });

    if (error) {
      throw { error: new Error(error.message) };
    }

    return data.sessionToken;
  } catch (err) {
    throw { error: new Error("Failed to create connector session") };
  }
}

interface PlaygroundParams {
  ownerId: string;
}

export default async function Playground({
  params,
}: {
  params: Promise<PlaygroundParams>;
}): Promise<JSX.Element> {
  const { ownerId } = await params;

  // Fake owner id; to be replaced by authenticated user / organization id
  const OWNER_ID = ownerId || "fake-user-id";

  // Get the hostname dynamically
  const host = (await headers()).get("host") || "localhost:3000";

  return (
    <>
      <header className="">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  Morph Playground
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  Connectors
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div>
        <div className="container mx-auto px-4 pt-4">
          <section>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Imported Connectors</AlertTitle>
              <AlertDescription>
                You only see here the connectors you have imported in{" "}
                <code>./morph.ts</code> and listed in the{" "}
                <code>connectorListing</code> const.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
              {await Promise.all(
                connectorListing.map(async (c) => (
                  <ConnectorCard
                    key={c.id}
                    id={c.id}
                    name={c.name}
                    description={c.description}
                    logo={c.logo}
                  >
                    <ConnectionButton
                      sessionToken={await createMorphSession({
                        ownerId: OWNER_ID,
                        connectorId: c.id,
                      })}
                    />
                  </ConnectorCard>
                ))
              )}
            </div>
          </section>
          <section>
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Check</AlertTitle>
              <AlertDescription>
                Make sure to set these environment variables:
                <p>MORPH_CALLBACK_BASE_URL=https://{host}/api/morph</p>
                <p>NEXT_PUBLIC_MORPH_API_BASE_URL=https://{host}/api/morph</p>
                And set the OAuth app callback URL in third-party service to:
                <p>{`https://${host}`}/api/morph/callback/:connectorId</p>
              </AlertDescription>
            </Alert>
            <div className="prose max-w-none mt-8 space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="how-to">
                  <AccordionTrigger>
                    <h3 className="text-2xl font-bold">
                      How to add connectors?
                    </h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      To add a new connector to the Morph Playground, you'll
                      need to modify the <code>./morph.ts</code> file:
                    </p>

                    <h3 className="text-xl font-semibold mt-6 mb-2">
                      Step 1: Import and Configure the Connector
                    </h3>

                    <p>
                      In your <code>morph.ts</code> file, import your connector
                      package and add it to the connectors array:
                    </p>

                    <SyntaxHighlighter
                      language="typescript"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.375rem",
                        height: "auto",
                        maxHeight: "300px",
                        overflow: "auto",
                      }}
                    >
                      {`import SalesforceConnector from "@runmorph/connector-salesforce";

const { morph, handlers } = NextMorph({
  connectors: [
    // ... existing connectors
    SalesforceConnector({
      clientId: process.env.MORPH_CONNECTOR_SALESFORCE_CLIENT_ID,
      clientSecret: process.env.MORPH_CONNECTOR_SALESFORCE_CLIENT_SECRET,
    }),
  ],
  database: { adapter: MemoryAdapter() },
});`}
                    </SyntaxHighlighter>

                    <h3 className="text-xl font-semibold mt-6 mb-2">
                      Step 2: Add to Connector Listing
                    </h3>

                    <p>
                      Add your connector to the <code>connectorListing</code>{" "}
                      array in <code>morph.ts</code>:
                    </p>

                    <SyntaxHighlighter
                      language="typescript"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.375rem",
                        height: "auto",
                        maxHeight: "300px",
                        overflow: "auto",
                      }}
                    >
                      {`export const connectorListing: ConnectorListingEntry[] = [
  // ... existing connectors
  {
    id: "salesforce",  // Must match the connector's ID
    name: "Salesforce",
    description: "Description of your new service connector",
    logo: "/connectors/salesforce.svg",  // Optionally – add logo to public/connectors/
  },
];`}
                    </SyntaxHighlighter>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Note</AlertTitle>
                      <AlertDescription>
                        This is specific to how Morph Playground will use the
                        listing to display the connector card. In your own
                        application, you probably won’t need this.
                      </AlertDescription>
                    </Alert>

                    <h3 className="text-xl font-semibold mt-6 mb-2">
                      Step 3: Environment Setup
                    </h3>

                    <p>
                      Add the necessary environment variables to your{" "}
                      <code>.env</code> file:
                    </p>

                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      <code className="text-sm">
                        {`MORPH_CONNECTOR_SALESFORCE_CLIENT_ID=your_client_id
MORPH_CONNECTOR_SALESFORCE_CLIENT_SECRET=your_client_secret`}
                      </code>
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

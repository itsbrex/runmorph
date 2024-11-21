"use server";
import { Info } from "lucide-react";

import { ResourceList } from "@/components/resource-list";
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
async function createMorphSession(
  params: Parameters<ReturnType<(typeof morph)["sessions"]>["create"]>[0]
): Promise<string> {
  try {
    const { data, error } = await morph.sessions().create(params);

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
                  Resources
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div>
        <div className="container mx-auto px-4 pt-4">
          <section className=" space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Connection</AlertTitle>
              <AlertDescription>
                Make sure to have a valid connection first. Visit "connectors"
                section to create one.
              </AlertDescription>
            </Alert>
            <ResourceList
              connections={await Promise.all(
                connectorListing.map(async (cl) => ({
                  connectorId: cl.id,
                  sessionToken: await createMorphSession({
                    connection: {
                      connectorId: cl.id,
                      ownerId: OWNER_ID,
                    },
                  }),
                }))
              )}
            />
          </section>
        </div>
      </div>
    </>
  );
}

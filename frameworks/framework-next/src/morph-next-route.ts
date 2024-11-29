import type {
  Adapter,
  ConnectorBundle,
  ConnectorEntityIds,
  MorphClient,
  ResourceModelOperations,
  CreateAuthorizationParams,
  ResourceModelId,
  WebhookOperations,
  ResourceEvents,
} from "@runmorph/core";
import type { NextRequest } from "next/server";

interface ApiRequestPayload<T = unknown> {
  action: string;
  data?: T;
}

interface MorphNextRoutes {
  GET: (
    request: NextRequest,
    context: { params: Promise<{ runmorph: string[] }> }
  ) => Promise<Response>;
  POST: (
    request: NextRequest,
    context: { params: Promise<{ runmorph: string[] }> }
  ) => Promise<Response>;
}

export function NextMorphHandlers<
  A extends Adapter,
  CA extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
>(morph: MorphClient<A, CA>): MorphNextRoutes {
  async function handleConnection(request: NextRequest) {
    const sessionToken = request.headers
      .get("Authorization")
      ?.split("Bearer ")[1];
    if (!sessionToken) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid session token",
          },
        },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as ApiRequestPayload;
    const connection = morph.connections({ sessionToken });

    try {
      switch (payload.action) {
        case "authorize":
          return Response.json(
            await connection.authorize(
              payload.data as CreateAuthorizationParams | undefined
            )
          );

        case "retrieve":
          return Response.json(await connection.retrieve());

        case "delete":
          return Response.json(await connection.delete());

        default:
          return Response.json(
            {
              error: {
                code: "INVALID_ACTION",
                message: `Invalid action: ${payload.action}`,
              },
            },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error("Server error:", error);
      return Response.json(
        {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          },
        },
        { status: 500 }
      );
    }
  }

  async function handleResource(
    request: NextRequest,
    resourceModelId: ResourceModelId
  ) {
    const sessionToken = request.headers
      .get("Authorization")
      ?.split("Bearer ")[1];
    if (!sessionToken) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid session token",
          },
        },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as ApiRequestPayload;
    const connection = morph.connections({ sessionToken });
    const resource = connection.resources(
      resourceModelId as ConnectorEntityIds<CA, CA[number]["id"]>
    );

    try {
      switch (payload.action) {
        case "list":
          return Response.json(await resource.list(payload.data as any));

        case "retrieve":
          const { id: retrieveId, ...retrieveOptions } = payload.data as {
            id: string;
            [key: string]: any;
          };
          return Response.json(
            await resource.retrieve(retrieveId, retrieveOptions)
          );

        case "create":
          return Response.json(await resource.create(payload.data as any));

        case "update":
          const { id: updateId, ...updateData } = payload.data as {
            id: string;
            [key: string]: any;
          };
          return Response.json(
            await resource.update(updateId, updateData as any)
          );

        case "delete":
          const { id: deleteId } = payload.data as { id: string };
          return Response.json(await resource.delete(deleteId));

        default:
          return Response.json(
            {
              error: {
                code: "INVALID_ACTION",
                message: `Invalid action: ${payload.action}`,
              },
            },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error("Server error:", error);
      return Response.json(
        {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          },
        },
        { status: 500 }
      );
    }
  }

  async function handleWebhook(request: NextRequest) {
    const sessionToken = request.headers
      .get("Authorization")
      ?.split("Bearer ")[1];
    if (!sessionToken) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid session token",
          },
        },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as any;
    const connection = morph.connections({ sessionToken });
    const webhook = connection.webhook();

    try {
      switch (payload.action) {
        case "create":
          return Response.json(await webhook.create(payload.data));

        /*  case "retrieve":
          const { id: retrieveId } = payload.data as { id: string };
          return Response.json(await webhook.retrieve(retrieveId));

        case "delete":
          const { id: deleteId } = payload.data as { id: string };
          return Response.json(await webhook.delete(deleteId));
*/
        default:
          return Response.json(
            {
              error: {
                code: "INVALID_ACTION",
                message: `Invalid action: ${payload.action}`,
              },
            },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error("Server error:", error);
      return Response.json(
        {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          },
        },
        { status: 500 }
      );
    }
  }

  function generateCallbackHTML(success: boolean, error?: string) {
    return new Response(
      `
      <html>
        <head>
          <title>Connection Status</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f9fafb;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .status {
              font-size: 1.2rem;
              margin-bottom: 1rem;
              color: ${success ? "#059669" : "#dc2626"};
            }
            .message {
              color: #6b7280;
              margin-bottom: 1.5rem;
            }
            .close-button {
              background-color: #171717;
              color: #fafafa;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
            }
            .close-button:hover {
              background-color: #191919;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="status">
              ${success ? "Connection Successful" : "Connection Failed"}
            </div>
            <div class="message">
              ${
                success
                  ? "Your connection has been successfully established."
                  : error || "There was an error establishing the connection."
              }
            </div>
            <button class="close-button" onclick="closeWindow()">Close Window</button>
          </div>
          <script>
            function closeWindow() {
              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.postMessage('${
                    success
                      ? "connection_callback_complete"
                      : "connection_callback_error"
                  }', '*');
                  window.close();
                } catch (e) {
                  window.close();
                }
              } else {
                window.close();
              }
            }
            
            setTimeout(closeWindow, 2000);
          </script>
        </body>
      </html>
      `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }

  async function handleCallback(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return generateCallbackHTML(false, "Missing required parameters");
    }

    try {
      const { error } = await morph.connections().callback({
        code,
        state,
        type: "oauth",
      });

      if (error) {
        return generateCallbackHTML(false, error.message);
      }

      return generateCallbackHTML(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return generateCallbackHTML(false, errorMessage);
    }
  }

  return {
    POST: async (
      request: NextRequest,
      { params }: { params: Promise<{ runmorph: string[] }> }
    ) => {
      const { runmorph } = await params;
      const [s, endpoint, ...rest] = runmorph;

      if (s !== "s") {
        return Response.json(
          {
            error: {
              code: "INVALID_ENDPOINT",
              message: "All endpoints must start with 's'",
            },
          },
          { status: 404 }
        );
      }

      switch (endpoint) {
        case "connection":
          return handleConnection(request);
        case "resources":
          if (rest[0]) {
            return handleResource(request, rest[0] as ResourceModelId);
          }
          break;
        case "webhooks":
          return handleWebhook(request);
      }

      return Response.json(
        {
          error: {
            code: "INVALID_ENDPOINT",
            message: `Invalid endpoint: ${runmorph.join("/")}`,
          },
        },
        { status: 404 }
      );
    },

    GET: async (
      request: NextRequest,
      { params }: { params: Promise<{ runmorph: string[] }> }
    ) => {
      const { runmorph } = await params;
      const endpoint = runmorph[0];

      if (endpoint === "callback") {
        return handleCallback(request);
      }

      return Response.json(
        {
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: "GET method is only allowed for callback endpoint",
          },
        },
        { status: 405 }
      );
    },
  };
}

export type NextMorphHandlers = typeof NextMorphHandlers;

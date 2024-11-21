"use server";
import { PlaygroundSidebar } from "@/components/playground-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface PlaygroundParams {
  ownerId: string;
}

export default async function Playground({
  children,
  params,
}: {
  children: React.ReactNode;
  breadcrumbs: React.ReactNode;
  params: Promise<PlaygroundParams>;
}): Promise<JSX.Element> {
  const { ownerId } = await params;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as React.CSSProperties
      }
    >
      <PlaygroundSidebar ownerId={ownerId} />
      <SidebarInset className="p-2">{children}</SidebarInset>
    </SidebarProvider>
  );
}

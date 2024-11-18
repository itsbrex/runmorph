import {
  Blocks,
  Box,
  Github,
  GlobeLock,
  Slack,
  SquareArrowOutUpRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { connectorListing } from "@/connector-listing";

export function PlaygroundSidebar({
  ownerId,
  ...props
}: React.ComponentProps<typeof Sidebar> & { ownerId: string }) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image
                    src="/morph-dark.svg"
                    alt="Morph Light Logo"
                    width={10}
                    height={10}
                    className="h-6 w-6"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Morph Playground</span>
                  <span className="">{ownerId}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Getting Started</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href={`/playground/${ownerId}/connectors`}>
                  <SidebarMenuButton>
                    <Blocks />
                    Connectors
                  </SidebarMenuButton>
                  <SidebarMenuBadge>
                    {connectorListing?.length || 0}
                  </SidebarMenuBadge>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href={`/playground/${ownerId}/resources`}>
                  <SidebarMenuButton>
                    <Box />
                    Resources
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <GlobeLock />
                  Proxy Request
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Github />
                  morphHQ/runmorph
                </SidebarMenuButton>
                <SidebarMenuBadge>
                  <SquareArrowOutUpRight className="w-3.5 text-muted-foreground" />
                </SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Slack />
                  Community
                </SidebarMenuButton>
                <SidebarMenuBadge>
                  <SquareArrowOutUpRight className="w-3.5 text-muted-foreground" />
                </SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

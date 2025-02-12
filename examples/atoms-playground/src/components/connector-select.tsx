"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Set the connector you want
export const connectors = [
  { id: "salesforce", label: "Salesforce" },
  { id: "hubspot", label: "HubSpot" },
] as const;

export type ConnectorId = (typeof connectors)[number]["id"];

interface ConnectorSelectProps {
  defaultValue?: ConnectorId;
  className?: string;
  ownerId: string;
  onUnavailableConnector?: (message: string) => void;
}

export function ConnectorSelect({
  defaultValue,
  ownerId,
  className,
  onUnavailableConnector,
}: ConnectorSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue || "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeParam =
    searchParams.get("theme") === "light" ? "?theme=light" : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-w-[200px]", className)}
        >
          {value
            ? connectors.find((connector) => connector.id === value)?.label
            : "Select a connector"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search connector..." className="h-9" />
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandEmpty>No connector found.</CommandEmpty>
            <CommandGroup>
              {connectors.map((connector) => (
                <CommandItem
                  key={connector.id}
                  value={connector.id}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    setOpen(false);
                    if (
                      ["hubspot", "salesforce", "pipedrive"].includes(
                        currentValue
                      )
                    ) {
                      router.push(
                        `/${ownerId}/connectors/${currentValue}${themeParam}`
                      );
                    } else {
                      onUnavailableConnector?.(connector.label);
                    }
                  }}
                >
                  <Image
                    src={`/connector-icons/${connector.id}.svg`}
                    alt={`${connector.label} icon`}
                    width={18}
                    height={18}
                    className="mr-2"
                  />
                  {connector.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === connector.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

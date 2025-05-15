"use client";

import { useState, useEffect } from "react";
import { useMorph } from "../morph/morph-provider";
import { useConnection } from "./connection-context";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Checkbox } from "../ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  UserPlus,
  Building,
  Target,
  GitBranch,
  FlagTriangleRight,
  Users,
  KanbanSquare,
  Network,
  BadgeDollarSign,
  Flag,
  MessageSquare,
  Phone,
  FileText,
  CalendarClock,
  MessageSquareReply,
  MessageCircleCode,
  MessageCircleMore,
  Calendar,
  CalendarMinus2,
  CalendarCog,
  CalendarPlus,
  Layers,
} from "lucide-react";

// Define the resource types and their operations
const resourcesMap = {
  genericContact: Users,
  genericCompany: Building,
  genericUser: UserPlus,
  genericWorkspace: Network,
  crmOpportunity: BadgeDollarSign,
  crmPipeline: KanbanSquare,
  crmStage: Flag,
  crmEngagement: MessageCircleMore,
  telephonyCall: Phone,
  telephonyCallTranscript: FileText,
  schedulingEventType: CalendarCog,
  schedulingSlot: CalendarClock,
  schedulingEvent: CalendarPlus,
  widgetCardView: Layers,
} as const;

// Helper function to format resource name
const formatResourceName = (key: string): string => {
  // Remove 'generic' prefix if present
  const cleanKey = key.replace(/^generic/, "");
  // Convert camelCase to Title Case with spaces
  return cleanKey
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

// Define all possible operations for each resource
const allOperations = ["retrieve", "list", "create", "update"];

// Helper function to check if a resource has at least one available operation
const hasAvailableOperations = (
  resourceId: string,
  availableOperations: string[]
): boolean => {
  return availableOperations.some((operation) =>
    operation.startsWith(`${resourceId}::`)
  );
};

interface ResourceItemProps {
  resource: {
    id: string;
    name: string;
    icon: any;
    operations: string[];
  };
  availableOperations: string[];
  selectedOperations: string[];
  globalTabValue: string;
  onChange: (operations: string[]) => void;
}

function ModelItem({
  resource,
  availableOperations,
  selectedOperations,
  globalTabValue,
  onChange,
}: ResourceItemProps) {
  const Icon = resource.icon;

  // Get operations that are available for this resource
  const getAvailableOps = () => {
    return resource.operations.filter((op) =>
      availableOperations.includes(`${resource.id}::${op}`)
    );
  };

  // Determine the current tab value based on selected scopes
  const getTabValue = () => {
    const availableOps = getAvailableOps();

    if (availableOps.length === 0) return "none";

    const allSelected = availableOps.every((op) =>
      selectedOperations.includes(`${resource.id}::${op}`)
    );

    const anySelected = availableOps.some((op) =>
      selectedOperations.includes(`${resource.id}::${op}`)
    );

    if (allSelected && availableOps.length > 0) return "all";
    if (anySelected) return "custom";
    return "none";
  };

  const [tabValue, setTabValue] = useState(getTabValue());
  const [showCustom, setShowCustom] = useState(tabValue === "custom");

  // Update tab value when selectedScopes changes
  useEffect(() => {
    const newTabValue = getTabValue();
    setTabValue(newTabValue);

    // Only show custom section if we're in custom mode and not all or none are selected
    setShowCustom(newTabValue === "custom");
  }, [selectedOperations, availableOperations]);

  // Get the text description of selected operations
  const getOperationsText = () => {
    if (tabValue === "none") return "no access";

    const availableOps = getAvailableOps();

    if (tabValue === "all") return availableOps.join(", ");

    const selectedOps = availableOps.filter((op) =>
      selectedOperations.includes(`${resource.id}::${op}`)
    );

    return selectedOps.length > 0
      ? selectedOps.join(", ")
      : "no operations selected";
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setTabValue(value);

    const availableOps = getAvailableOps();

    if (value === "custom") {
      setShowCustom(true);
      // If no operations are selected, select the first available one by default
      if (
        !availableOps.some((op) =>
          selectedOperations.includes(`${resource.id}::${op}`)
        ) &&
        availableOps.length > 0
      ) {
        handleOperationToggle(availableOps[0], true);
      }
    } else {
      if (value === "none") {
        // Clear all operations for this resource
        onChange(
          selectedOperations.filter(
            (scope) => !scope.startsWith(`${resource.id}::`)
          )
        );
      } else if (value === "all") {
        // Select all available operations for this resource
        const currentOperations = selectedOperations.filter(
          (scope) => !scope.startsWith(`${resource.id}::`)
        );
        const newOperations = availableOps.map((op) => `${resource.id}::${op}`);
        onChange([...currentOperations, ...newOperations]);
      }
    }
  };

  // Handle individual operation toggle
  const handleOperationToggle = (operation: string, checked: boolean) => {
    const operationId = `${resource.id}::${operation}`;
    let newOperations: string[];

    if (checked) {
      newOperations = [...selectedOperations, operationId];
    } else {
      newOperations = selectedOperations.filter((op) => op !== operationId);
    }

    // Check if we should automatically switch tabs
    const availableOps = getAvailableOps();
    const resourceOperations = newOperations.filter((op) =>
      op.startsWith(`${resource.id}::`)
    );
    const allOpsSelected = availableOps.every((op) =>
      resourceOperations.includes(`${resource.id}::${op}`)
    );
    const noOpsSelected = resourceOperations.length === 0;

    if (allOpsSelected && availableOps.length > 0) {
      setTabValue("all");
      setShowCustom(false);
    } else if (noOpsSelected) {
      setTabValue("none");
      setShowCustom(false);
    } else {
      setTabValue("custom");
      setShowCustom(true);
    }

    onChange(newOperations);
  };

  // Check if an operation is available
  const isOperationAvailable = (operation: string) => {
    return availableOperations.includes(`${resource.id}::${operation}`);
  };

  return (
    <div className="mb-0">
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center space-x-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span
            className={`text-sm ${tabValue === "none" ? "text-muted-foreground" : "font-medium"}`}
          >
            {resource.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {getOperationsText()}
          </span>
        </div>

        {globalTabValue === "custom" ? (
          <Tabs
            value={tabValue}
            onValueChange={handleTabChange}
            className="w-[160px]"
          >
            <TabsList className="grid grid-cols-3 h-7">
              <TabsTrigger value="none" className="text-xs py-0.5">
                none
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs py-0.5">
                all
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs py-0.5">
                custom
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <div className="w-[160px] h-7"></div>
        )}
      </div>

      {globalTabValue === "custom" && showCustom && (
        <div className="mt-1 mb-2 p-2 bg-muted rounded-md w-full">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <TooltipProvider>
              {resource.operations.map((operation) => (
                <div key={operation} className="flex items-center space-x-2">
                  {isOperationAvailable(operation) ? (
                    <Checkbox
                      id={`${resource.id}-${operation}`}
                      checked={selectedOperations.includes(
                        `${resource.id}::${operation}`
                      )}
                      onCheckedChange={(checked: boolean) =>
                        handleOperationToggle(operation, checked)
                      }
                    />
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Checkbox
                            id={`${resource.id}-${operation}`}
                            disabled
                            className="opacity-50 cursor-not-allowed"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Operation not available</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <label
                    htmlFor={`${resource.id}-${operation}`}
                    className={`text-sm font-normal ${
                      !isOperationAvailable(operation)
                        ? "text-muted-foreground cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {operation}
                  </label>
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
}

interface ConnectionOperationsClientProps {
  hidden?: boolean;
}

export function ConnectionOperationsClient({
  hidden = false,
}: ConnectionOperationsClientProps) {
  const morph = useMorph();
  const { sessionToken, t } = useConnection();
  const [availableOperations, setAvailableOperations] = useState<string[]>([]);
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  const [globalTabValue, setGlobalTabValue] = useState("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update morph connection
  useEffect(() => {
    // Update morph connection
    async function updateConnection() {
      console.log(
        "Updating morph connection...",
        JSON.stringify(selectedOperations)
      );
      if (selectedOperations.length > 0) {
        await morph.connections({ sessionToken }).update({
          //@ts-expect-error
          operations: selectedOperations,
        });
      }
    }
    updateConnection();
  }, [selectedOperations]);

  // Load operations
  useEffect(() => {
    async function loadOperations() {
      console.log("Loading operations...");
      if (!sessionToken) {
        console.log("No session token found");
        setError("Missing session token");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Retrieving connection data...");
        const connection = morph.connections({ sessionToken });
        const { data, error } = await connection.retrieve();

        if (error) {
          console.error("Error retrieving connection:", error);
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data) {
          console.log("Connection data received:", JSON.stringify(data));
          setSelectedOperations(data.operations || []);
        }
      } catch (err) {
        console.error("Error loading operations:", err);
        setError("Failed to load operations");
      } finally {
        console.log("Finished loading operations");
        setLoading(false);
      }
    }

    loadOperations();
  }, [sessionToken]);

  useEffect(() => {
    async function loadOperations() {
      if (!sessionToken) {
        setError("Missing session token");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const connection = morph.connections({ sessionToken });
        const { data } = await connection.getConnector();

        if (data && data.operations) {
          setAvailableOperations(data.operations);
        } else {
          setAvailableOperations([]);
        }
      } catch (err) {
        console.error("Error loading operations:", err);
        setError("Failed to load operations");
      } finally {
        setLoading(false);
      }
    }

    loadOperations();
  }, [morph, sessionToken]);

  // Determine the global tab value based on all selected scopes
  useEffect(() => {
    if (selectedOperations.length === 0) {
      setGlobalTabValue("none");
    } else if (
      selectedOperations.length === availableOperations.length &&
      availableOperations.every((scope) => selectedOperations.includes(scope))
    ) {
      setGlobalTabValue("all");
    } else {
      setGlobalTabValue("custom");
    }
  }, [selectedOperations, availableOperations]);

  const handleGlobalTabChange = (value: string) => {
    if (value === "none") {
      setSelectedOperations([]);
    } else if (value === "all") {
      setSelectedOperations([...availableOperations]);
    }
    // For "custom", we don't change anything automatically
    setGlobalTabValue(value);
  };

  if (hidden) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        {t?.("operations.loading") || "Loading operations..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {t?.("operations.error") || "Error"}: {error}
      </div>
    );
  }

  if (availableOperations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t?.("operations.noAccess") || "No operations available"}
      </div>
    );
  }

  return (
    <div className="w-full min-w-[450px] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <Label>{t?.("operations.label") || "Permissions"}</Label>
        <Tabs
          value={globalTabValue}
          onValueChange={handleGlobalTabChange}
          className="w-[160px]"
        >
          <TabsList className="grid grid-cols-3 h-7">
            <TabsTrigger value="none" className="text-xs py-0.5">
              {t?.("operations.none") || "none"}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs py-0.5">
              {t?.("operations.all") || "all"}
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs py-0.5">
              {t?.("operations.custom") || "custom"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="mb-4">
        {Object.entries(resourcesMap)
          .filter(([resourceId]) =>
            hasAvailableOperations(resourceId, availableOperations)
          )
          .map(([resourceId, Icon]) => (
            <ModelItem
              key={resourceId}
              resource={{
                id: resourceId,
                name: formatResourceName(resourceId),
                icon: Icon,
                operations: allOperations,
              }}
              availableOperations={availableOperations}
              selectedOperations={selectedOperations}
              globalTabValue={globalTabValue}
              onChange={setSelectedOperations}
            />
          ))}
      </div>
    </div>
  );
}

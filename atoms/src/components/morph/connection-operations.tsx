"use client";

import { ConnectionOperationsClient } from "./connection-operations-client";

interface ConnectionOperationsProps {
  hidden?: boolean;
}

export function ConnectionOperations({
  hidden = false,
}: ConnectionOperationsProps) {
  return <ConnectionOperationsClient hidden={hidden} />;
}

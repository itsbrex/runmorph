"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { listContacts } from "../app/actions";

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface ContactsTableProps {
  isConnected: boolean;
  sessionToken: string;
}

export function ContactsTable({
  isConnected,
  sessionToken,
}: ContactsTableProps) {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await listContacts(sessionToken);

        if (!isMounted) return;

        if (result.error) {
          setError(result.error.message || "Failed to load contacts");
          return;
        }

        // Transform the data to match our Contact interface
        const transformedContacts: Contact[] = (result.data || []).map(
          (contact) => ({
            id: contact.id,
            firstName: contact.fields.firstName || "",
            lastName: contact.fields.lastName || "",
            email: contact.fields.email || "",
          })
        );
        setContacts(transformedContacts);
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (isConnected) {
      void fetchContacts();
    } else {
      setContacts([]);
      setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isConnected, sessionToken]);

  if (!isConnected) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Connect to load contacts
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Loading contacts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>{contact.firstName}</TableCell>
                <TableCell>{contact.lastName}</TableCell>
                <TableCell>{contact.email}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

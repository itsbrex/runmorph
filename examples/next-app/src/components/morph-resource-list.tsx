"use client";
import { MorphResource, NextMorphClient } from "@runmorph/framework-next";
import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Import only the type of morph to avoid client error
import type { morph } from "@/morph";

import { Card, CardContent } from "./ui/card";

export const morphClient = NextMorphClient<morph>();

interface ResourceListProps {
  sessionToken: string;
}

export function ResourceList({ sessionToken }: ResourceListProps): JSX.Element {
  const [contactList, setContactList] = useState<
    MorphResource<"genericContact">[]
  >([]);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const connection = morphClient.connections({ sessionToken });
        const { data, error } = await connection
          .resources("genericContact")
          .list();

        if (data) return setContactList(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchContacts();
  }, [sessionToken]);
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center ">
                  <div className="flex flex-col items-center justify-start h-full">
                    <p className="text-muted-foreground">
                      No active connections
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Connect to a service to view contacts
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contactList.slice(0, 5).map((contact, index) => (
                <TableRow key={index}>
                  <TableCell>{contact.fields.firstName}</TableCell>
                  <TableCell>{contact.fields.lastName}</TableCell>
                  <TableCell>{contact.fields.email}</TableCell>
                  <TableCell>{contact.createdAt}</TableCell>
                  <TableCell>{contact.updatedAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

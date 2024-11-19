"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ConnectionCardProps {
  name: string;
}

export default function ConnectionCard({
  name,
  children,
}: ConnectionCardProps & { children: React.ReactNode }) {
  return (
    <Card key={name}>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          Authorize demo app to access and list your contacts.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-end gap-2">
        {children}
      </CardContent>
    </Card>
  );
}

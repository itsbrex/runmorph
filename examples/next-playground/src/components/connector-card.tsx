import Image from "next/image";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ConnectorCardProps {
  id: string;
  name: string;
  description: string;
  logo?: string;
  children: React.ReactNode;
}

export function ConnectorCard({
  id,
  name,
  description,
  logo,
  children,
}: ConnectorCardProps): JSX.Element {
  return (
    <Card key={`connector-card-${id}`}>
      <CardHeader className="flex items-end flex-row">
        <Image
          src={logo || "/morph-light.svg"}
          alt={`${name} icon`}
          width={20}
          height={20}
          className="mr-2"
        />
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-line">
          {description}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-end gap-2">
        {children}
      </CardFooter>
    </Card>
  );
}

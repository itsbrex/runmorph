"use serveer";

import { Blocks, BookType, Box, Github, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default function IntroPage(): JSX.Element {
  return (
    <>
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 font-semibold text-xl"
          >
            <Image
              src="/morph-logo-light.svg"
              alt="Morph Light Logo"
              width={50}
              height={15}
              className="h-8 w-48"
            />
          </Link>
          <Button variant="secondary" size="sm">
            <Link href="/playground" className="flex items-center">
              <Blocks className="mr-2 h-4 w-4" />
              Open playground
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              Kickstart your
              <br />
              third-party integrations
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Use Morph Starter Kit to build your third-party connector
              infrastructure with seamless authentication and unified CRUD
              operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <Link href="/playground" className="flex items-center">
                  <Blocks className="mr-2 h-4 w-4" />
                  Open playground
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="flex items-center">
                <Link
                  href="https://github.com/morphHQ/runmorph"
                  target="_blank"
                  className="flex items-center"
                >
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12">Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex items-end flex-row">
                  <Lock className="mr-2 h-5 w-4" />
                  <CardTitle>Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Effortlessly handle third-party tool authentication with
                    Morph's OAuth support and automatic scope management.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex items-end flex-row">
                  <Box className="mr-2 h-5 w-4" />
                  <CardTitle>Unified Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Seamlessly perform CRUD operations on third-party resources,
                    thanks to a consistent data model across all connectors.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex items-end flex-row">
                  <BookType className="mr-2 h-5 w-4" />
                  <CardTitle>TypeScript</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    All functions are fully typed, providing type safety and
                    ease of use while integrating with third-party services.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">© 2024 Morph</p>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="https://github.com/morphHQ/runmorph"
              target="_blank"
              className="flex items-center"
            >
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
        </div>
      </footer>
    </>
  );
}

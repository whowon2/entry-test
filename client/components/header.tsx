"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "./ui/button";
import { SignOutButton } from "./signout-button";

export function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className="w-full border-b bg-background h-16 flex">
      <div className="container m-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex justify-center flex-col">
            <Link href="/" className="text-lg font-semibold">
              Transfer Agent
            </Link>
            {session?.user && (
              <span className="text-sm text-muted-foreground">
                {session.user.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session?.user && (
              <Button variant="link" asChild className="-mx-3">
                <Link href="/my-tickets">My Tickets</Link>
              </Button>
            )}
            {session?.user ? (
              <SignOutButton />
            ) : (
              <Button asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

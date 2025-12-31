"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { BetterAuthActionButton } from "./better-auth-action-button";

export function SignOutButton() {
  const router = useRouter();

  return (
    <BetterAuthActionButton
      variant="destructive"
      action={() => {
        return authClient.signOut(undefined, {
          onSuccess: () => router.refresh(),
        });
      }}
    >
      Sign Out
    </BetterAuthActionButton>
  );
}

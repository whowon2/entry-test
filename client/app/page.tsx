"use client";

import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session } = authClient.useSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <div className="flex p-8"></div>;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopNav({
  userName,
  isAdmin,
}: {
  userName?: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          TabTally
        </p>
        <h1 className="text-2xl font-semibold">Shared expense workspace</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link className="btn btn-ghost" href="/dashboard">
          Dashboard
        </Link>
        <Link className="btn btn-ghost" href="/expenses">
          Record
        </Link>
        <Link className="btn btn-ghost" href="/history">
          History
        </Link>
        <Link className="btn btn-ghost" href="/settlements">
          Settlements
        </Link>
        {isAdmin ? (
          <Link className="btn btn-ghost" href="/admin">
            Admin
          </Link>
        ) : null}
        <button className="btn btn-primary" onClick={handleSignOut}>
          Sign out{userName ? ` (${userName})` : ""}
        </button>
      </div>
    </div>
  );
}

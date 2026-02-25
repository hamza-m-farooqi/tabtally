"use client";

import { useCallback, useEffect, useState } from "react";
import TopNav from "@/components/TopNav";

type PendingUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
  } | null>(null);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user));
  }, []);

  const loadPending = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setMessage("Admin access required.");
      return;
    }
    const data = await res.json();
    setPending(data.users || []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPending();
  }, [loadPending]);

  async function act(
    userId: string | undefined,
    action: "approve" | "reject" | "promote"
  ) {
    if (!userId) {
      setMessage("User id missing.");
      return;
    }
    setMessage(null);
    const res = await fetch(`/api/admin/users/${userId}/${action}`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Action failed.");
      return;
    }
    await loadPending();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <TopNav userName={currentUser?.name} isAdmin />
      <section className="card p-6">
        <h2 className="text-xl font-semibold">Approve Users</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Pending signups require approval to sign in.
        </p>
        {message ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {message}
          </p>
        ) : null}
        <div className="mt-6 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td className="py-4 text-zinc-500" colSpan={4}>
                    No pending users.
                  </td>
                </tr>
              ) : (
                pending.map((user) => {
                  const userId = user.id || user._id;
                  return (
                    <tr key={userId ?? user.email} className="border-t border-zinc-100">
                    <td className="py-3">{user.name}</td>
                    <td className="py-3">{user.email}</td>
                    <td className="py-3">{user.role}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => act(userId, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => act(userId, "reject")}
                        >
                          Reject
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => act(userId, "promote")}
                        >
                          Promote to Admin
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

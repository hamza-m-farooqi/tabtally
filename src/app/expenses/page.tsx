"use client";

import { FormEvent, useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { CATEGORIES } from "@/lib/categories";
import Spinner from "@/components/Spinner";

type User = { id: string; name: string; email: string; role: string };

function todayISO() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ExpensesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [includeMe, setIncludeMe] = useState(true);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user));
  }, []);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);
    setSubmitting(true);

    const payload = {
      amount: Number(amount),
      note: note || undefined,
      category: category || undefined,
      date,
      participantUserIds: sharedWith,
      includeMe,
    };

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setAmount("");
      setNote("");
      setCategory("");
      setMessage("Expense recorded.");
      setMessageType("success");
      setSubmitting(false);
      return;
    }

    const data = await res.json().catch(() => ({}));
    setMessage(data.error || "Failed to record expense.");
    setMessageType("error");
    setSubmitting(false);
  }

  return (
    <SidebarLayout
      userName={currentUser?.name}
      isAdmin={currentUser?.role === "ADMIN"}
    >
      <div className="grid gap-6">
        <section className="card p-6">
          {/* <h2 className="text-xl font-semibold">Record Expense</h2> */}
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium">Amount</label>
              <input
                className="input mt-2"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Note (optional)</label>
              <input
                className="input mt-2"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category (optional)</label>
              <select
                className="input mt-2"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Uncategorized</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <input
                className="input mt-2"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>
            <div>
              <p className="text-sm font-medium">Shared with</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {users
                  .filter((u) => u.id !== currentUser?.id)
                  .map((user) => (
                    <label key={user.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sharedWith.includes(user.id)}
                        onChange={(event) => {
                          setSharedWith((prev) =>
                            event.target.checked
                              ? [...prev, user.id]
                              : prev.filter((id) => id !== user.id)
                          );
                        }}
                      />
                      <span className="text-sm">{user.name}</span>
                    </label>
                  ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeMe}
                onChange={(event) => setIncludeMe(event.target.checked)}
              />
              Include me in split
            </label>
            {message ? (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${messageType === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
                  }`}
              >
                {message}
              </p>
            ) : null}
            <button className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" className="spinner-inverse" />
                  Saving...
                </span>
              ) : (
                "Save expense"
              )}
            </button>
          </form>
        </section>
      </div>
    </SidebarLayout>
  );
}

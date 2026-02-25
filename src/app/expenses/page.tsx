"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { CATEGORIES } from "@/lib/categories";

type User = { id: string; name: string; email: string; role: string };

type Summary = {
  totalExpense: number;
  youPaid: number;
  yourShare: number;
  yourNet: number;
};

function todayISO() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  });
}

export default function ExpensesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [includeMe, setIncludeMe] = useState(true);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pairwise, setPairwise] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);

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

  useEffect(() => {
    const params = new URLSearchParams({ date });
    if (filterCategory) params.set("category", filterCategory);
    sharedWith.forEach((id) => params.append("with", id));
    fetch(`/api/summary?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.summary);
        setPairwise(data.pairwise || {});
      });
  }, [date, sharedWith, filterCategory]);

  const sharedUsers = useMemo(
    () => users.filter((u) => sharedWith.includes(u.id)),
    [users, sharedWith]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

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
      const params = new URLSearchParams({ date });
      if (filterCategory) params.set("category", filterCategory);
      sharedWith.forEach((id) => params.append("with", id));
      const summaryRes = await fetch(`/api/summary?${params}`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);
      setPairwise(summaryData.pairwise || {});
      return;
    }

    const data = await res.json().catch(() => ({}));
    setMessage(data.error || "Failed to record expense.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <TopNav
        userName={currentUser?.name}
        isAdmin={currentUser?.role === "ADMIN"}
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-6">
          <h2 className="text-xl font-semibold">Record Expense</h2>
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
              <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
                {message}
              </p>
            ) : null}
            <button className="btn btn-primary w-full">Save expense</button>
          </form>
        </section>
        <section className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold">Daily Summary</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {date} summary for your share.
            </p>
            <div className="mt-4">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Filter category
              </label>
              <select
                className="input mt-2"
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            {summary ? (
              <div className="mt-4 grid gap-3 text-sm text-zinc-700">
                <div className="flex items-center justify-between">
                  <span>Total expense</span>
                  <strong>{formatCurrency(summary.totalExpense)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>You paid</span>
                  <strong>{formatCurrency(summary.youPaid)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Your share</span>
                  <strong>{formatCurrency(summary.yourShare)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Net</span>
                  <strong
                    className={
                      summary.yourNet >= 0 ? "text-teal-700" : "text-rose-600"
                    }
                  >
                    {summary.yourNet >= 0
                      ? `You receive ${formatCurrency(summary.yourNet)}`
                      : `You pay ${formatCurrency(Math.abs(summary.yourNet))}`}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No data for this day yet.
              </p>
            )}
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-semibold">Pairwise Net</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Based on selected shared participants.
            </p>
            <div className="mt-4 space-y-2 text-sm text-zinc-700">
              {sharedUsers.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Select participants to see pairwise balances.
                </p>
              ) : (
                sharedUsers.map((user) => {
                  const value = pairwise[user.id] ?? 0;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between"
                    >
                      <span>{user.name}</span>
                      <strong
                        className={
                          value >= 0 ? "text-teal-700" : "text-rose-600"
                        }
                      >
                        {value >= 0
                          ? `${user.name} owes you ${formatCurrency(value)}`
                          : `You owe ${user.name} ${formatCurrency(
                              Math.abs(value)
                            )}`}
                      </strong>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

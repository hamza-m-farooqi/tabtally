"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { CATEGORIES } from "@/lib/categories";

type User = { id: string; name: string; email: string; role: string };
type Pair = {
  withUserId: string;
  amount: number;
  status: "PENDING_ME" | "PENDING_OTHER" | "SETTLED";
};
type Day = { date: string; pairs: Pair[] };

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  });
}

export default function SettlementsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = `${now.getMonth() + 1}`.padStart(2, "0");
    return `${yyyy}-${mm}`;
  });
  const [filterCategory, setFilterCategory] = useState("");
  const [days, setDays] = useState<Day[]>([]);

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

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const loadDays = useCallback(() => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (filterCategory) params.set("category", filterCategory);
    fetch(`/api/settlements/unsettled?${params}`)
      .then((res) => res.json())
      .then((data) => setDays(data.days || []));
  }, [month, filterCategory]);

  useEffect(() => {
    loadDays();
  }, [loadDays]);

  async function settle(date: string, withUserId: string) {
    await fetch("/api/settlements/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, withUserId }),
    });
    loadDays();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <TopNav
        userName={currentUser?.name}
        isAdmin={currentUser?.role === "ADMIN"}
      />
      <section className="card p-6">
        <h2 className="text-xl font-semibold">Settlements</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Unsettled days where you still need to pay or receive.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Month
            </label>
            <input
              className="input mt-2"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Category
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
        </div>
        <div className="mt-6 space-y-4">
          {days.length === 0 ? (
            <p className="text-sm text-zinc-500">All settled for this month.</p>
          ) : (
            days.map((day) => (
              <div key={day.date} className="rounded-xl border border-zinc-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{day.date}</h3>
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Unsettled
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-zinc-700">
                  {day.pairs.map((pair) => {
                    const name = userMap.get(pair.withUserId)?.name || "User";
                    const value = pair.amount;
                    const badge =
                      pair.status === "SETTLED"
                        ? "Settled"
                        : pair.status === "PENDING_OTHER"
                        ? "Waiting on other"
                        : "Action needed";
                    return (
                      <div
                        key={pair.withUserId}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span>
                          {value >= 0
                            ? `${name} owes you`
                            : `You owe ${name}`}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs uppercase tracking-wide text-zinc-500">
                            {badge}
                          </span>
                          <strong
                            className={
                              value >= 0 ? "text-teal-700" : "text-rose-600"
                            }
                          >
                            {formatCurrency(Math.abs(value))}
                          </strong>
                          {pair.status === "PENDING_ME" ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => settle(day.date, pair.withUserId)}
                            >
                              Settle
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

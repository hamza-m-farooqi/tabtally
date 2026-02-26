"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { CATEGORIES } from "@/lib/categories";
import Spinner from "@/components/Spinner";

type User = { id: string; name: string; email: string; role: string };
type Pair = {
  pairId: string;
  withUserId: string;
  amount: number;
  signedNet: number;
  status:
    | "CAN_REQUEST"
    | "REQUESTED"
    | "PENDING_APPROVAL"
    | "AWAIT_REQUEST"
    | "SETTLED";
  settlementId?: string | null;
};
type Day = { date: string; status: "SETTLED" | "UNSETTLED"; pairs: Pair[] };

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
  const [loadingDays, setLoadingDays] = useState(true);
  const [actionPairId, setActionPairId] = useState<string | null>(null);

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
    setLoadingDays(true);
    return fetch(`/api/settlements/unsettled?${params}`)
      .then((res) => res.json())
      .then((data) => setDays(data.days || []))
      .finally(() => setLoadingDays(false));
  }, [month, filterCategory]);

  useEffect(() => {
    loadDays();
  }, [loadDays]);

  async function requestSettlement(date: string, withUserId: string) {
    setActionPairId(`${date}|${withUserId}|REQUEST`);
    await fetch("/api/settlements/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, withUserId }),
    });
    await loadDays();
    setActionPairId(null);
  }

  async function approveSettlement(settlementId: string) {
    setActionPairId(settlementId);
    await fetch("/api/settlements/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settlementId }),
    });
    await loadDays();
    setActionPairId(null);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <TopNav
        userName={currentUser?.name}
        isAdmin={currentUser?.role === "ADMIN"}
      />
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Settlements</h2>
          {loadingDays ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Spinner size="sm" />
              Loading
            </div>
          ) : null}
        </div>
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
                    {day.status === "SETTLED" ? "Settled" : "Unsettled"}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-zinc-700">
                  {day.pairs
                    .slice()
                    .sort((a, b) =>
                      a.status === b.status
                        ? 0
                        : a.status === "SETTLED"
                        ? 1
                        : -1
                    )
                    .map((pair) => {
                    const name = userMap.get(pair.withUserId)?.name || "User";
                    const signed = pair.signedNet;
                    const badge =
                      pair.status === "SETTLED"
                        ? "Settled"
                        : pair.status === "REQUESTED"
                        ? "Requested"
                        : pair.status === "PENDING_APPROVAL"
                        ? "Approval needed"
                        : pair.status === "AWAIT_REQUEST"
                        ? "Waiting request"
                        : "Action needed";
                    return (
                      <div
                        key={pair.pairId}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span>
                          {pair.status === "SETTLED"
                            ? signed >= 0
                              ? `You received from ${name}`
                              : `You paid ${name}`
                            : signed >= 0
                            ? `${name} owes you`
                            : `You owe ${name}`}
                        </span>
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                              pair.status === "SETTLED"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                : "border-zinc-200 bg-zinc-50 text-zinc-500"
                            }`}
                          >
                            {badge}
                          </span>
                          <strong
                            className={
                              pair.status === "SETTLED"
                                ? "text-emerald-700"
                                : signed >= 0
                                ? "text-teal-700"
                                : "text-rose-600"
                            }
                          >
                            {pair.status === "SETTLED"
                              ? formatCurrency(Math.abs(signed))
                              : formatCurrency(Math.abs(signed))}
                          </strong>
                          {pair.status === "CAN_REQUEST" ? (
                            <button
                              className="btn btn-primary"
                              disabled={actionPairId === `${day.date}|${pair.withUserId}|REQUEST`}
                              onClick={() =>
                                requestSettlement(day.date, pair.withUserId)
                              }
                            >
                              {actionPairId === `${day.date}|${pair.withUserId}|REQUEST` ? (
                                <span className="flex items-center gap-2">
                                  <Spinner size="sm" className="spinner-inverse" />
                                  Requesting...
                                </span>
                              ) : (
                                "Request Approval"
                              )}
                            </button>
                          ) : null}
                          {pair.status === "PENDING_APPROVAL" &&
                          pair.settlementId ? (
                            <button
                              className="btn btn-primary"
                              disabled={actionPairId === pair.settlementId}
                              onClick={() => approveSettlement(pair.settlementId!)}
                            >
                              {actionPairId === pair.settlementId ? (
                                <span className="flex items-center gap-2">
                                  <Spinner size="sm" className="spinner-inverse" />
                                  Approving...
                                </span>
                              ) : (
                                "Approve"
                              )}
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { CATEGORIES } from "@/lib/categories";

type DayRow = {
  date: string;
  totalExpense: number;
  settled?: boolean;
};

type MonthSummary = {
  totalExpense: number;
  youPaid: number;
  youReceived: number;
  youWillPay: number;
  youWillReceive: number;
};

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  });
}

export default function HistoryPage() {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
  } | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = `${now.getMonth() + 1}`.padStart(2, "0");
    return `${yyyy}-${mm}`;
  });
  const [filterCategory, setFilterCategory] = useState("");
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (filterCategory) params.set("category", filterCategory);
    fetch(`/api/history?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setDays(data.days || []);
        setMonthSummary(data.monthSummary || null);
      });
  }, [month, filterCategory]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <TopNav
        userName={currentUser?.name}
        isAdmin={currentUser?.role === "ADMIN"}
      />
      <section className="card p-6">
        <h2 className="text-xl font-semibold">History</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Monthly view with daily totals and your net position.
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
        {monthSummary ? (
          <div className="mt-6 grid gap-3 text-sm text-zinc-700 sm:grid-cols-3">
            <div className="flex items-center justify-between">
              <span>Monthly total</span>
              <strong>{formatCurrency(monthSummary.totalExpense)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>You paid</span>
              <strong>{formatCurrency(monthSummary.youPaid)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>You received</span>
              <strong>{formatCurrency(monthSummary.youReceived)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>You will pay</span>
              <strong className="text-rose-600">
                {formatCurrency(monthSummary.youWillPay)}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>You will receive</span>
              <strong className="text-teal-700">
                {formatCurrency(monthSummary.youWillReceive)}
              </strong>
            </div>
          </div>
        ) : null}
        <div className="mt-6 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="pb-2">Date</th>
                <th className="pb-2">Total Expense</th>
                <th className="pb-2">Settled</th>
              </tr>
            </thead>
            <tbody>
              {days.length === 0 ? (
                <tr>
                  <td className="py-4 text-zinc-500" colSpan={3}>
                    No history yet.
                  </td>
                </tr>
              ) : (
                days.map((row) => (
                  <tr key={row.date} className="border-t border-zinc-100">
                    <td className="py-3">
                      <Link
                        href={`/history/${row.date}`}
                        className="font-semibold text-teal-700"
                      >
                        {row.date}
                      </Link>
                    </td>
                    <td className="py-3">{formatCurrency(row.totalExpense)}</td>
                    <td className="py-3">
                      {row.settled ? "Yes" : "No"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

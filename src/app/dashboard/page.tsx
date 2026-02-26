"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

type MonthSummary = {
  totalExpense: number;
  youPaid: number;
  youReceived: number;
  youWillPay: number;
  youWillReceive: number;
};

type DayRow = {
  date: string;
  totalExpense: number;
  settled?: boolean;
};

type SettlementPair = {
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

type SettlementDay = {
  date: string;
  status: "SETTLED" | "UNSETTLED";
  pairs: SettlementPair[];
};

type CurrentUser = { name: string; role: string } | null;

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  });
}

function currentMonthISO() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [unsettledDays, setUnsettledDays] = useState<SettlementDay[]>([]);
  const [month] = useState(currentMonthISO());

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("month", month);
    fetch(`/api/history?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setDays(data.days || []);
        setMonthSummary(data.monthSummary || null);
      });
  }, [month]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("month", month);
    fetch(`/api/settlements/unsettled?${params}`)
      .then((res) => res.json())
      .then((data) => setUnsettledDays(data.days || []));
  }, [month]);

  const unsettledStats = useMemo(() => {
    let youOwe = 0;
    let owedToYou = 0;
    let pendingApprovals = 0;
    const actions: Array<{
      date: string;
      signedNet: number;
      amount: number;
      status: SettlementPair["status"];
    }> = [];

    for (const day of unsettledDays) {
      for (const pair of day.pairs) {
        if (pair.signedNet < 0) {
          youOwe += Math.abs(pair.signedNet);
        } else {
          owedToYou += pair.signedNet;
        }
        if (pair.status === "PENDING_APPROVAL") {
          pendingApprovals += 1;
        }
        actions.push({
          date: day.date,
          signedNet: pair.signedNet,
          amount: Math.abs(pair.signedNet),
          status: pair.status,
        });
      }
    }

    actions.sort((a, b) => b.amount - a.amount);

    return {
      youOwe,
      owedToYou,
      pendingApprovals,
      topActions: actions.slice(0, 5),
    };
  }, [unsettledDays]);

  const recentDays = useMemo(() => days.slice(0, 5), [days]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <TopNav
        userName={currentUser?.name}
        isAdmin={currentUser?.role === "ADMIN"}
      />
      <div className="grid gap-6">
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Dashboard</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Month-to-date snapshot ({month})
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-primary" href="/expenses">
                Record expense
              </Link>
              <Link className="btn btn-ghost" href="/settlements">
                Review settlements
              </Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-zinc-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Total spend
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {formatCurrency(monthSummary?.totalExpense || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                You paid
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {formatCurrency(monthSummary?.youPaid || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                You received
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {formatCurrency(monthSummary?.youReceived || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                You will receive
              </p>
              <p className="mt-2 text-lg font-semibold text-teal-700">
                {formatCurrency(monthSummary?.youWillReceive || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                You will pay
              </p>
              <p className="mt-2 text-lg font-semibold text-rose-600">
                {formatCurrency(monthSummary?.youWillPay || 0)}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Recent activity</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Latest days with totals and settlement status.
            </p>
            <div className="mt-4 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-zinc-500">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Settled</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDays.length === 0 ? (
                    <tr>
                      <td className="py-4 text-zinc-500" colSpan={3}>
                        No activity yet.
                      </td>
                    </tr>
                  ) : (
                    recentDays.map((row) => (
                      <tr key={row.date} className="border-t border-zinc-100">
                        <td className="py-3">
                          <Link
                            href={`/history/${row.date}`}
                            className="font-semibold text-teal-700"
                          >
                            {row.date}
                          </Link>
                        </td>
                        <td className="py-3">
                          {formatCurrency(row.totalExpense)}
                        </td>
                        <td className="py-3">
                          {row.settled ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">Settlement snapshot</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Open balances for this month.
            </p>
            <div className="mt-4 grid gap-3 text-sm text-zinc-700">
              <div className="flex items-center justify-between">
                <span>Unsettled days</span>
                <strong>{unsettledDays.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending approvals</span>
                <strong>{unsettledStats.pendingApprovals}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>You owe</span>
                <strong className="text-rose-600">
                  {formatCurrency(unsettledStats.youOwe)}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Owed to you</span>
                <strong className="text-teal-700">
                  {formatCurrency(unsettledStats.owedToYou)}
                </strong>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Top actions
              </p>
              {unsettledStats.topActions.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">
                  All settled for now.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {unsettledStats.topActions.map((item, index) => (
                    <li
                      key={`${item.date}-${index}`}
                      className="flex items-center justify-between"
                    >
                      <span className="text-zinc-600">{item.date}</span>
                      <span
                        className={
                          item.signedNet >= 0 ? "text-teal-700" : "text-rose-600"
                        }
                      >
                        {formatCurrency(item.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

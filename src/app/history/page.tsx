"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SidebarLayout from "@/components/SidebarLayout";
import { CATEGORIES } from "@/lib/categories";
import Spinner from "@/components/Spinner";

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
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const STAT_CONFIG = [
  {
    key: "totalExpense" as const,
    label: "Total Spend",
    icon: "💰",
    color: "stat-card-neutral",
  },
  {
    key: "youPaid" as const,
    label: "You Paid",
    icon: "📤",
    color: "stat-card-blue",
  },
  {
    key: "youReceived" as const,
    label: "You Received",
    icon: "📥",
    color: "stat-card-green",
  },
  {
    key: "youWillPay" as const,
    label: "You Will Pay",
    icon: "⏳",
    color: "stat-card-red",
  },
  {
    key: "youWillReceive" as const,
    label: "You Will Receive",
    icon: "✨",
    color: "stat-card-teal",
  },
];

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
  const [loading, setLoading] = useState(true);

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
      })
      .finally(() => setLoading(false));
  }, [month, filterCategory]);

  const settledCount = days.filter((d) => d.settled).length;
  const unsettledCount = days.length - settledCount;

  return (
    <SidebarLayout
      userName={currentUser?.name}
      isAdmin={currentUser?.role === "ADMIN"}
    >
      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="history-filters card">
        <div className="history-filter-group">
          <label className="history-filter-label">Month</label>
          <input
            className="input"
            type="month"
            value={month}
            onChange={(e) => {
              setLoading(true);
              setMonth(e.target.value);
            }}
          />
        </div>
        <div className="history-filter-group">
          <label className="history-filter-label">Category</label>
          <select
            className="input"
            value={filterCategory}
            onChange={(e) => {
              setLoading(true);
              setFilterCategory(e.target.value);
            }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {loading && (
          <div className="history-filter-loading">
            <Spinner size="sm" />
            <span>Refreshing…</span>
          </div>
        )}
      </div>

      {/* ── Summary Stat Cards ─────────────────────────────────── */}
      {monthSummary ? (
        <div className="history-stats">
          {STAT_CONFIG.map(({ key, label, icon, color }) => (
            <div key={key} className={`history-stat-card ${color}`}>
              <span className="history-stat-icon">{icon}</span>
              <p className="history-stat-label">{label}</p>
              <p className="history-stat-value">
                {formatCurrency(monthSummary[key])}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Day List ──────────────────────────────────────────── */}
      <div className="card history-table-card">
        {/* Table header row */}
        <div className="history-table-header">
          <h2 className="history-table-title">Daily breakdown</h2>
          <div className="history-table-badges">
            <span className="history-badge history-badge-settled">
              {settledCount} settled
            </span>
            <span className="history-badge history-badge-unsettled">
              {unsettledCount} pending
            </span>
          </div>
        </div>

        {/* Rows */}
        <div className="history-rows">
          {days.length === 0 ? (
            <div className="history-empty">
              {loading ? (
                <>
                  <Spinner size="md" />
                  <p>Loading history…</p>
                </>
              ) : (
                <>
                  <span className="history-empty-icon">📭</span>
                  <p>No history for this period.</p>
                </>
              )}
            </div>
          ) : (
            days.map((row) => (
              <Link
                key={row.date}
                href={`/history/${row.date}`}
                className="history-row"
              >
                {/* Date */}
                <div className="history-row-date">
                  <span className="history-row-date-formatted">
                    {formatDate(row.date)}
                  </span>
                  <span className="history-row-date-iso">{row.date}</span>
                </div>

                {/* Amount */}
                <div className="history-row-amount">
                  {formatCurrency(row.totalExpense)}
                </div>

                {/* Status */}
                <div>
                  {row.settled ? (
                    <span className="history-pill history-pill-settled">
                      ✓ Settled
                    </span>
                  ) : (
                    <span className="history-pill history-pill-pending">
                      Pending
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="history-row-arrow"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

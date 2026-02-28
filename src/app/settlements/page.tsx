"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
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
    maximumFractionDigits: 0,
  });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const STATUS_CONFIG: Record<
  Pair["status"],
  { label: string; cls: string }
> = {
  SETTLED: { label: "Settled", cls: "sett-badge-settled" },
  REQUESTED: { label: "Requested", cls: "sett-badge-requested" },
  PENDING_APPROVAL: { label: "Approval needed", cls: "sett-badge-pending" },
  AWAIT_REQUEST: { label: "Waiting request", cls: "sett-badge-waiting" },
  CAN_REQUEST: { label: "Action needed", cls: "sett-badge-action" },
};

export default function SettlementsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [filterCategory, setFilterCategory] = useState("");
  const [days, setDays] = useState<Day[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [actionPairId, setActionPairId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setCurrentUser(d.user));
  }, []);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users || []));
  }, []);

  const userMap = useMemo(() => {
    const m = new Map<string, User>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const loadDays = useCallback(() => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (filterCategory) params.set("category", filterCategory);
    return fetch(`/api/settlements/unsettled?${params}`)
      .then((r) => r.json())
      .then((d) => setDays(d.days || []))
      .finally(() => setLoadingDays(false));
  }, [month, filterCategory]);

  useEffect(() => { loadDays(); }, [loadDays]);

  async function requestSettlement(date: string, withUserId: string) {
    setActionPairId(`${date}|${withUserId}|REQUEST`);
    setLoadingDays(true);
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
    setLoadingDays(true);
    await fetch("/api/settlements/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settlementId }),
    });
    await loadDays();
    setActionPairId(null);
  }

  // Quick summary counts
  const pendingCount = days.filter((d) => d.status === "UNSETTLED").length;
  const settledCount = days.filter((d) => d.status === "SETTLED").length;

  return (
    <SidebarLayout
      userName={currentUser?.name}
      isAdmin={currentUser?.role === "ADMIN"}
    >
      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="history-filters card" style={{ marginBottom: 20 }}>
        <div className="history-filter-group">
          <label className="history-filter-label">Month</label>
          <input
            className="input"
            type="month"
            value={month}
            onChange={(e) => {
              setLoadingDays(true);
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
              setLoadingDays(true);
              setFilterCategory(e.target.value);
            }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        {loadingDays && (
          <div className="history-filter-loading">
            <Spinner size="sm" />
            <span>Refreshing…</span>
          </div>
        )}
      </div>

      {/* ── Days list ─────────────────────────────────────────── */}
      {days.length === 0 ? (
        <div className="card history-empty">
          {loadingDays ? (
            <><Spinner size="md" /><p>Loading settlements…</p></>
          ) : (
            <>
              <span className="history-empty-icon">🎉</span>
              <p>All settled for this month!</p>
            </>
          )}
        </div>
      ) : (
        <div className="sett-days">
          {/* Summary bar */}
          <div className="sett-summary">
            <span className="sett-summary-chip sett-summary-pending">
              {pendingCount} pending
            </span>
            <span className="sett-summary-chip sett-summary-settled">
              {settledCount} settled
            </span>
          </div>

          {days.map((day) => (
            <div
              key={day.date}
              className={`card sett-day-card${day.status === "SETTLED" ? " sett-day-settled" : ""}`}
            >
              {/* Day header */}
              <div className="sett-day-header">
                <div className="sett-day-date-block">
                  <span className="sett-day-date-formatted">{formatDateShort(day.date)}</span>
                  <span className="sett-day-date-iso">{day.date}</span>
                </div>
                <span className={`history-pill ${day.status === "SETTLED" ? "history-pill-settled" : "history-pill-pending"}`}>
                  {day.status === "SETTLED" ? "✓ Settled" : "Pending"}
                </span>
              </div>

              {/* Pairs */}
              <div className="sett-pairs">
                {day.pairs
                  .slice()
                  .sort((a, b) =>
                    a.status === b.status ? 0 : a.status === "SETTLED" ? 1 : -1
                  )
                  .map((pair) => {
                    const name = userMap.get(pair.withUserId)?.name || "User";
                    const signed = pair.signedNet;
                    const isSettled = pair.status === "SETTLED";
                    const isPos = signed >= 0;
                    const { label: badgeLabel, cls: badgeCls } = STATUS_CONFIG[pair.status];

                    const description = isSettled
                      ? isPos ? `You received from ${name}` : `You paid ${name}`
                      : isPos ? `${name} owes you` : `You owe ${name}`;

                    const reqId = `${day.date}|${pair.withUserId}|REQUEST`;
                    const isRequesting = actionPairId === reqId;
                    const isApproving = actionPairId === pair.settlementId;

                    return (
                      <div key={pair.pairId} className={`sett-pair${isSettled ? " sett-pair-settled" : ""}`}>
                        {/* Left: avatar + description */}
                        <div className="sett-pair-left">
                          <div className="sett-pair-avatar">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="sett-pair-desc">
                            <span className="sett-pair-name">{description}</span>
                            <span className={`sett-badge ${badgeCls}`}>{badgeLabel}</span>
                          </div>
                        </div>

                        {/* Right: amount + action */}
                        <div className="sett-pair-right">
                          <span className={`sett-pair-amount ${isSettled ? "sett-amount-settled" : isPos ? "sett-amount-pos" : "sett-amount-neg"}`}>
                            {formatCurrency(Math.abs(signed))}
                          </span>
                          {pair.status === "CAN_REQUEST" && (
                            <button
                              className="btn btn-primary sett-action-btn"
                              disabled={isRequesting}
                              onClick={() => requestSettlement(day.date, pair.withUserId)}
                            >
                              {isRequesting ? (
                                <><Spinner size="sm" className="spinner-inverse" /> Requesting…</>
                              ) : "Request Approval"}
                            </button>
                          )}
                          {pair.status === "PENDING_APPROVAL" && pair.settlementId && (
                            <button
                              className="btn btn-primary sett-action-btn"
                              disabled={isApproving}
                              onClick={() => approveSettlement(pair.settlementId!)}
                            >
                              {isApproving ? (
                                <><Spinner size="sm" className="spinner-inverse" /> Approving…</>
                              ) : "Approve"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}

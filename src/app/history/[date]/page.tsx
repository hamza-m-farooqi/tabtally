"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import { CATEGORIES } from "@/lib/categories";
import Spinner from "@/components/Spinner";

type User = { id: string; name: string; email: string; role: string };
type Expense = {
  _id: string;
  amount: number;
  note?: string;
  category?: string;
  date: string;
  paidByUserId: string;
  participantUserIds: string[];
};

type Summary = {
  totalExpense: number;
  youPaid: number;
  yourShare: number;
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

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const SUMMARY_STATS = [
  { key: "totalExpense" as const, label: "Total", color: "stat-card-neutral", icon: "💰" },
  { key: "youPaid" as const, label: "You Paid", color: "stat-card-blue", icon: "📤" },
  { key: "yourShare" as const, label: "Your Share", color: "stat-card-neutral", icon: "📊" },
  { key: "youWillPay" as const, label: "Will Pay", color: "stat-card-red", icon: "⏳" },
  { key: "youWillReceive" as const, label: "Will Receive", color: "stat-card-teal", icon: "✨" },
];

export default function DayDetailPage() {
  const params = useParams<{ date: string }>();
  const dateParam = params?.date ?? "";
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pairwise, setPairwise] = useState<Record<string, number>>({});
  const [approvedExpenseIds, setApprovedExpenseIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState(dateParam);
  const [editParticipants, setEditParticipants] = useState<string[]>([]);
  const [editIncludeMe, setEditIncludeMe] = useState(true);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [loadingDay, setLoadingDay] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setCurrentUser(d.user));
  }, []);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users || []));
  }, []);

  const loadDay = useCallback(() => {
    const q = new URLSearchParams();
    if (filterCategory) q.set("category", filterCategory);
    fetch(`/api/history/${dateParam}?${q}`)
      .then((r) => r.json())
      .then((d) => {
        setExpenses(d.expenses || []);
        setSummary(d.summary || null);
        setPairwise(d.pairwise || {});
        setApprovedExpenseIds(new Set(d.approvedExpenseIds || []));
      })
      .finally(() => setLoadingDay(false));
  }, [dateParam, filterCategory]);

  useEffect(() => { loadDay(); }, [loadDay]);

  const userMap = useMemo(() => {
    const m = new Map<string, User>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  function startEdit(expense: Expense) {
    setEditMessage(null);
    setEditingId(expense._id);
    setEditAmount(expense.amount.toString());
    setEditNote(expense.note || "");
    setEditCategory(expense.category || "");
    setEditDate(expense.date);
    const me = currentUser?.id;
    setEditParticipants(expense.participantUserIds.filter((id) => id !== me));
    setEditIncludeMe(me ? expense.participantUserIds.includes(me) : true);
  }

  async function saveEdit(expenseId: string) {
    setEditMessage(null);
    setSavingId(expenseId);
    const res = await fetch(`/api/expenses/${expenseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(editAmount),
        note: editNote || undefined,
        category: editCategory || undefined,
        date: editDate,
        participantUserIds: editParticipants,
        includeMe: editIncludeMe,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      setLoadingDay(true);
      loadDay();
      setSavingId(null);
      return;
    }
    const d = await res.json().catch(() => ({}));
    setEditMessage(d.error || "Failed to update expense.");
    setSavingId(null);
  }

  async function deleteExpense(expenseId: string) {
    setDeletingId(expenseId);
    const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    if (res.ok) {
      setLoadingDay(true);
      loadDay();
    }
    setDeletingId(null);
  }

  const canEdit = (expense: Expense) =>
    !approvedExpenseIds.has(expense._id) &&
    (currentUser?.role === "ADMIN" || expense.paidByUserId === currentUser?.id);

  return (
    <SidebarLayout
      userName={currentUser?.name}
      isAdmin={currentUser?.role === "ADMIN"}
    >
      {/* ── Date heading ───────────────────────────────────── */}
      <div className="day-date-heading">
        <div>
          {/* <p className="day-date-label">Day Detail</p> */}
          <h2 className="day-date-title">{formatDateLong(dateParam)}</h2>
        </div>
        {loadingDay && (
          <div className="day-loading">
            <Spinner size="sm" />
            <span>Loading…</span>
          </div>
        )}
      </div>

      {/* ── Summary stats ──────────────────────────────────── */}
      {summary && (
        <div className="history-stats" style={{ marginBottom: 20 }}>
          {SUMMARY_STATS.map(({ key, label, color, icon }) => (
            <div key={key} className={`history-stat-card ${color}`}>
              <span className="history-stat-icon">{icon}</span>
              <p className="history-stat-label">{label}</p>
              <p className="history-stat-value">{formatCurrency(summary[key])}</p>
            </div>
          ))}
        </div>
      )}

      <div className="day-grid">
        {/* ── Expenses list ─────────────────────────────────── */}
        <div>
          {/* Filter */}
          <div className="card day-filter-bar">
            <label className="day-filter-label">Filter by Category</label>
            <select
              className="input"
              value={filterCategory}
              onChange={(e) => {
                setLoadingDay(true);
                setFilterCategory(e.target.value);
              }}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Expense cards */}
          <div className="day-expense-list">
            {expenses.length === 0 ? (
              <div className="history-empty card">
                {loadingDay ? (
                  <><Spinner size="md" /><p>Loading expenses…</p></>
                ) : (
                  <><span className="history-empty-icon">📭</span><p>No expenses for this day.</p></>
                )}
              </div>
            ) : (
              expenses.map((expense) => {
                const participants = expense.participantUserIds.map(
                  (id) => userMap.get(id)?.name || "Unknown"
                );
                const share =
                  expense.participantUserIds.length > 0
                    ? expense.amount / expense.participantUserIds.length
                    : expense.amount;
                const isSettled = approvedExpenseIds.has(expense._id);
                const paidBy = userMap.get(expense.paidByUserId)?.name || "Unknown";
                const isEditing = editingId === expense._id;

                return (
                  <div key={expense._id} className={`day-expense-card card${isSettled ? " day-expense-settled" : ""}`}>
                    {/* Card header */}
                    <div className="day-expense-header">
                      <div className="day-expense-meta">
                        <span className="day-expense-category">
                          {expense.category || "Uncategorized"}
                        </span>
                        {isSettled && (
                          <span className="history-pill history-pill-settled">✓ Settled</span>
                        )}
                      </div>
                      <div className="day-expense-amount">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>

                    <p className="day-expense-note">
                      {expense.note || <span className="day-expense-no-note">No description</span>}
                    </p>

                    {/* Meta row */}
                    <div className="day-expense-info">
                      <span className="day-expense-info-chip">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        Paid by <strong>{paidBy}</strong>
                      </span>
                      <span className="day-expense-info-chip">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Split: {participants.join(", ")}
                      </span>
                      <span className="day-expense-info-chip">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        Per person: <strong>{formatCurrency(share)}</strong>
                      </span>
                    </div>

                    {/* Action buttons */}
                    {canEdit(expense) && !isEditing && (
                      <div className="day-expense-actions">
                        <button className="btn btn-ghost" onClick={() => startEdit(expense)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="btn day-btn-delete"
                          disabled={deletingId === expense._id}
                          onClick={() => deleteExpense(expense._id)}
                        >
                          {deletingId === expense._id ? (
                            <><Spinner size="sm" /> Deleting…</>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Edit form */}
                    {isEditing && (
                      <div className="day-edit-form">
                        <p className="day-edit-title">Edit Expense</p>
                        <div className="day-edit-grid">
                          <div>
                            <label className="day-edit-label">Amount</label>
                            <input className="input" type="number" value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)} />
                          </div>
                          <div>
                            <label className="day-edit-label">Date</label>
                            <input className="input" type="date" value={editDate}
                              onChange={(e) => setEditDate(e.target.value)} />
                          </div>
                          <div>
                            <label className="day-edit-label">Category</label>
                            <select className="input" value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}>
                              <option value="">Uncategorized</option>
                              {CATEGORIES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="day-edit-label">Note</label>
                            <input className="input" value={editNote}
                              onChange={(e) => setEditNote(e.target.value)} />
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="day-edit-label">Participants</p>
                          <div className="day-edit-participants">
                            {users.filter((u) => u.id !== currentUser?.id).map((user) => (
                              <label key={user.id} className="day-edit-check-label">
                                <input type="checkbox"
                                  checked={editParticipants.includes(user.id)}
                                  onChange={(e) => setEditParticipants((prev) =>
                                    e.target.checked ? [...prev, user.id] : prev.filter((id) => id !== user.id)
                                  )}
                                />
                                {user.name}
                              </label>
                            ))}
                            <label className="day-edit-check-label">
                              <input type="checkbox" checked={editIncludeMe}
                                onChange={(e) => setEditIncludeMe(e.target.checked)} />
                              Include me
                            </label>
                          </div>
                        </div>
                        {editMessage && (
                          <p className="day-edit-error">{editMessage}</p>
                        )}
                        <div className="day-edit-actions">
                          <button className="btn btn-primary" disabled={savingId === expense._id}
                            onClick={() => saveEdit(expense._id)}>
                            {savingId === expense._id ? (
                              <><Spinner size="sm" className="spinner-inverse" /> Saving…</>
                            ) : "Save changes"}
                          </button>
                          <button className="btn btn-ghost" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Pairwise sidebar ──────────────────────────────── */}
        {Object.keys(pairwise).length > 0 && (
          <aside className="card day-pairwise">
            <h3 className="day-pairwise-title">Balances</h3>
            <p className="day-pairwise-sub">Net owed between people</p>
            <div className="day-pairwise-list">
              {Object.entries(pairwise).map(([userId, value]) => (
                <div key={userId} className="day-pairwise-row">
                  <div className="day-pairwise-avatar">
                    {(userMap.get(userId)?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="day-pairwise-info">
                    <span className="day-pairwise-name">
                      {userMap.get(userId)?.name || "Unknown"}
                    </span>
                    <span className={`day-pairwise-amount ${value >= 0 ? "day-pairwise-pos" : "day-pairwise-neg"}`}>
                      {value >= 0
                        ? `Owes you ${formatCurrency(value)}`
                        : `You owe ${formatCurrency(Math.abs(value))}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </SidebarLayout>
  );
}

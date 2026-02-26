"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import TopNav from "@/components/TopNav";
import { CATEGORIES } from "@/lib/categories";

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
    maximumFractionDigits: 2,
  });
}

export default function DayDetailPage() {
  const params = useParams<{ date: string }>();
  const dateParam = params?.date ?? "";
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pairwise, setPairwise] = useState<Record<string, number>>({});
  const [approvedExpenseIds, setApprovedExpenseIds] = useState<Set<string>>(
    new Set()
  );
  const [filterCategory, setFilterCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState(dateParam);
  const [editParticipants, setEditParticipants] = useState<string[]>([]);
  const [editIncludeMe, setEditIncludeMe] = useState(true);
  const [editMessage, setEditMessage] = useState<string | null>(null);

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

  const loadDay = useCallback(() => {
    const paramsQuery = new URLSearchParams();
    if (filterCategory) paramsQuery.set("category", filterCategory);
    fetch(`/api/history/${dateParam}?${paramsQuery}`)
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data.expenses || []);
        setSummary(data.summary || null);
        setPairwise(data.pairwise || {});
        setApprovedExpenseIds(new Set(data.approvedExpenseIds || []));
      });
  }, [dateParam, filterCategory]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  function startEdit(expense: Expense) {
    setEditMessage(null);
    setEditingId(expense._id);
    setEditAmount(expense.amount.toString());
    setEditNote(expense.note || "");
    setEditCategory(expense.category || "");
    setEditDate(expense.date);
    const currentId = currentUser?.id;
    const participants = expense.participantUserIds.filter(
      (id) => id !== currentId
    );
    setEditParticipants(participants);
    setEditIncludeMe(
      currentId ? expense.participantUserIds.includes(currentId) : true
    );
  }

  async function saveEdit(expenseId: string) {
    setEditMessage(null);
    const payload = {
      amount: Number(editAmount),
      note: editNote || undefined,
      category: editCategory || undefined,
      date: editDate,
      participantUserIds: editParticipants,
      includeMe: editIncludeMe,
    };
    const res = await fetch(`/api/expenses/${expenseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setEditingId(null);
      loadDay();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setEditMessage(data.error || "Failed to update expense.");
  }

  async function deleteExpense(expenseId: string) {
    const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    if (res.ok) {
      loadDay();
    }
  }

  const canEdit = (expense: Expense) =>
    !approvedExpenseIds.has(expense._id) &&
    (currentUser?.role === "ADMIN" || expense.paidByUserId === currentUser?.id);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <TopNav
        userName={currentUser?.name}
        isAdmin={currentUser?.role === "ADMIN"}
      />
      <section className="card p-6">
        <h2 className="text-xl font-semibold">Day Detail</h2>
        <p className="mt-1 text-sm text-zinc-500">{dateParam}</p>
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
          <div className="mt-6 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <span>Total</span>
              <strong>{formatCurrency(summary.totalExpense)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Your paid</span>
              <strong>{formatCurrency(summary.youPaid)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Your share</span>
              <strong>{formatCurrency(summary.yourShare)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>You received</span>
              <strong>{formatCurrency(summary.youReceived)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>You will pay</span>
              <strong className="text-rose-600">
                {formatCurrency(summary.youWillPay)}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>You will receive</span>
              <strong className="text-teal-700">
                {formatCurrency(summary.youWillReceive)}
              </strong>
            </div>
          </div>
        ) : null}
        <div className="mt-6 space-y-4">
          {expenses.length === 0 ? (
            <p className="text-sm text-zinc-500">No expenses for this day.</p>
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

              return (
                <div
                  key={expense._id}
                  className="rounded-xl border border-zinc-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-500">
                        {expense.category || "Uncategorized"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold">
                          {expense.note || "Expense"}
                        </p>
                        {isSettled ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Settled
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-500">Amount</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                  {canEdit(expense) ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="btn btn-ghost"
                        onClick={() => startEdit(expense)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => deleteExpense(expense._id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                  <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                    <p>
                      Paid by:{" "}
                      <strong>
                        {userMap.get(expense.paidByUserId)?.name || "Unknown"}
                      </strong>
                    </p>
                    <p>
                      Split among:{" "}
                      <strong>{participants.join(", ")}</strong>
                    </p>
                    <p>
                      Per-user share: <strong>{formatCurrency(share)}</strong>
                    </p>
                  </div>
                  {editingId === expense._id ? (
                    <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                      <h4 className="text-sm font-semibold">Edit expense</h4>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                            Amount
                          </label>
                          <input
                            className="input mt-2"
                            type="number"
                            value={editAmount}
                            onChange={(event) =>
                              setEditAmount(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                            Date
                          </label>
                          <input
                            className="input mt-2"
                            type="date"
                            value={editDate}
                            onChange={(event) =>
                              setEditDate(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                            Category
                          </label>
                          <select
                            className="input mt-2"
                            value={editCategory}
                            onChange={(event) =>
                              setEditCategory(event.target.value)
                            }
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
                          <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                            Note
                          </label>
                          <input
                            className="input mt-2"
                            value={editNote}
                            onChange={(event) =>
                              setEditNote(event.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Participants
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {users
                            .filter((u) => u.id !== currentUser?.id)
                            .map((user) => (
                              <label
                                key={user.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={editParticipants.includes(user.id)}
                                  onChange={(event) => {
                                    setEditParticipants((prev) =>
                                      event.target.checked
                                        ? [...prev, user.id]
                                        : prev.filter((id) => id !== user.id)
                                    );
                                  }}
                                />
                                {user.name}
                              </label>
                            ))}
                        </div>
                        <label className="mt-3 flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editIncludeMe}
                            onChange={(event) =>
                              setEditIncludeMe(event.target.checked)
                            }
                          />
                          Include me in split
                        </label>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => saveEdit(expense._id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                      {editMessage ? (
                        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                          {editMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        <div className="mt-6 border-t border-zinc-100 pt-4">
          <h3 className="text-lg font-semibold">Pairwise balances</h3>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            {Object.keys(pairwise).length === 0 ? (
              <p className="text-sm text-zinc-500">No pairwise data.</p>
            ) : (
              Object.entries(pairwise).map(([userId, value]) => (
                <div key={userId} className="flex items-center justify-between">
                  <span>{userMap.get(userId)?.name || "Unknown"}</span>
                  <strong
                    className={
                      value >= 0 ? "text-teal-700" : "text-rose-600"
                    }
                  >
                    {value >= 0
                      ? `Owes you ${formatCurrency(value)}`
                      : `You owe ${formatCurrency(Math.abs(value))}`}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

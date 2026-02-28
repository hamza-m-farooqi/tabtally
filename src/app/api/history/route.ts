import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { roundCurrency, summarizeDayForUser } from "@/lib/finance";
import { Settlement } from "@/models/Settlement";
import { buildPairwiseNet } from "@/lib/finance";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || authUser.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const category = searchParams.get("category");

  await connectToDatabase();
  const expenses = await Expense.find({
    $or: [
      { paidByUserId: authUser._id },
      { participantUserIds: authUser._id },
    ],
    ...(month ? { date: { $regex: `^${month}-` } } : {}),
    ...(category ? { category } : {}),
  })
    .sort({ date: -1 })
    .lean();

  const byDate = new Map<string, typeof expenses>();
  for (const e of expenses) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }

  const baseSummaries = new Map<string, ReturnType<typeof summarizeDayForUser>>();
  for (const [date, list] of byDate.entries()) {
    baseSummaries.set(
      date,
      summarizeDayForUser(list, authUser._id.toString())
    );
  }

  const dates = Array.from(byDate.keys());
  const settlements = await Settlement.find({
    ...(month
      ? { date: { $regex: `^${month}-` } }
      : dates.length
      ? { date: { $in: dates } }
      : {}),
    $or: [
      { paidByUserId: authUser._id },
      { paidToUserId: authUser._id },
    ],
  }).lean();

  const settlementMap = new Map<
    string,
    { status: string; expenseIds: string[] }
  >();
  const settlementPaidByDate = new Map<string, number>();
  const settlementPaidToDate = new Map<string, number>();
  let settlementPaidByTotal = 0;
  let settlementPaidToTotal = 0;
  for (const s of settlements) {
    const key = `${s.date}|${s.paidByUserId.toString()}|${s.paidToUserId.toString()}`;
    settlementMap.set(key, {
      status: s.status,
      expenseIds: s.expenseIds.map((id) => id.toString()),
    });
    if (s.status === "APPROVED") {
      if (s.paidByUserId.toString() === authUser._id.toString()) {
        settlementPaidByDate.set(
          s.date,
          (settlementPaidByDate.get(s.date) || 0) + s.amount
        );
        settlementPaidByTotal += s.amount;
      } else if (s.paidToUserId.toString() === authUser._id.toString()) {
        settlementPaidToDate.set(
          s.date,
          (settlementPaidToDate.get(s.date) || 0) + s.amount
        );
        settlementPaidToTotal += s.amount;
      }
    }
  }

  const rows = Array.from(byDate.entries()).map(([date]) => {
    const base = baseSummaries.get(date);
    if (!base) {
      return { date, totalExpense: 0 };
    }
    return {
      date,
      totalExpense: base.totalExpense,
    };
  });

  rows.sort((a, b) => (a.date < b.date ? 1 : -1));

  const baseMonthSummary = summarizeDayForUser(
    expenses,
    authUser._id.toString()
  );
  const monthNet = roundCurrency(
    baseMonthSummary.youPaid -
      baseMonthSummary.yourShare +
      (settlementPaidByTotal - settlementPaidToTotal)
  );
  const monthSummary = {
    totalExpense: baseMonthSummary.totalExpense,
    youPaid: roundCurrency(baseMonthSummary.youPaid + settlementPaidByTotal),
    youReceived: roundCurrency(settlementPaidToTotal),
    youWillPay: monthNet < 0 ? roundCurrency(Math.abs(monthNet)) : 0,
    youWillReceive: monthNet > 0 ? roundCurrency(monthNet) : 0,
  };

  const days = rows.map((row) => {
    const list = byDate.get(row.date) ?? [];
    const participantSet = new Set<string>();
    for (const e of list) {
      e.participantUserIds.forEach((id: { toString: () => string }) =>
        participantSet.add(id.toString())
      );
      participantSet.add(e.paidByUserId.toString());
    }
    participantSet.delete(authUser._id.toString());

    const settledExpenseIds = new Set<string>();
    const pendingPairs = new Set<string>();
    for (const s of settlements) {
      if (s.date !== row.date) continue;
      if (s.status === "APPROVED") {
        s.expenseIds.forEach((id) => settledExpenseIds.add(id.toString()));
      } else if (s.status === "REQUESTED") {
        const a = s.paidByUserId.toString();
        const b = s.paidToUserId.toString();
        pendingPairs.add([a, b].sort().join("|"));
      }
    }

    const allApproved =
      list.length === 0 ||
      list.every((e) => settledExpenseIds.has(e._id.toString()));

    let netZero = false;
    if (list.length > 0) {
      const pairwise = buildPairwiseNet(
        list,
        authUser._id.toString(),
        Array.from(participantSet)
      );
      netZero = Object.entries(pairwise).every(([withId, value]) => {
        if (Math.abs(value) > 0.01) return false;
        const pairKey = [authUser._id.toString(), withId].sort().join("|");
        return !pendingPairs.has(pairKey);
      });
    }

    const settled = allApproved || netZero;

    return { ...row, settled };
  });

  return NextResponse.json({ days, monthSummary });
}

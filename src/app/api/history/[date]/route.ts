import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { buildPairwiseNet, roundCurrency, summarizeDayForUser } from "@/lib/finance";
import { Settlement } from "@/models/Settlement";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || authUser.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  await connectToDatabase();
  const expenses = await Expense.find({
    date,
    $or: [
      { paidByUserId: authUser._id },
      { participantUserIds: authUser._id },
    ],
    ...(category ? { category } : {}),
  }).lean();

  const summaryBase = summarizeDayForUser(expenses, authUser._id.toString());

  const settlements = await Settlement.find({
    date,
    $or: [{ paidByUserId: authUser._id }, { paidToUserId: authUser._id }],
  }).lean();

  const settlementMap = new Map<
    string,
    { status: string; expenseIds: string[] }
  >();
  const approvedExpenseIds = new Set<string>();
  const approvedPaidBy = new Map<string, number>();
  const approvedPaidTo = new Map<string, number>();
  let settlementPaidBy = 0;
  let settlementPaidTo = 0;
  for (const s of settlements) {
    const key = `${s.date}|${s.paidByUserId.toString()}|${s.paidToUserId.toString()}`;
    settlementMap.set(key, {
      status: s.status,
      expenseIds: s.expenseIds.map((id) => id.toString()),
    });
    if (s.status === "APPROVED") {
      s.expenseIds.forEach((id) => approvedExpenseIds.add(id.toString()));
      const pairKey = [s.paidByUserId.toString(), s.paidToUserId.toString()]
        .sort()
        .join("|");
      approvedPaidBy.set(
        `${s.paidByUserId.toString()}|${pairKey}`,
        (approvedPaidBy.get(`${s.paidByUserId.toString()}|${pairKey}`) || 0) +
          s.amount
      );
      approvedPaidTo.set(
        `${s.paidToUserId.toString()}|${pairKey}`,
        (approvedPaidTo.get(`${s.paidToUserId.toString()}|${pairKey}`) || 0) +
          s.amount
      );
      if (s.paidByUserId.toString() === authUser._id.toString()) {
        settlementPaidBy += s.amount;
      } else if (s.paidToUserId.toString() === authUser._id.toString()) {
        settlementPaidTo += s.amount;
      }
    }
  }

  const dayNet = roundCurrency(
    summaryBase.youPaid -
      summaryBase.yourShare +
      (settlementPaidBy - settlementPaidTo)
  );

  const summary = {
    totalExpense: summaryBase.totalExpense,
    youPaid: roundCurrency(summaryBase.youPaid + settlementPaidBy),
    yourShare: summaryBase.yourShare,
    youReceived: roundCurrency(settlementPaidTo),
    youWillPay: dayNet < 0 ? roundCurrency(Math.abs(dayNet)) : 0,
    youWillReceive: dayNet > 0 ? roundCurrency(dayNet) : 0,
  };

  const participantSet = new Set<string>();
  for (const e of expenses) {
    for (const id of e.participantUserIds) {
      participantSet.add(id.toString());
    }
    participantSet.add(e.paidByUserId.toString());
  }
  participantSet.delete(authUser._id.toString());

  const pairwise: Record<string, number> = {};
  for (const withId of Array.from(participantSet)) {
    const baseNet =
      buildPairwiseNet(expenses, authUser._id.toString(), [withId])[withId] ??
      0;

    const pairKey = [authUser._id.toString(), withId].sort().join("|");
    const paidByMe = approvedPaidBy.get(
      `${authUser._id.toString()}|${pairKey}`
    ) || 0;
    const paidByOther = approvedPaidBy.get(`${withId}|${pairKey}`) || 0;

    pairwise[withId] = roundCurrency(baseNet + paidByMe - paidByOther);
  }

  return NextResponse.json({
    expenses,
    summary,
    pairwise,
    approvedExpenseIds: Array.from(approvedExpenseIds),
  });
}

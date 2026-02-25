import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { summarizeDayForUser } from "@/lib/finance";
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

  const rows = Array.from(byDate.entries()).map(([date, list]) => {
    const summary = summarizeDayForUser(list, authUser._id.toString());
    return {
      date,
      totalExpense: summary.totalExpense,
      youPaid: summary.youPaid,
      yourNet: summary.yourNet,
    };
  });

  rows.sort((a, b) => (a.date < b.date ? 1 : -1));

  const monthSummary = summarizeDayForUser(expenses, authUser._id.toString());

  const dates = rows.map((row) => row.date);
  const settlements = await Settlement.find({
    ...(dates.length ? { date: { $in: dates } } : {}),
    $or: [{ userId: authUser._id }, { withUserId: authUser._id }],
  }).lean();

  const settlementMap = new Map<string, string>();
  for (const s of settlements) {
    const key = `${s.date}|${s.userId.toString()}|${s.withUserId.toString()}`;
    settlementMap.set(key, s.status);
  }

  const days = rows.map((row) => {
    const list = byDate.get(row.date) ?? [];
    const participantSet = new Set<string>();
    for (const e of list) {
      e.participantUserIds.forEach((id) => participantSet.add(id.toString()));
      participantSet.add(e.paidByUserId.toString());
    }
    participantSet.delete(authUser._id.toString());

    const pairwise = buildPairwiseNet(
      list,
      authUser._id.toString(),
      Array.from(participantSet)
    );

    const required = Object.entries(pairwise)
      .filter(([, value]) => Math.abs(value) > 0.01)
      .map(([withUserId]) => withUserId);

    const settled =
      required.length === 0 ||
      required.every((withId) => {
        const meKey = `${row.date}|${authUser._id.toString()}|${withId}`;
        const otherKey = `${row.date}|${withId}|${authUser._id.toString()}`;
        return (
          settlementMap.get(meKey) === "SETTLED" &&
          settlementMap.get(otherKey) === "SETTLED"
        );
      });

    return { ...row, settled };
  });

  return NextResponse.json({ days, monthSummary });
}

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { Expense } from "@/models/Expense";
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

  const dates = Array.from(byDate.keys());
  const settlements = await Settlement.find({
    ...(dates.length ? { date: { $in: dates } } : {}),
    $or: [{ userId: authUser._id }, { withUserId: authUser._id }],
  }).lean();

  const settlementMap = new Map<string, string>();
  for (const s of settlements) {
    const key = `${s.date}|${s.userId.toString()}|${s.withUserId.toString()}`;
    settlementMap.set(key, s.status);
  }

  const unsettledDays = [];

  for (const [date, list] of byDate.entries()) {
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

    const pairs = Object.entries(pairwise)
      .filter(([, value]) => Math.abs(value) > 0.01)
      .map(([withUserId, value]) => {
        const meKey = `${date}|${authUser._id.toString()}|${withUserId}`;
        const otherKey = `${date}|${withUserId}|${authUser._id.toString()}`;
        const meSettled = settlementMap.get(meKey) === "SETTLED";
        const otherSettled = settlementMap.get(otherKey) === "SETTLED";

        let status: "PENDING_ME" | "PENDING_OTHER" | "SETTLED" = "PENDING_ME";
        if (meSettled && otherSettled) status = "SETTLED";
        else if (meSettled && !otherSettled) status = "PENDING_OTHER";

        return {
          withUserId,
          amount: value,
          status,
        };
      });

    const daySettled =
      pairs.length === 0 || pairs.every((p) => p.status === "SETTLED");

    if (!daySettled) {
      unsettledDays.push({ date, pairs });
    }
  }

  unsettledDays.sort((a, b) => (a.date < b.date ? 1 : -1));

  return NextResponse.json({ days: unsettledDays });
}

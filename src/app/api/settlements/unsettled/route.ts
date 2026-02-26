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
    $or: [
      { paidByUserId: authUser._id },
      { paidToUserId: authUser._id },
    ],
  }).lean();

  const settlementMap = new Map<
    string,
    {
      status: string;
      expenseIds: string[];
      amount: number;
      _id: string;
      paidBy: string;
      paidTo: string;
    }
  >();
  const approvedTotals = new Map<string, number>();
  const approvedSigned = new Map<string, number>();
  const approvedByDirection = new Map<string, number>();
  for (const s of settlements) {
    const key = `${s.date}|${s.paidByUserId.toString()}|${s.paidToUserId.toString()}`;
    settlementMap.set(key, {
      status: s.status,
      expenseIds: s.expenseIds.map((id) => id.toString()),
      amount: s.amount,
      _id: s._id.toString(),
      paidBy: s.paidByUserId.toString(),
      paidTo: s.paidToUserId.toString(),
    });
    if (s.status === "APPROVED") {
      const a = s.paidByUserId.toString();
      const b = s.paidToUserId.toString();
      const pairKey = `${s.date}|${[a, b].sort().join("|")}`;
      approvedTotals.set(pairKey, (approvedTotals.get(pairKey) || 0) + s.amount);
      const signedDelta =
        authUser._id.toString() === a ? -s.amount : authUser._id.toString() === b ? s.amount : 0;
      approvedSigned.set(pairKey, (approvedSigned.get(pairKey) || 0) + signedDelta);
      const directionKey = `${s.date}|${a}|${b}`;
      approvedByDirection.set(
        directionKey,
        (approvedByDirection.get(directionKey) || 0) + s.amount
      );
    }
  }

  const unsettledDays = [];

  for (const date of Array.from(byDate.keys())) {
    const list = byDate.get(date) ?? [];
    const participantSet = new Set<string>();
    for (const e of list) {
      e.participantUserIds.forEach((id: { toString: () => string }) =>
        participantSet.add(id.toString())
      );
      participantSet.add(e.paidByUserId.toString());
    }
    participantSet.delete(authUser._id.toString());

    const pairs = Array.from(participantSet).flatMap((withUserId) => {
      const pendingFromMeKey = `${date}|${authUser._id.toString()}|${withUserId}`;
      const pendingFromOtherKey = `${date}|${withUserId}|${authUser._id.toString()}`;
      const pendingFromMe = settlementMap.get(pendingFromMeKey);
      const pendingFromOther = settlementMap.get(pendingFromOtherKey);

      const baseNet =
        buildPairwiseNet(list, authUser._id.toString(), [withUserId])[
          withUserId
        ] ?? 0;

      const paidByMe =
        approvedByDirection.get(
          `${date}|${authUser._id.toString()}|${withUserId}`
        ) || 0;
      const paidByOther =
        approvedByDirection.get(
          `${date}|${withUserId}|${authUser._id.toString()}`
        ) || 0;

      let remainingNet = Math.round(
        (baseNet + paidByMe - paidByOther) * 100
      ) / 100;

      let status:
        | "CAN_REQUEST"
        | "REQUESTED"
        | "PENDING_APPROVAL"
        | "AWAIT_REQUEST"
        | "SETTLED" = "SETTLED";
      let signedNet = remainingNet;
      let amount = Math.abs(remainingNet);
      let settlementId: string | null = null;

      const pairKey = `${date}|${[authUser._id.toString(), withUserId]
        .sort()
        .join("|")}`;
      const settledAmount = approvedTotals.get(pairKey) || 0;
      const settledSigned = approvedSigned.get(pairKey) || 0;

      if (pendingFromOther && pendingFromOther.status === "REQUESTED") {
        status = "PENDING_APPROVAL";
        amount = pendingFromOther.amount;
        signedNet = pendingFromOther.paidTo === authUser._id.toString()
          ? pendingFromOther.amount
          : -pendingFromOther.amount;
        settlementId = pendingFromOther._id;
      } else if (pendingFromMe && pendingFromMe.status === "REQUESTED") {
        status = "REQUESTED";
        amount = pendingFromMe.amount;
        signedNet = pendingFromMe.paidTo === authUser._id.toString()
          ? pendingFromMe.amount
          : -pendingFromMe.amount;
        settlementId = pendingFromMe._id;
      } else if (Math.abs(remainingNet) > 0.01) {
        if (remainingNet < 0) {
          status = "CAN_REQUEST";
          amount = Math.abs(remainingNet);
          signedNet = remainingNet;
        } else {
          status = "AWAIT_REQUEST";
          amount = Math.abs(remainingNet);
          signedNet = remainingNet;
        }
      } else {
        status = "SETTLED";
        amount = settledAmount;
        signedNet = settledSigned;
      }

      const result = [];

      if (status === "SETTLED") {
        result.push({
          pairId: `${withUserId}|SETTLED`,
          withUserId,
          amount,
          signedNet,
          status,
          settlementId,
        });
        return result;
      }

      result.push({
        pairId: `${withUserId}|ACTIVE`,
        withUserId,
        amount,
        signedNet,
        status,
        settlementId,
      });

      return result;
    });

    const daySettled =
      pairs.length === 0 || pairs.every((p) => p.status === "SETTLED");

    if (!daySettled) {
      unsettledDays.push({
        date,
        status: daySettled ? "SETTLED" : "UNSETTLED",
        pairs: pairs.filter((p) => p.status !== "SETTLED"),
      });
    }
  }

  unsettledDays.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "UNSETTLED" ? -1 : 1;
    }
    return a.date < b.date ? 1 : -1;
  });

  return NextResponse.json({ days: unsettledDays });
}

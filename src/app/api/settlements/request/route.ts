import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { Expense } from "@/models/Expense";
import { Settlement } from "@/models/Settlement";
import { buildPairwiseNet, toObjectId } from "@/lib/finance";

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || authUser.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { date, withUserId } = body ?? {};

  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  if (!withUserId || typeof withUserId !== "string") {
    return NextResponse.json(
      { error: "withUserId is required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const existingRequest = await Settlement.findOne({
    date,
    status: "REQUESTED",
    $or: [
      { paidByUserId: authUser._id, paidToUserId: toObjectId(withUserId) },
      { paidByUserId: toObjectId(withUserId), paidToUserId: authUser._id },
    ],
  }).lean();

  if (existingRequest) {
    return NextResponse.json(
      { error: "A settlement request is already pending for this pair." },
      { status: 409 }
    );
  }

  const otherUserObjectId = toObjectId(withUserId);
  const expenses = await Expense.find({
    date,
    $or: [
      { participantUserIds: { $all: [authUser._id, otherUserObjectId] } },
      {
        paidByUserId: { $in: [authUser._id, otherUserObjectId] },
        participantUserIds: otherUserObjectId,
      },
      {
        paidByUserId: { $in: [authUser._id, otherUserObjectId] },
        participantUserIds: authUser._id,
      },
    ],
  }).lean();

  const settlements = await Settlement.find({
    date,
    $or: [
      { paidByUserId: authUser._id, paidToUserId: otherUserObjectId },
      { paidByUserId: otherUserObjectId, paidToUserId: authUser._id },
    ],
    status: { $in: ["REQUESTED", "APPROVED"] },
  }).lean();

  const excludeIds = new Set<string>();
  for (const s of settlements) {
    s.expenseIds.forEach((id) => excludeIds.add(id.toString()));
  }

  const remainingExpenses = expenses.filter(
    (e) => !excludeIds.has(e._id.toString())
  );

  const remainingNet = buildPairwiseNet(
    remainingExpenses,
    authUser._id.toString(),
    [withUserId]
  )[withUserId] ?? 0;

  if (remainingNet >= -0.01) {
    return NextResponse.json(
      { error: "No payable balance remaining for this pair." },
      { status: 409 }
    );
  }

  const settlement = await Settlement.create({
    date,
    expenseIds: remainingExpenses.map((e) => e._id),
    paidByUserId: authUser._id,
    paidToUserId: toObjectId(withUserId),
    amount: Math.abs(remainingNet),
    status: "REQUESTED",
  });

  return NextResponse.json({ id: settlement._id.toString() }, { status: 201 });
}

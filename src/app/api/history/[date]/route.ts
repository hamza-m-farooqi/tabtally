import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { buildPairwiseNet, summarizeDayForUser } from "@/lib/finance";

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

  const summary = summarizeDayForUser(expenses, authUser._id.toString());

  const participantSet = new Set<string>();
  for (const e of expenses) {
    for (const id of e.participantUserIds) {
      participantSet.add(id.toString());
    }
    participantSet.add(e.paidByUserId.toString());
  }
  participantSet.delete(authUser._id.toString());

  const pairwise = buildPairwiseNet(
    expenses,
    authUser._id.toString(),
    Array.from(participantSet)
  );

  return NextResponse.json({ expenses, summary, pairwise });
}

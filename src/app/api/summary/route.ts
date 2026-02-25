import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { buildPairwiseNet, summarizeDayForUser } from "@/lib/finance";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || authUser.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const category = searchParams.get("category");
  const withIds = searchParams.getAll("with");

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

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
  const pairwise = buildPairwiseNet(
    expenses,
    authUser._id.toString(),
    withIds
  );

  return NextResponse.json({ summary, pairwise });
}

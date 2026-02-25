import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { expenseSchema } from "@/lib/validators";
import { toObjectId } from "@/lib/finance";

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || authUser.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { amount, note, category, date, participantUserIds, includeMe } =
    parsed.data;

  let participants = participantUserIds;
  if (includeMe && !participants.includes(authUser._id.toString())) {
    participants = [...participants, authUser._id.toString()];
  }
  if (!includeMe) {
    participants = participants.filter((id) => id !== authUser._id.toString());
  }

  if (participants.length === 0) {
    return NextResponse.json(
      { error: "At least one participant is required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const expense = await Expense.create({
    amount,
    note,
    category,
    date,
    paidByUserId: authUser._id,
    participantUserIds: participants.map(toObjectId),
  });

  return NextResponse.json({ id: expense._id.toString() }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || authUser.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const category = searchParams.get("category");
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
  })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ expenses });
}

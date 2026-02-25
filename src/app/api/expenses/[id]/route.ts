import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { expenseSchema } from "@/lib/validators";
import { toObjectId } from "@/lib/finance";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  await connectToDatabase();
  const expense = await Expense.findById(id);
  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    expense.paidByUserId.toString() !== authUser._id.toString() &&
    authUser.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  expense.amount = amount;
  expense.note = note;
  expense.category = category;
  expense.date = date;
  expense.participantUserIds = participants.map(toObjectId);
  await expense.save();

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || authUser.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const expense = await Expense.findById(id);
  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    expense.paidByUserId.toString() !== authUser._id.toString() &&
    authUser.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await expense.deleteOne();
  return NextResponse.json({ ok: true });
}

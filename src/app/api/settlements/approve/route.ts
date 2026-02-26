import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { Settlement } from "@/models/Settlement";

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || authUser.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { settlementId } = body ?? {};

  if (!settlementId || typeof settlementId !== "string") {
    return NextResponse.json(
      { error: "settlementId is required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const settlement = await Settlement.findById(settlementId);
  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  if (settlement.paidToUserId.toString() !== authUser._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (settlement.status !== "REQUESTED") {
    return NextResponse.json(
      { error: "Settlement is not pending approval." },
      { status: 409 }
    );
  }

  settlement.status = "APPROVED";
  settlement.approvedAt = new Date();
  await settlement.save();

  return NextResponse.json({ ok: true });
}

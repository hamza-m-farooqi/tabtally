import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { Settlement } from "@/models/Settlement";
import { toObjectId } from "@/lib/finance";

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

  await Settlement.findOneAndUpdate(
    {
      date,
      userId: authUser._id,
      withUserId: toObjectId(withUserId),
    },
    { $set: { status: "SETTLED", settledAt: new Date() } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}

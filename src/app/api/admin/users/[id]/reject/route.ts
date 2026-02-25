import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Types } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || authUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const ids: (string | Types.ObjectId)[] = [id];
  if (Types.ObjectId.isValid(id)) {
    ids.push(new Types.ObjectId(id));
  }

  const result = await User.updateOne(
    { _id: { $in: ids } },
    { $set: { status: "REJECTED" } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

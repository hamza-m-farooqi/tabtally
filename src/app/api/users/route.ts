import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const users = await User.find({ status: "APPROVED" }).sort({ name: 1 });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
    })),
  });
}

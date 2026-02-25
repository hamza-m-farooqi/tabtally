import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { signinSchema } from "@/lib/validators";
import { signToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = signinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.status !== "APPROVED") {
    return NextResponse.json({ status: user.status }, { status: 403 });
  }

  const token = signToken({
    sub: user._id.toString(),
    role: user.role,
    status: user.status,
    name: user.name,
    email: user.email,
  });

  const res = NextResponse.json({ status: "APPROVED" });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

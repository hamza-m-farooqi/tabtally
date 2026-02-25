import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { signupSchema } from "@/lib/validators";
import { signToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, createAsAdmin, adminSecret } = parsed.data;
  const adminSignupSecret = process.env.ADMIN_SIGNUP_SECRET;

  if (createAsAdmin) {
    if (!adminSignupSecret || adminSecret !== adminSignupSecret) {
      return NextResponse.json(
        { error: "Invalid admin signup secret" },
        { status: 403 }
      );
    }
  }

  await connectToDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: createAsAdmin ? "ADMIN" : "USER",
    status: createAsAdmin ? "APPROVED" : "PENDING",
  });

  if (user.status !== "APPROVED") {
    return NextResponse.json({ status: "PENDING" }, { status: 201 });
  }

  const token = signToken({
    sub: user._id.toString(),
    role: user.role,
    status: user.status,
    name: user.name,
    email: user.email,
  });

  const res = NextResponse.json({ status: "APPROVED" }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

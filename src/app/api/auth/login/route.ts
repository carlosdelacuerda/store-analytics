import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionCookieOptions, signSessionToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { username, password, rememberMe } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const cookieConfig = getSessionCookieOptions(rememberMe);
  const token = await signSessionToken(
    { userId: user.id, username: user.username },
    cookieConfig.maxAge
  );

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, username: user.username },
  });
  response.cookies.set(cookieConfig.name, token, cookieConfig.options);
  return response;
}

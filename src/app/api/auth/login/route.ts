
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export const runtime = "nodejs";

function safeCompare(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a, "utf8").digest();
  const hashB = createHash("sha256").update(b, "utf8").digest();

  return timingSafeEqual(hashA, hashB);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid request." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const { username, password } = data;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username ||
      !password ||
      username.length > 256 ||
      password.length > 1024
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials." },
        { status: 400 }
      );
    }

    const expectedUsername = process.env.ADMIN_USERNAME ?? "";
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
    const missingConfiguration = [
      !expectedUsername.trim() ? "ADMIN_USERNAME" : null,
      !expectedPassword ? "ADMIN_PASSWORD" : null,
      !process.env.SESSION_SECRET ||
      Buffer.byteLength(process.env.SESSION_SECRET, "utf8") < 32
        ? "SESSION_SECRET"
        : null,
    ].filter((name): name is string => name !== null);

    if (missingConfiguration.length > 0) {
      console.error("AUTH CONFIG ERROR:", {
        missingEnvironmentVariables: missingConfiguration,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Authentication unavailable.",
          code: "AUTH_CONFIG_MISSING",
          missingEnvironmentVariables: missingConfiguration,
        },
        { status: 503 }
      );
    }

    const usernameValid = safeCompare(username, expectedUsername);
    const passwordValid = safeCompare(password, expectedPassword);

    if (!usernameValid || !passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    const token = createSession(expectedUsername);

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON." },
        { status: 400 }
      );
    }

    console.error(
      "LOGIN ERROR:",
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { message: "Unknown login error." },
    );

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

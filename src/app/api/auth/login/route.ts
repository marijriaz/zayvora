
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeCompare(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a, "utf8").digest();
  const hashB = createHash("sha256").update(b, "utf8").digest();

  return timingSafeEqual(hashA, hashB);
}

function jsonResponse(
  data: Record<string, unknown>,
  status = 200
) {
  const response = NextResponse.json(data, { status });

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  return response;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid request.",
        },
        400
      );
    }

    const data = body as Record<string, unknown>;

    const username = data.username;
    const password = data.password;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password ||
      username.length > 256 ||
      password.length > 1024
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid credentials.",
        },
        400
      );
    }

    // Read server-side environment variables
    const configuredUsername =
      process.env.ADMIN_USERNAME ?? "";

    const configuredPassword =
      process.env.ADMIN_PASSWORD ?? "";

    const sessionSecret =
      process.env.SESSION_SECRET ?? "";

    // Validate configuration
    const missingVariables: string[] = [];

    if (!configuredUsername.trim()) {
      missingVariables.push("ADMIN_USERNAME");
    }

    if (!configuredPassword) {
      missingVariables.push("ADMIN_PASSWORD");
    }

    if (Buffer.byteLength(sessionSecret, "utf8") < 32) {
      missingVariables.push("SESSION_SECRET");
    }

    if (missingVariables.length > 0) {
      console.error("AUTH CONFIGURATION ERROR:", {
        missingVariables,
      });

      return jsonResponse(
        {
          success: false,
          message: "Authentication unavailable.",
          code: "AUTH_CONFIG_MISSING",
          missingEnvironmentVariables: missingVariables,
        },
        503
      );
    }

    // Normalize username only.
    // Password remains unchanged.
    const submittedUsername = username.trim();

    const usernameValid = safeCompare(
      submittedUsername,
      configuredUsername.trim()
    );

    const passwordValid = safeCompare(
      password,
      configuredPassword
    );

    if (!usernameValid || !passwordValid) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid username or password.",
          code: "INVALID_CREDENTIALS",
        },
        401
      );
    }

    // Create authenticated session
    // Pass the original configured username to match auth.ts
    const token = createSession(configuredUsername);

    const response = jsonResponse({
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

    return response;

  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid JSON request.",
        },
        400
      );
    }

    console.error("ADMIN LOGIN ERROR:", {
      name:
        error instanceof Error
          ? error.name
          : "UnknownError",
      message:
        error instanceof Error
          ? error.message
          : "Unknown login error",
    });

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
        code: "LOGIN_SERVER_ERROR",
      },
      500
    );
  }
}

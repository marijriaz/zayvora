
import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "zayvora_admin_session";
export const SESSION_MAX_AGE = 8 * 60 * 60;

export interface AdminSession {
  username: string;
  issuedAt: number;
  expiresAt: number;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("SESSION_SECRET is missing or too weak.");
  }

  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createSession(username: string): string {
  if (!username || username !== process.env.ADMIN_USERNAME) {
    throw new Error("Invalid administrator username.");
  }

  const now = Math.floor(Date.now() / 1000);

  const session: AdminSession = {
    username,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE,
  };

  const payload = Buffer.from(
    JSON.stringify(session)
  ).toString("base64url");

  return `${payload}.${signPayload(payload)}`;
}

export function verifySession(token: string): AdminSession | null {
  try {
    if (typeof token !== "string" || token.length > 4096) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) return null;

    const [payload, suppliedSignature] = parts;

    if (
      !payload ||
      !suppliedSignature ||
      !/^[A-Za-z0-9_-]+$/.test(payload) ||
      !/^[A-Za-z0-9_-]{43}$/.test(suppliedSignature)
    ) {
      return null;
    }

    const decodedBuffer = Buffer.from(payload, "base64url");

    if (decodedBuffer.toString("base64url") !== payload) {
      return null;
    }

    const expectedSignature = Buffer.from(
      signPayload(payload),
      "base64url"
    );

    const actualSignature = Buffer.from(
      suppliedSignature,
      "base64url"
    );

    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(expectedSignature, actualSignature)
    ) {
      return null;
    }

    const parsed: unknown = JSON.parse(decodedBuffer.toString("utf8"));

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const data = parsed as Record<string, unknown>;

    if (
      typeof data.username !== "string" ||
      !process.env.ADMIN_USERNAME ||
      data.username !== process.env.ADMIN_USERNAME ||
      typeof data.issuedAt !== "number" ||
      typeof data.expiresAt !== "number" ||
      !Number.isSafeInteger(data.issuedAt) ||
      !Number.isSafeInteger(data.expiresAt)
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (
      data.issuedAt <= 0 ||
      data.issuedAt > now + 60 ||
      data.expiresAt <= now ||
      data.expiresAt !== data.issuedAt + SESSION_MAX_AGE
    ) {
      return null;
    }

    return {
      username: data.username,
      issuedAt: data.issuedAt,
      expiresAt: data.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    return verifySession(token);
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

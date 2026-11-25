import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PATCH(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid availability details." }, { status: 400 });
  }
  const id = Number(body.id);
  if (!Number.isSafeInteger(id) || id <= 0 || typeof body.available !== "boolean") {
    return NextResponse.json({ error: "Invalid availability details." }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `UPDATE menu_items
       SET available = $1
       WHERE id = $2
       RETURNING id, name, available`,
      [body.available, id],
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Dish not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error("AVAILABILITY UPDATE ERROR:", error);
    return NextResponse.json(
      { error: "Unable to update availability." },
      { status: 500 },
    );
  }
}

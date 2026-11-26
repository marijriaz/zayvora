import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import pool, { getSafeDatabaseError } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validImageUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("MENU LOAD CONFIG ERROR: DATABASE_URL is missing or empty.");
    return NextResponse.json(
      {
        error: "The menu service is not configured.",
        code: "DATABASE_URL_MISSING",
      },
      { status: 503 },
    );
  }

  try {
    const result = await pool.query(
      `SELECT id, name, description, price, category, image_url, available
       FROM menu_items
       ORDER BY category NULLS LAST, name ASC, id ASC`,
    );
    return NextResponse.json(result.rows, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const databaseError = getSafeDatabaseError(error);
    console.error("MENU LOAD ERROR:", databaseError);
    return NextResponse.json(
      { error: "Failed to load menu items.", code: databaseError.code },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  const price = Number(body.price);
  const available = body.available === undefined ? true : body.available;

  if (
    !name ||
    name.length > 150 ||
    description.length > 2000 ||
    category.length > 100 ||
    !Number.isFinite(price) ||
    price <= 0 ||
    typeof available !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Enter a valid dish name, description, category, price, and availability." },
      { status: 400 },
    );
  }
  if (
    (body.image_url !== undefined && typeof body.image_url !== "string") ||
    !validImageUrl(imageUrl)
  ) {
    return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
  }

  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const normalizedName = name.toLocaleLowerCase();
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`zayvora-menu-name:${normalizedName}`],
    );
    const duplicate = await client.query(
      "SELECT id FROM menu_items WHERE lower(btrim(name)) = $1 LIMIT 1",
      [normalizedName],
    );
    if (duplicate.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "A dish with this name already exists." },
        { status: 409 },
      );
    }

    const result = await client.query(
      `INSERT INTO menu_items (name, description, price, category, image_url, available)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, price, category, image_url, available`,
      [name, description || null, price, category || null, imageUrl || null, available],
    );
    await client.query("COMMIT");
    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch((rollbackError: unknown) => {
        console.error("MENU CREATE ROLLBACK ERROR:", rollbackError);
      });
    }
    console.error("MENU CREATE ERROR:", error);
    return NextResponse.json({ error: "Failed to add menu item." }, { status: 500 });
  } finally {
    client?.release();
  }
}

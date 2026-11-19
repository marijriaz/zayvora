
import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET: Display all menu items
export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY id DESC"
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}

// POST: Add new menu item
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price);

    if (!name || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "Valid name and price are required" },
        { status: 400 }
      );
    }

    // Prevent duplicate dish names
    const existing = await pool.query(
      `SELECT id FROM menu_items
       WHERE LOWER(TRIM(name)) = LOWER($1)`,
      [name]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "This food item already exists!" },
        { status: 409 }
      );
    }

    // Save new food item
    const result = await pool.query(
      `INSERT INTO menu_items
       (name, price, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, price, description]
    );

    return NextResponse.json(
      {
        message: "Food item added successfully!",
        item: result.rows[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to add food item" },
      { status: 500 }
    );
  }
}

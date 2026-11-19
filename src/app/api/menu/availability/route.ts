
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      typeof body.available !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid availability details" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE menu_items
       SET available = $1
       WHERE id = $2
       RETURNING *`,
      [body.available, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Availability error:", error);

    return NextResponse.json(
      { error: "Unable to update availability" },
      { status: 500 }
    );
  }
}

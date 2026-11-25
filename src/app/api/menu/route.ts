
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
       RETURNING id, name, available`,
      [body.available, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Dish not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: result.rows[0]
    });

  } catch (error) {
    console.error("Availability error:", error);

    return NextResponse.json(
      { error: "Unable to update availability" },
      { status: 500 }
    );
  }
}


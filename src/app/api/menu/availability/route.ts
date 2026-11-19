
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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

    const result = await sql`
      UPDATE menu_items
      SET available = ${body.available}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);

  } catch (error) {
    console.error("Availability error:", error);

    return NextResponse.json(
      { error: "Unable to update availability" },
      { status: 500 }
    );
  }
}

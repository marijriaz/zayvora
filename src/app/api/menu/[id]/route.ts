
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// PUT: Update existing food item
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json(
        { error: "Invalid food ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price);
    const category = String(body.category || "").trim();
    const image_url = String(body.image_url || "").trim();

    if (!name || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "Valid dish name and price are required." },
        { status: 400 }
      );
    }

    if (
      image_url &&
      !/^https?:\/\/.+/i.test(image_url)
    ) {
      return NextResponse.json(
        { error: "Please provide a valid image URL." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE menu_items
       SET name = $1,
           description = $2,
           price = $3,
           category = $4,
           image_url = $5
       WHERE id = $6
       RETURNING *`,
      [
        name,
        description,
        price,
        category || null,
        image_url || null,
        itemId
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Food item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Food item updated successfully!",
      item: result.rows[0]
    });

  } catch (error: any) {
    console.error("UPDATE ERROR:", error);

    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This dish name already exists. Choose another name." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to update food item."
      },
      { status: 500 }
    );
  }
}


// DELETE: Delete food item
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json(
        { error: "Invalid food ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM menu_items
       WHERE id = $1
       RETURNING *`,
      [itemId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Food item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Food item deleted successfully!"
    });

  } catch (error) {
    console.error("DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete food item." },
      { status: 500 }
    );
  }
}

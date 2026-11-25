
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

type Context = {
  params: Promise<{ id: string }>;
};

function validImageUrl(value: string): boolean {
  if (!value) return true;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

// ADMIN ONLY: Update food item
export async function PUT(request: Request, context: Context) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json(
        { error: "Invalid food ID." },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const name =
      typeof data.name === "string" ? data.name.trim() : "";

    const description =
      typeof data.description === "string"
        ? data.description.trim()
        : "";

    const category =
      typeof data.category === "string"
        ? data.category.trim()
        : "";

    const imageUrl =
      typeof data.image_url === "string"
        ? data.image_url.trim()
        : "";

    const price = Number(data.price);

    if (
      !name ||
      name.length > 150 ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        { error: "Valid dish name and price are required." },
        { status: 400 }
      );
    }

    if (
      (data.image_url !== undefined &&
        typeof data.image_url !== "string") ||
      !validImageUrl(imageUrl)
    ) {
      return NextResponse.json(
        { error: "Invalid image URL." },
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
        imageUrl || null,
        itemId,
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
      item: result.rows[0],
    });
  } catch (error) {
    const dbError = error as { code?: string };

    if (dbError.code === "23505") {
      return NextResponse.json(
        { error: "This dish name already exists." },
        { status: 409 }
      );
    }

    console.error("MENU UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update food item." },
      { status: 500 }
    );
  }
}

// ADMIN ONLY: Delete food item
export async function DELETE(
  request: Request,
  context: Context
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json(
        { error: "Invalid food ID." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM menu_items
       WHERE id = $1
       RETURNING id`,
      [itemId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Food item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Food item deleted successfully!",
    });
  } catch (error) {
    console.error("MENU DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete food item." },
      { status: 500 }
    );
  }
}

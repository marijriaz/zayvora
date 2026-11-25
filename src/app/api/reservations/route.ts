
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid reservation details." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const name =
      typeof data.name === "string" ? data.name.trim() : "";

    const phone =
      typeof data.phone === "string" ? data.phone.trim() : "";

    const email =
      typeof data.email === "string" ? data.email.trim() : "";

    const date =
      typeof data.date === "string" ? data.date : "";

    const time =
      typeof data.time === "string" ? data.time : "";

    const guests = Number(data.guests);

    const requests =
      typeof data.requests === "string"
        ? data.requests.trim()
        : "";

    // Validate customer information
    if (
      !name ||
      name.length > 100 ||
      !phone ||
      phone.length > 30 ||
      email.length > 150 ||
      requests.length > 1000
    ) {
      return NextResponse.json(
        { error: "Please provide valid customer details." },
        { status: 400 }
      );
    }

    // Validate optional email
    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Validate date
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      new Date(`${date}T00:00:00.000Z`)
        .toISOString()
        .slice(0, 10) !== date
    ) {
      return NextResponse.json(
        { error: "Invalid reservation date." },
        { status: 400 }
      );
    }

    // Validate time
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return NextResponse.json(
        { error: "Invalid reservation time." },
        { status: 400 }
      );
    }

    // Validate number of guests
    if (
      !Number.isInteger(guests) ||
      guests < 1 ||
      guests > 12
    ) {
      return NextResponse.json(
        { error: "Guests must be between 1 and 12." },
        { status: 400 }
      );
    }

    // Save reservation in NeonDB
    const result = await pool.query(
      `INSERT INTO reservations
       (
         customer_name,
         phone,
         email,
         reservation_date,
         reservation_time,
         guests,
         special_requests
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, status, created_at`,
      [
        name,
        phone,
        email || null,
        date,
        time,
        guests,
        requests || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Your reservation request has been received!",
        reservation: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request." },
        { status: 400 }
      );
    }

    console.error("RESERVATION ERROR:", error);

    return NextResponse.json(
      { error: "Unable to submit reservation. Please try again." },
      { status: 500 }
    );
  }
}

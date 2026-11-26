
import { NextResponse } from "next/server";
import pool, { getSafeDatabaseError } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const name = typeof data.name === "string" ? data.name.trim() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim() : "";

    const date =
      typeof data.date === "string" ? data.date : "";

    const time =
      typeof data.time === "string" ? data.time : "";

    const guests =
      typeof data.guests === "string" || typeof data.guests === "number"
        ? Number(data.guests)
        : Number.NaN;

    const requests =
      data.requests === undefined
        ? ""
        : typeof data.requests === "string"
          ? data.requests.trim()
          : null;
    const phoneDigits = phone.replace(/\D/g, "").length;

    if (
      !name ||
      name.length < 2 ||
      name.length > 100 ||
      !/\p{L}/u.test(name) ||
      !phone ||
      phone.length > 30 ||
      !/^\+?[0-9().\s-]+$/.test(phone) ||
      phoneDigits < 7 ||
      phoneDigits > 15 ||
      !email ||
      email.length > 150 ||
      requests === null ||
      requests.length > 1000
    ) {
      return NextResponse.json(
        { error: "Please provide valid customer details." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Validate date
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00.000Z`)
      : null;
    if (
      !parsedDate ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return NextResponse.json(
        { error: "Invalid reservation date." },
        { status: 400 }
      );
    }
    const todayInPakistan = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi",
    }).format(new Date());
    if (date < todayInPakistan) {
      return NextResponse.json(
        { error: "Reservation date cannot be in the past." },
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

    if (!process.env.DATABASE_URL?.trim()) {
      console.error("RESERVATION CONFIG ERROR: DATABASE_URL is missing or empty.");
      return NextResponse.json(
        {
          error: "The reservation service is not configured.",
          code: "DATABASE_URL_MISSING",
        },
        { status: 503 }
      );
    }

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

    if (!result.rows[0]) {
      throw new Error("Reservation insert returned no row.");
    }

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

    const databaseError = getSafeDatabaseError(error);
    console.error("RESERVATION ERROR:", databaseError);

    return NextResponse.json(
      {
        error: "Unable to submit reservation. Please try again.",
        code: databaseError.code,
      },
      { status: 500 }
    );
  }
}

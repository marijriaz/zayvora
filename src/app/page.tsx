
"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";

type Tab = "home" | "menu" | "about" | "reservation" | "contact";

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  image_url: string | null;
  available?: boolean;
}

const C = {
  green: "#26382D",
  dark: "#1C2921",
  cream: "#F8F4EC",
  white: "#FFFDF8",
  gold: "#C6A46A",
  brown: "#A85E3D",
  muted: "#827A6E",
};

const emptyBooking = {
  name: "",
  phone: "",
  email: "",
  date: "",
  time: "",
  guests: "2",
  requests: "",
};

const buttonPrimary: React.CSSProperties = {
  background: C.brown,
  color: "#fff",
  border: "none",
  borderRadius: "40px",
  padding: "15px 28px",
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 15px",
  border: "1px solid #DED5C7",
  borderRadius: "7px",
  background: "#fff",
  color: C.dark,
  fontSize: "14px",
  outlineColor: C.gold,
};

const eyebrow: React.CSSProperties = {
  color: C.brown,
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "4px",
  textTransform: "uppercase",
};

const heading: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  color: C.green,
  fontSize: "clamp(34px, 5vw, 55px)",
  fontWeight: 500,
  lineHeight: 1.12,
  margin: "16px 0",
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [booking, setBooking] = useState(emptyBooking);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  // Load public menu from the existing NeonDB API
  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch("/api/menu", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load the restaurant menu.");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid menu response.");
        }

        setMenuItems(data as MenuItem[]);
      } catch (error) {
        setMenuError(
          error instanceof Error ? error.message : "Unable to load menu."
        );
      } finally {
        setMenuLoading(false);
      }
    }

    loadMenu();
  }, []);

  const categories = useMemo(() => {
    const values = menuItems
      .map((item) => item.category?.trim())
      .filter((value): value is string => Boolean(value));

    return ["All", ...Array.from(new Set(values))];
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        category === "All" || item.category === category;

      const term = search.toLowerCase();

      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term);

      return (
        matchesCategory &&
        matchesSearch &&
        item.available !== false
      );
    });
  }, [menuItems, category, search]);

  function navigate(tab: Tab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateBooking(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setBooking((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Reservation is submitted to a server-side API.
  // The API must validate the request and save it to NeonDB.
  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBookingLoading(true);
    setBookingError("");
    setBookingMessage("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(booking),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit your reservation."
        );
      }

      setBookingMessage(
        data.message || "Your reservation request has been received."
      );

      setBooking(emptyBooking);
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  function Footer() {
    return (
      <footer
        style={{
          background: C.dark,
          color: "#EDE5D7",
          padding: "55px 24px 25px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "35px",
          }}
        >
          <div>
            <h2
              style={{
                color: "#E3C48E",
                fontSize: "30px",
                letterSpacing: "6px",
              }}
            >
              ZAYVORA.
            </h2>
            <p style={{ color: "#C9C1B4", lineHeight: 1.8 }}>
              Good food. Beautiful moments. Discover a dining experience
              made to be remembered.
            </p>
          </div>

          <div>
            <h3 style={{ color: "#E3C48E", marginBottom: "15px" }}>
              Explore
            </h3>

            {(
              ["home", "menu", "about", "reservation", "contact"] as Tab[]
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => navigate(tab)}
                style={{
                  display: "block",
                  background: "none",
                  border: "none",
                  color: "#D7D0C4",
                  padding: "7px 0",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {tab === "menu" ? "Our Menu" : tab}
              </button>
            ))}
          </div>

          <div>
            <h3 style={{ color: "#E3C48E", marginBottom: "15px" }}>
              Visit Zayvora
            </h3>
            <p style={{ color: "#C9C1B4", lineHeight: 1.9 }}>
              Restaurant & Dining
              <br />
              Contact us for location and opening hours.
              <br />
              We look forward to welcoming you.
            </p>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "35px auto 0",
            borderTop: "1px solid #475047",
            paddingTop: "20px",
            textAlign: "center",
            color: "#AAA99F",
            fontSize: "12px",
          }}
        >
          © {new Date().getFullYear()} Zayvora Restaurant. All rights reserved.
        </div>
      </footer>
    );
  }

  function MenuCards({ limit }: { limit?: number }) {
    const displayed = limit
      ? filteredMenu.slice(0, limit)
      : filteredMenu;

    if (menuLoading) {
      return (
        <p style={{ textAlign: "center", padding: "40px", color: C.muted }}>
          Preparing our menu...
        </p>
      );
    }

    if (menuError) {
      return (
        <p style={{ textAlign: "center", padding: "35px", color: C.brown }}>
          {menuError}
        </p>
      );
    }

    if (displayed.length === 0) {
      return (
        <p style={{ textAlign: "center", padding: "35px", color: C.muted }}>
          No dishes found. Please check back soon.
        </p>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))",
          gap: "25px",
        }}
      >
        {displayed.map((item) => (
          <article
            key={item.id}
            style={{
              background: C.white,
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #EAE3D8",
              boxShadow: "0 8px 25px rgba(40,35,25,0.05)",
            }}
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "215px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  height: "215px",
                  background: "#EDE7DC",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "55px",
                }}
              >
                🍽️
              </div>
            )}

            <div style={{ padding: "20px" }}>
              <p style={{ ...eyebrow, letterSpacing: "2px" }}>
                {item.category || "Zayvora Special"}
              </p>

              <h3
                style={{
                  fontFamily: "Georgia,serif",
                  color: C.green,
                  fontSize: "23px",
                  margin: "10px 0",
                }}
              >
                {item.name}
              </h3>

              <p
                style={{
                  color: C.muted,
                  fontSize: "13px",
                  lineHeight: 1.7,
                  minHeight: "42px",
                }}
              >
                {item.description || "Freshly prepared with care."}
              </p>

              <div
                style={{
                  borderTop: "1px solid #E9E0D4",
                  marginTop: "17px",
                  paddingTop: "15px",
                  color: C.brown,
                  fontWeight: 800,
                }}
              >
                Rs. {Number(item.price).toLocaleString("en-PK")}
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <main
      style={{
        background: C.cream,
        color: C.dark,
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* MAIN NAVIGATION */}
      <header
        style={{
          background: C.white,
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "auto",
            padding: "15px 25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("home")}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "30px",
              letterSpacing: "5px",
              fontWeight: 900,
              color: C.brown,
            }}
          >
            ZAYVORA<span style={{ color: C.gold }}>.</span>
          </button>

          <nav
            aria-label="Main navigation"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {(
              [
                ["home", "Home"],
                ["menu", "Our Menu"],
                ["about", "About Us"],
                ["reservation", "Reservation"],
                ["contact", "Contact"],
              ] as [Tab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => navigate(tab)}
                style={{
                  border: "none",
                  background:
                    activeTab === tab ? "#F0E8DB" : "transparent",
                  color: activeTab === tab ? C.brown : C.green,
                  padding: "11px 13px",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                {label}
              </button>
            ))}

            <a
              href="/admin/login"
              style={{
                ...buttonPrimary,
                display: "inline-block",
                textDecoration: "none",
                fontSize: "13px",
                padding: "12px 20px",
              }}
            >
              Admin Portal
            </a>
          </nav>
        </div>
      </header>

      {/* HOME */}
      {activeTab === "home" && (
        <>
          <section
            style={{
              minHeight: "650px",
              display: "flex",
              alignItems: "center",
              backgroundImage:
                "linear-gradient(90deg,rgba(248,244,236,.97) 0%,rgba(248,244,236,.86) 45%,rgba(248,244,236,.08) 100%),url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=85')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                width: "100%",
                margin: "auto",
                padding: "85px 25px",
              }}
            >
              <p style={eyebrow}>GOOD FOOD · BEAUTIFUL MOMENTS</p>

              <h1
                style={{
                  fontFamily: "Georgia,serif",
                  fontSize: "clamp(48px,7vw,85px)",
                  lineHeight: 1.08,
                  color: C.dark,
                  maxWidth: "760px",
                  margin: "25px 0",
                }}
              >
                A taste beyond
                <br />
                <span style={{ color: C.brown }}>ordinary.</span>
              </h1>

              <p
                style={{
                  color: "#64594D",
                  fontSize: "18px",
                  lineHeight: 1.9,
                  maxWidth: "580px",
                }}
              >
                Welcome to Zayvora, where comforting favourites meet
                thoughtful preparation. Explore our menu and discover
                something made to delight.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginTop: "30px",
                }}
              >
                <button
                  onClick={() => navigate("menu")}
                  style={buttonPrimary}
                >
                  Explore the Menu →
                </button>

                <button
                  onClick={() => navigate("reservation")}
                  style={{
                    background: "transparent",
                    color: C.green,
                    border: "1px solid #B88B6A",
                    borderRadius: "40px",
                    padding: "15px 28px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reserve a Table
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "25px",
                  marginTop: "65px",
                  color: C.muted,
                  fontSize: "14px",
                }}
              >
                <span>✦ Freshly prepared</span>
                <span>✦ Made with care</span>
                <span>✦ Prices in PKR</span>
              </div>
            </div>
          </section>

          <section style={{ maxWidth: "1200px", margin: "auto", padding: "85px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <p style={eyebrow}>DISCOVER OUR FLAVOURS</p>
              <h2 style={heading}>A few of our favourites</h2>
              <p style={{ color: C.muted }}>
                Carefully prepared dishes, made to bring people together.
              </p>
            </div>

            <MenuCards limit={3} />

            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <button
                onClick={() => navigate("menu")}
                style={buttonPrimary}
              >
                View Full Menu →
              </button>
            </div>
          </section>

          <section
            style={{
              background: C.green,
              color: C.white,
              padding: "75px 24px",
              textAlign: "center",
            }}
          >
            <p style={{ ...eyebrow, color: C.gold }}>YOUR TABLE AWAITS</p>
            <h2
              style={{
                fontFamily: "Georgia,serif",
                fontSize: "clamp(34px,5vw,52px)",
                margin: "20px 0",
                fontWeight: 500,
              }}
            >
              Make room for something special.
            </h2>
            <p style={{ color: "#D8D8CD", marginBottom: "25px" }}>
              Join us for a memorable dining experience.
            </p>
            <button
              onClick={() => navigate("reservation")}
              style={{
                ...buttonPrimary,
                background: C.gold,
                color: C.dark,
              }}
            >
              Book Your Table
            </button>
          </section>
        </>
      )}

      {/* OUR MENU */}
      {activeTab === "menu" && (
        <section style={{ maxWidth: "1200px", margin: "auto", padding: "85px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "45px" }}>
            <p style={eyebrow}>MADE WITH PASSION</p>
            <h1 style={heading}>Our Menu</h1>
            <p style={{ color: C.muted }}>
              Explore our selection of freshly prepared favourites.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for your favourite dish..."
            style={{
              ...inputStyle,
              maxWidth: "450px",
              display: "block",
              margin: "0 auto 25px",
            }}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "40px",
            }}
          >
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "30px",
                  border: "1px solid #D6C9B8",
                  background: category === item ? C.green : "white",
                  color: category === item ? "white" : C.green,
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <MenuCards />
        </section>
      )}

      {/* ABOUT US */}
      {activeTab === "about" && (
        <>
          <section
            style={{
              maxWidth: "1200px",
              margin: "auto",
              padding: "85px 24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              alignItems: "center",
              gap: "50px",
            }}
          >
            <div>
              <p style={eyebrow}>THE ZAYVORA STORY</p>
              <h1 style={heading}>
                More than a meal.
                <br />
                A moment to remember.
              </h1>
              <p style={{ color: C.muted, lineHeight: 2 }}>
                At Zayvora, we believe good food brings people together.
                Our restaurant is a place to slow down, enjoy thoughtful
                preparation and share beautiful moments around the table.
              </p>
              <p style={{ color: C.muted, lineHeight: 2 }}>
                From comforting favourites to delightful flavours, we aim
                to make every visit feel special.
              </p>
              <button
                onClick={() => navigate("menu")}
                style={buttonPrimary}
              >
                Discover Our Menu
              </button>
            </div>

            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=85"
              alt="Elegant restaurant dining"
              style={{
                width: "100%",
                minHeight: "360px",
                maxHeight: "500px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
          </section>

          <section
            style={{
              background: "#EDE6DA",
              padding: "70px 24px",
              textAlign: "center",
            }}
          >
            <p style={eyebrow}>OUR PROMISE</p>
            <h2 style={heading}>Good food. Thoughtful hospitality.</h2>
            <p style={{ color: C.muted, lineHeight: 1.9 }}>
              Fresh preparation, welcoming service and memorable moments.
            </p>
          </section>
        </>
      )}

      {/* RESERVATION */}
      {activeTab === "reservation" && (
        <section style={{ maxWidth: "1200px", margin: "auto", padding: "85px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p style={eyebrow}>PLAN YOUR VISIT</p>
            <h1 style={heading}>Reserve Your Table</h1>
            <p style={{ color: C.muted, lineHeight: 1.8 }}>
              Tell us about your visit and send us a reservation request.
            </p>
          </div>

          <div
            style={{
              maxWidth: "760px",
              margin: "auto",
              background: C.white,
              padding: "clamp(20px,5vw,45px)",
              borderRadius: "14px",
              boxShadow: "0 10px 40px rgba(0,0,0,.06)",
              border: "1px solid #E8DFD1",
            }}
          >
            {bookingMessage && (
              <div
                role="status"
                style={{
                  padding: "15px",
                  background: "#E4F2E6",
                  color: "#245B31",
                  borderRadius: "7px",
                  marginBottom: "20px",
                }}
              >
                {bookingMessage}
              </div>
            )}

            {bookingError && (
              <div
                role="alert"
                style={{
                  padding: "15px",
                  background: "#FCE8E5",
                  color: "#9A3026",
                  borderRadius: "7px",
                  marginBottom: "20px",
                }}
              >
                {bookingError}
              </div>
            )}

            <form onSubmit={submitReservation}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: "20px",
                }}
              >
                <label>
                  <span style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }}>
                    Full Name *
                  </span>
                  <input
                    name="name"
                    value={booking.name}
                    onChange={updateBooking}
                    placeholder="Your full name"
                    required
                    maxLength={100}
                    autoComplete="name"
                    style={inputStyle}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }}>
                    Phone Number *
                  </span>
                  <input
                    name="phone"
                    value={booking.phone}
                    onChange={updateBooking}
                    placeholder="Your phone number"
                    required
                    maxLength={30}
                    autoComplete="tel"
                    style={inputStyle}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }}>
                    Email Address
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={booking.email}
                    onChange={updateBooking}
                    placeholder="Your email"
                    maxLength={150}
                    autoComplete="email"
                    style={inputStyle}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }}>
                    Number of Guests *
                  </span>
                  <select
                    name="guests"
                    value={booking.guests}
                    onChange={updateBooking}
                    required
                    style={inputStyle}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }}>
                    Reservation Date *
                  </span>
                  <input
                    type="date"
                    name="date"
                    value={booking.date}
                    onChange={updateBooking}
                    min={new Date().toLocaleDateString("en-CA")}
                    required
                    style={inputStyle}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }}>
                    Preferred Time *
                  </span>
                  <select
                    name="time"
                    value={booking.time}
                    onChange={updateBooking}
                    required
                    style={inputStyle}
                  >
                    <option value="">Select a time</option>
                    {[
                      "12:00", "12:30", "13:00", "13:30",
                      "14:00", "17:00", "17:30", "18:00",
                      "18:30", "19:00", "19:30", "20:00",
                      "20:30", "21:00",
                    ].map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: "block", marginTop: "20px" }}>
                <span style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }}>
                  Special Requests
                </span>
                <textarea
                  name="requests"
                  value={booking.requests}
                  onChange={updateBooking}
                  rows={4}
                  maxLength={1000}
                  placeholder="Any special requests or occasions?"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>

              <button
                type="submit"
                disabled={bookingLoading}
                style={{
                  ...buttonPrimary,
                  width: "100%",
                  marginTop: "25px",
                  opacity: bookingLoading ? 0.6 : 1,
                }}
              >
                {bookingLoading
                  ? "Submitting..."
                  : "Request Reservation →"}
              </button>

              <p
                style={{
                  textAlign: "center",
                  color: C.muted,
                  fontSize: "12px",
                  marginTop: "15px",
                  lineHeight: 1.7,
                }}
              >
                Your request is subject to confirmation by the restaurant.
                A submitted request does not guarantee a confirmed table.
              </p>
            </form>
          </div>
        </section>
      )}

      {/* CONTACT */}
      {activeTab === "contact" && (
        <section style={{ maxWidth: "1200px", margin: "auto", padding: "85px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "45px" }}>
            <p style={eyebrow}>WE WOULD LOVE TO HEAR FROM YOU</p>
            <h1 style={heading}>Get in Touch</h1>
            <p style={{ color: C.muted, lineHeight: 1.8 }}>
              Questions about our menu or planning a visit? Contact Zayvora.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                icon: "📍",
                title: "Our Location",
                description: "Contact us for restaurant address and directions.",
              },
              {
                icon: "☎",
                title: "Call Us",
                description: "Please use your restaurant contact number here.",
              },
              {
                icon: "✉",
                title: "Email Us",
                description: "Get in touch for enquiries and reservations.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: C.white,
                  border: "1px solid #E8DFD1",
                  borderRadius: "12px",
                  padding: "35px 25px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "35px" }}>{item.icon}</div>
                <h3
                  style={{
                    fontFamily: "Georgia,serif",
                    color: C.green,
                    fontSize: "24px",
                    margin: "15px 0",
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ color: C.muted, lineHeight: 1.8 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <button
              onClick={() => navigate("reservation")}
              style={buttonPrimary}
            >
              Make a Reservation
            </button>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

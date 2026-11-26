"use client";

import { useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import Image from "next/image";

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  image_url: string | null;
  available: boolean;
}

type Booking = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  requests: string;
};

const emptyBooking: Booking = {
  name: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  guests: "2",
  requests: "",
};

const categoryPhotos: Record<string, string> = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85",
  dessert: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85",
  drink: "https://images.unsplash.com/photo-1513558161293-cdaf765edfd4?auto=format&fit=crop&w=1000&q=85",
  pasta: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=85",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=85",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1000&q=85",
  default: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85",
};

function photoFor(item: Pick<MenuItem, "image_url" | "category" | "name">) {
  const image = item.image_url?.trim();
  if (image) {
    if (image.startsWith("//")) return `https:${image}`;
    if (/^images\.unsplash\.com\//i.test(image)) return `https://${image}`;
    if (/^https?:\/\//i.test(image)) return image;
  }

  const label = `${item.category ?? ""} ${item.name}`.toLowerCase();
  const match = Object.keys(categoryPhotos).find(
    (category) => category !== "default" && label.includes(category),
  );
  return categoryPhotos[match ?? "default"];
}

function DishPhoto({ item, className }: { item: MenuItem; className: string }) {
  const fallback = photoFor({ image_url: null, category: item.category, name: item.name });
  return (
    <Image
      fill
      className={className}
      src={photoFor(item)}
      alt={item.name}
      loading="lazy"
      unoptimized
      onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.fallbackApplied) {
          image.style.visibility = "hidden";
          return;
        }
        image.dataset.fallbackApplied = "true";
        image.src = fallback;
      }}
    />
  );
}

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [booking, setBooking] = useState(emptyBooking);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadMenu() {
      try {
        const response = await fetch("/api/menu", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load the menu right now.");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("The menu response was invalid.");
        if (active) setMenuItems(data as MenuItem[]);
      } catch (error) {
        if (active) {
          setMenuError(error instanceof Error ? error.message : "Unable to load the menu.");
        }
      } finally {
        if (active) setMenuLoading(false);
      }
    }
    loadMenu();
    return () => {
      active = false;
    };
  }, []);

  const availableItems = useMemo(
    () => menuItems.filter((item) => item.available !== false),
    [menuItems],
  );
  const categories = useMemo(() => {
    const values = availableItems
      .map((item) => item.category?.trim())
      .filter((value): value is string => Boolean(value));
    return ["All", ...Array.from(new Set(values))];
  }, [availableItems]);
  const filteredMenu = useMemo(() => {
    const term = search.trim().toLowerCase();
    return availableItems.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        (item.description ?? "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [availableItems, category, search]);

  function updateBooking(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setBooking((previous) => ({ ...previous, [name]: value }));
  }

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingLoading(true);
    setBookingError("");
    setBookingMessage("");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit your reservation.");
      setBookingMessage(data.message || "Your reservation request has been received.");
      setBooking(emptyBooking);
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : "Unable to submit your reservation.",
      );
    } finally {
      setBookingLoading(false);
    }
  }

  function menuCards(items: MenuItem[]) {
    if (menuLoading) return <p className="menu-state">Preparing our menu…</p>;
    if (menuError) return <p className="menu-state menu-state-error" role="alert">{menuError}</p>;
    if (!items.length) return <p className="menu-state">No dishes match your selection.</p>;

    return (
      <div className="dish-grid">
        {items.map((item) => (
          <article className="dish-card" key={item.id}>
            <div className="dish-image-wrap">
              <DishPhoto item={item} className="dish-image" />
              {item.category && <span className="dish-category">{item.category}</span>}
            </div>
            <div className="dish-content">
              <div className="dish-title-row">
                <h3>{item.name}</h3>
                <span className="dish-price">Rs. {Number(item.price).toLocaleString("en-PK")}</span>
              </div>
              <p>{item.description || "Freshly prepared with care, using thoughtfully selected ingredients."}</p>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#home" aria-label="Zayvora home">
            ZAYVORA<span>.</span>
            <small>RESTAURANT &amp; DINING</small>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#home">Home</a>
            <a href="#menu">Our Menu</a>
            <a href="#about">About Us</a>
            <a href="#reservation">Reservation</a>
            <a href="#contact">Contact</a>
            <a className="nav-admin" href="/admin/login">Admin Portal</a>
          </nav>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-shade" />
        <div className="hero-content page-width">
          <p className="eyebrow">A TABLE FOR EVERY OCCASION</p>
          <h1>Gather around<br /><em>something wonderful.</em></h1>
          <p className="hero-copy">
            A warm welcome, thoughtful cooking, and the kind of moments that stay with you.
            Make yourself at home at Zayvora.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#menu">Explore the menu <span>↗</span></a>
            <a className="button button-ghost" href="#reservation">Reserve a table</a>
          </div>
          <div className="hero-note"><span>✦</span> Made with care, served with warmth</div>
        </div>
        <div className="hero-caption">GOOD FOOD. GOOD Resturant.</div>
      </section>

      <section className="highlights page-width" aria-label="Restaurant highlights">
        <div><span className="highlight-icon">✳</span><strong>Thoughtfully prepared</strong><small>Fresh flavours, every day</small></div>
        <div><span className="highlight-icon">⌂</span><strong>A welcoming table</strong><small> for every occasion</small></div>
        <div><span className="highlight-icon">♡</span><strong>Made to be shared</strong><small>Good food brings us together</small></div>
      </section>

      <section className="section menu-section" id="menu">
        <div className="page-width">
          <div className="section-heading">
            <p className="eyebrow">FROM OUR KITCHEN</p>
            <h2>Made for <em>the moment.</em></h2>
            <p>Explore the dishes our guests come back for, freshly prepared and served with care.</p>
          </div>
          <div className="menu-tools">
            <div className="category-list" aria-label="Filter menu by category">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={category === item ? "category-button active" : "category-button"}
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="menu-search">
              <span className="visually-hidden">Search menu</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a favourite…"
              />
              <span aria-hidden="true">⌕</span>
            </label>
          </div>
          {menuCards(filteredMenu)}
          {!menuLoading && !menuError && filteredMenu.length > 0 && (
            <p className="menu-count">Showing {filteredMenu.length} available {filteredMenu.length === 1 ? "dish" : "dishes"}</p>
          )}
        </div>
      </section>

      <section className="story-section section" id="about">
        <div className="page-width story-grid">
          <div className="story-photo story-photo-main" role="img" aria-label="A beautifully set restaurant table" />
          <div className="story-copy">
            <p className="eyebrow">THE ZAYVORA STORY</p>
            <h2>A little more<br />than <em>a meal.</em></h2>
            <p>At Zayvora, we believe the best memories are made around the table. We bring together comforting favourites, considered ingredients, and the pleasure of slowing down over a meal.</p>
            <p>From the first welcome to the last bite, every detail is part of making your visit feel special. Come as you are; there’s always room for one more.</p>
            <a className="text-link" href="#reservation">Come spend a little time with us <span>→</span></a>
          </div>
          <div className="story-photo story-photo-detail" role="img" aria-label="Freshly prepared food served at Zayvora" />
        </div>
      </section>

      <section className="reservation-section section" id="reservation">
        <div className="page-width reservation-grid">
          <div className="reservation-intro">
            <p className="eyebrow">YOUR TABLE IS WAITING</p>
            <h2>Reserve your table for<br /><em>something lovely.</em></h2>
            <p>Tell us a little about your visit. Our team will be in touch to confirm your reservation.</p>
            <div className="reservation-detail"><span>✦</span><div><strong>Good Resturant starts here</strong><small>Plan a quiet dinner, a celebration, or just because.</small></div></div>
          </div>
          <form className="reservation-form" onSubmit={submitReservation}>
            <h3>Request a reservation</h3>
            {bookingMessage && <div role="status" className="form-message success">{bookingMessage}</div>}
            {bookingError && <div role="alert" className="form-message error">{bookingError}</div>}
            <div className="form-grid">
              <label>Full name<input name="name" value={booking.name} onChange={updateBooking} placeholder="Your name" autoComplete="name" maxLength={100} required /></label>
              <label>Email address<input name="email" type="email" value={booking.email} onChange={updateBooking} placeholder="you@example.com" autoComplete="email" maxLength={150} required /></label>
              <label>Phone number<input name="phone" type="tel" value={booking.phone} onChange={updateBooking} placeholder="Your phone number" autoComplete="tel" maxLength={30} required /></label>
              <label>Guests<select name="guests" value={booking.guests} onChange={updateBooking} required>{Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>)}</select></label>
              <label>Date<input name="date" type="date" value={booking.date} onChange={updateBooking} min={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())} required /></label>
              <label>Time<select name="time" value={booking.time} onChange={updateBooking} required><option value="">Choose a time</option>{["12:00", "12:30", "13:00", "13:30", "14:00", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "22:00", "23:00"].map((time) => <option value={time} key={time}>{time}</option>)}</select></label>
            </div>
            <label className="full-field">Special requests<textarea name="requests" value={booking.requests} onChange={updateBooking} rows={3} maxLength={1000} placeholder="Celebration, seating preferences, or anything we should know…" /></label>
            <button type="submit" className="button button-primary submit-button" disabled={bookingLoading}>
              {bookingLoading ? "Sending request…" : "Request a table"} <span>→</span>
            </button>
            <p className="form-footnote">We’ll confirm your request directly. A request is not a confirmed booking.</p>
          </form>
        </div>
      </section>

      <section className="contact-section section" id="contact">
        <div className="page-width">
          <div className="section-heading">
            <p className="eyebrow">COME ON IN</p>
            <h2>We’d love to <em>see you.</em></h2>
            <p>Questions, a special occasion, or simply finding your way here? We’re happy to help.</p>
          </div>
          <div className="contact-grid">
            <article className="contact-card"><span className="contact-mark">⌖</span><h3>Find us</h3><p>University Road<br />Sargodha</p></article>
            <article className="contact-card"><span className="contact-mark">◷</span><h3>Opening hours</h3><p>11:59 AM – 11:59 PM</p></article>
            <article className="contact-card"><span className="contact-mark">✉</span><h3>Say hello</h3><p><a href="tel:03499445524">0349 9445524</a><br /><a href="mailto:marijriazofficial@gmail.com">marijriazofficial@gmail.com</a></p></article>
          </div>
          <div className="contact-cta"><p>Save a seat for a good day.</p><a className="button button-primary" href="#reservation">Make a reservation <span>→</span></a></div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-width footer-inner">
          <a className="brand footer-brand" href="#home">ZAYVORA<span>.</span><small>RESTAURANT &amp; DINING</small></a>
          <p>Good food. Beautiful moments.</p>
          <a href="/admin/login">Admin Portal ↗</a>
          <small>© {new Date().getFullYear()} Zayvora Restaurant</small>
        </div>
      </footer>
    </main>
  );
}

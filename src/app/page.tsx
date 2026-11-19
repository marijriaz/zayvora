"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  image_url: string | null;
};

const emptyForm = { name: "", description: "", price: "", category: "", image_url: "" };

function formatPKR(value: number | string) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

// Default photos used when a dish has no image_url saved in Neon.
const foodImages = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=85",
  pizza: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=900&q=85",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&q=85",
  cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&q=85",
  fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900&q=85",
  chicken: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=900&q=85",
  default: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85",
};

function getDishImage(item: MenuItem) {
  if (item.image_url?.trim()) return item.image_url.trim();
  const text = `${item.name} ${item.category || ""}`.toLowerCase();
  if (text.includes("burger")) return foodImages.burger;
  if (text.includes("pizza")) return foodImages.pizza;
  if (text.includes("sandwich") || text.includes("sub")) return foodImages.sandwich;
  if (text.includes("cake") || text.includes("dessert") || text.includes("brownie")) return foodImages.cake;
  if (text.includes("fries") || text.includes("potato")) return foodImages.fries;
  if (text.includes("chicken")) return foodImages.chicken;
  return foodImages.default;
}

export default function Home() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [search, setSearch] = useState("");

  async function loadMenu() {
    try {
      const response = await fetch("/api/menu", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the menu.");
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load menu.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const image_url = form.image_url.trim();
    const price = Number(form.price);

    if (!name || !Number.isFinite(price) || price <= 0) {
      setMessage("Enter a dish name and a price greater than zero.");
      setMessageType("error");
      return;
    }

    const duplicate = items.some(
      (item) =>
        item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase() &&
        item.id !== editingId
    );

    if (duplicate) {
      setMessage("This dish is already on the menu. Please choose a unique name.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        editingId ? `/api/menu/${editingId}` : "/api/menu",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          // Keep this payload aligned with the confirmed database columns:
          // name, price, description.
          body: JSON.stringify({ name, price, description, category, image_url }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this dish.");

      setMessage(editingId ? "Dish updated successfully." : "Dish added successfully.");
      setMessageType("success");
      setForm(emptyForm);
      setEditingId(null);
      await loadMenu();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: item.category || "",
      image_url: item.image_url || "",
    });
    setMessage("Editing this dish. Make your changes and save.");
    setMessageType("info");
    document.getElementById("manage-menu")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this dish?")) return;

    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete this dish.");

      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      setMessage("Dish deleted successfully.");
      setMessageType("success");
      await loadMenu();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
      setMessageType("error");
    } finally {
      setDeletingId(null);
    }
  }

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...items]
      .filter((item) =>
        !query ||
        item.name.toLocaleLowerCase().includes(query) ||
        (item.description || "").toLocaleLowerCase().includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search]);

  return (
    <main className="min-h-screen bg-[#fffaf1] text-[#49382d]">
      <header className="sticky top-0 z-30 border-b border-[#eee1ce] bg-[#fffaf1]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10">
          <a href="#home" className="text-2xl font-black tracking-[0.18em] text-[#a85e40]">
            ZAYVORA<span className="text-[#d4a85d]">.</span>
          </a>
          <div className="flex items-center gap-4 text-sm font-semibold text-[#806c5b] md:gap-8">
            <a href="#home" className="hover:text-[#a85e40]">Home</a>
            <a href="#menu" className="hover:text-[#a85e40]">Our Menu</a>
            <a href="#story" className="hover:text-[#a85e40]">About Us</a>
            <a href="#contact" className="hidden hover:text-[#a85e40] sm:inline">Contact</a>
            <a href="#manage-menu" className="rounded-full bg-[#a85e40] px-4 py-2.5 text-white shadow-sm transition hover:bg-[#874a32]">Manage Menu</a>
          </div>
        </nav>
      </header>

      <section
        id="home"
        className="relative isolate flex min-h-[500px] items-center overflow-hidden bg-[#ead8bf] px-5 py-20"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,250,241,.96) 0%, rgba(255,250,241,.88) 48%, rgba(255,250,241,.22) 100%), url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1800&q=85')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-extrabold tracking-[0.32em] text-[#a85e40] md:text-sm">
              GOOD FOOD · BEAUTIFUL MOMENTS
            </p>
            <h1 className="text-5xl font-black leading-[1.08] text-[#49382d] md:text-7xl">
              A taste beyond <span className="text-[#b8734f]">ordinary.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#776454] md:text-lg">
              Welcome to Zayvora, where comforting favourites meet thoughtful preparation.
              Explore our menu and discover something made to delight.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#menu" className="rounded-full bg-[#a85e40] px-8 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#874a32]">
                Explore the Menu
              </a>
              <a href="#manage-menu" className="rounded-full border border-[#cda98b] bg-white/80 px-8 py-3.5 font-bold text-[#80563f] transition hover:bg-white">
                Add a Dish
              </a>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-9 gap-y-4 text-sm text-[#806c5b]">
              <span>✦ Freshly prepared</span>
              <span>✦ Made with care</span>
              <span>✦ Prices in PKR</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-9 sm:grid-cols-3 md:px-10">
        <div className="rounded-2xl border border-[#eee1ce] bg-white p-5 text-center shadow-sm">
          <p className="text-3xl">🍽️</p>
          <p className="mt-2 text-2xl font-black text-[#a85e40]">{items.length}</p>
          <p className="text-sm text-[#806c5b]">Menu items</p>
        </div>
        <div className="rounded-2xl border border-[#eee1ce] bg-white p-5 text-center shadow-sm">
          <p className="text-3xl">🥘</p>
          <p className="mt-2 text-lg font-extrabold text-[#a85e40]">Fresh flavours</p>
          <p className="text-sm text-[#806c5b]">Prepared with care</p>
        </div>
        <div className="rounded-2xl border border-[#eee1ce] bg-white p-5 text-center shadow-sm">
          <p className="text-3xl">₨</p>
          <p className="mt-2 text-lg font-extrabold text-[#a85e40]">PKR only</p>
          <p className="text-sm text-[#806c5b]">One clear currency</p>
        </div>
      </section>

      <section id="manage-menu" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-14 md:py-20">
        <div className="mb-9 text-center">
          <p className="text-xs font-extrabold tracking-[0.3em] text-[#a85e40]">RESTAURANT MENU</p>
          <h2 className="mt-3 text-3xl font-black text-[#49382d] md:text-4xl">
            {editingId ? "Update your dish" : "Add a new dish"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#806c5b]">
            Add or update dishes here. Your dish name, description and price are saved in your Neon database.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[28px] border border-[#eee1ce] bg-white p-6 shadow-[0_18px_55px_rgba(116,78,46,.09)] md:p-9">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="dish-name" className="mb-2 block text-sm font-bold text-[#634b3b]">Dish name</label>
              <input
                id="dish-name"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Zayvora Royal Burger"
                className="w-full rounded-xl border border-[#e6d8c6] bg-[#fffdf9] px-4 py-3.5 outline-none transition placeholder:text-[#b9a999] focus:border-[#bd805e] focus:ring-4 focus:ring-[#bd805e]/10"
              />
            </div>
            <div>
              <label htmlFor="dish-price" className="mb-2 block text-sm font-bold text-[#634b3b]">Price</label>
              <div className="flex overflow-hidden rounded-xl border border-[#e6d8c6] bg-[#fffdf9] focus-within:border-[#bd805e] focus-within:ring-4 focus-within:ring-[#bd805e]/10">
                <span className="flex items-center border-r border-[#e6d8c6] bg-[#f7efe4] px-4 text-sm font-bold text-[#986448]">PKR</span>
                <input
                  id="dish-price"
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="850"
                  className="w-full bg-transparent px-4 py-3.5 outline-none placeholder:text-[#b9a999]"
                />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <label htmlFor="dish-description" className="mb-2 block text-sm font-bold text-[#634b3b]">Dish description</label>
            <textarea
              id="dish-description"
              rows={4}
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the ingredients, flavour and what makes this dish special..."
              className="w-full rounded-xl border border-[#e6d8c6] bg-[#fffdf9] px-4 py-3.5 outline-none transition placeholder:text-[#b9a999] focus:border-[#bd805e] focus:ring-4 focus:ring-[#bd805e]/10"
            />
            <p className="mt-1 text-right text-xs text-[#a18d7a]">{form.description.length}/500</p>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="dish-category" className="mb-2 block text-sm font-bold text-[#634b3b]">Category</label>
              <input id="dish-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Burgers, Pizza, Desserts..." className="w-full rounded-xl border border-[#e6d8c6] bg-[#fffdf9] px-4 py-3.5 outline-none focus:border-[#bd805e]" />
            </div>
            <div>
              <label htmlFor="dish-image" className="mb-2 block text-sm font-bold text-[#634b3b]">Dish image URL</label>
              <input id="dish-image" type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://.../your-dish-photo.jpg" className="w-full rounded-xl border border-[#e6d8c6] bg-[#fffdf9] px-4 py-3.5 outline-none focus:border-[#bd805e]" />
              <p className="mt-1 text-xs text-[#a18d7a]">Use a direct photo URL that matches this dish.</p>
            </div>
          </div>
          {form.image_url && <div className="mt-4 overflow-hidden rounded-2xl border border-[#eee1ce] bg-[#faf4eb] p-3"><p className="mb-2 text-xs font-bold text-[#806c5b]">IMAGE PREVIEW</p><img src={form.image_url} alt="Dish preview" className="h-40 w-full rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /></div>}
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="rounded-full bg-[#a85e40] px-8 py-3.5 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#874a32] disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : editingId ? "Save Changes" : "+ Add Dish"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setMessage(""); }} className="rounded-full border border-[#ddcbb7] px-7 py-3.5 font-bold text-[#80634d] transition hover:bg-[#faf3e9]">
                Cancel
              </button>
            )}
          </div>
          {message && (
            <p role="status" className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${
              messageType === "success" ? "bg-[#edf6eb] text-[#376640]" :
              messageType === "error" ? "bg-[#fff0eb] text-[#a34332]" :
              "bg-[#f8f1e6] text-[#80613d]"
            }`}>{message}</p>
          )}
          <p className="mt-4 text-xs leading-5 text-[#a18d7a]">
            Prices are entered and displayed in Pakistani Rupees (PKR). Duplicate dish names are not allowed.
          </p>
        </form>
      </section>

      <section id="menu" className="bg-[#f6eee2] px-5 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-extrabold tracking-[0.3em] text-[#a85e40]">MADE FOR YOUR CRAVINGS</p>
            <h2 className="mt-3 text-3xl font-black text-[#49382d] md:text-5xl">Explore Our Menu</h2>
            <p className="mt-3 text-[#806c5b]">Find your next favourite from the Zayvora kitchen.</p>
          </div>
          <div className="mx-auto mb-9 max-w-xl">
            <input
              aria-label="Search menu"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes by name or description..."
              className="w-full rounded-full border border-[#e4d5c1] bg-white px-6 py-3.5 text-[#49382d] shadow-sm outline-none placeholder:text-[#b9a999] focus:border-[#bd805e] focus:ring-4 focus:ring-[#bd805e]/10"
            />
          </div>

          {loading ? (
            <p className="py-14 text-center text-[#806c5b]">Loading our menu...</p>
          ) : visibleItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d9c4aa] bg-white/80 px-6 py-16 text-center">
              <div className="text-5xl">🍽️</div>
              <p className="mt-4 text-lg font-bold text-[#634b3b]">{search ? "No matching dishes found." : "Our menu is waiting for its first dish."}</p>
              <p className="mt-2 text-sm text-[#8b7765]">{search ? "Try another search." : "Use the form above to add your first dish."}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item, index) => (
                <article key={item.id} className="group overflow-hidden rounded-[26px] border border-[#eadcc9] bg-white shadow-[0_12px_35px_rgba(100,67,39,.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(100,67,39,.13)]">
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#f4e5d0] via-[#fbf3e8] to-[#ead5bc]">
                    <img
                      src={getDishImage(item)}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "https://placehold.co/900x600/f6eee2/806c5b?text=Zayvora+Food";
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#b47755]">{item.category || "Zayvora Special"}</div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-extrabold text-[#49382d]">{item.name}</h3>
                      <span className="shrink-0 rounded-full bg-[#f8eddd] px-3 py-1.5 text-sm font-extrabold text-[#9a573b]">{formatPKR(item.price)}</span>
                    </div>
                    <p className="mt-3 min-h-14 text-sm leading-6 text-[#806c5b]">
                      {item.description || "Prepared fresh with care by the Zayvora kitchen."}
                    </p>
                    <div className="mt-6 flex gap-3 border-t border-[#f0e7db] pt-4">
                      <button type="button" onClick={() => handleEdit(item)} className="flex-1 rounded-full bg-[#f5ecdf] py-2.5 text-sm font-bold text-[#855035] transition hover:bg-[#ead9c3]">Edit</button>
                      <button type="button" disabled={deletingId === item.id} onClick={() => handleDelete(item.id)} className="flex-1 rounded-full border border-[#e8c9bd] py-2.5 text-sm font-bold text-[#a34e3d] transition hover:bg-[#fff0eb] disabled:opacity-50">
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="story" className="scroll-mt-24 bg-[#fffaf1] px-5 py-16 text-center md:py-20">
        <p className="text-xs font-extrabold tracking-[0.3em] text-[#a85e40]">A LITTLE ABOUT US</p>
        <h2 className="mt-3 text-3xl font-black text-[#49382d] md:text-4xl">More Than Just a Meal</h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#806c5b]">
          At Zayvora, we believe food brings people together. Our menu celebrates satisfying flavours,
          thoughtful preparation and the simple joy of sharing a delicious meal. Whether you are choosing
          a familiar favourite or trying something new, we want every visit to feel welcoming.
        </p>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[#806c5b]">Our aim is to make choosing a meal simple and enjoyable. Browse the dishes, check clear prices in Pakistani Rupees, and explore descriptions before deciding what you would like to try. Our menu is updated as dishes are added, edited or removed.</p>
        <div className="mx-auto mt-9 grid max-w-4xl gap-4 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-[#eee1ce] bg-white p-5"><span className="text-2xl">🌿</span><h3 className="mt-3 font-bold">Thoughtful ingredients</h3><p className="mt-2 text-sm leading-6 text-[#806c5b]">Every dish is presented with care and attention to flavour.</p></div>
          <div className="rounded-2xl border border-[#eee1ce] bg-white p-5"><span className="text-2xl">👩‍🍳</span><h3 className="mt-3 font-bold">Made with care</h3><p className="mt-2 text-sm leading-6 text-[#806c5b]">We aim to make every menu choice feel special.</p></div>
          <div className="rounded-2xl border border-[#eee1ce] bg-white p-5"><span className="text-2xl">❤️</span><h3 className="mt-3 font-bold">Warm hospitality</h3><p className="mt-2 text-sm leading-6 text-[#806c5b]">Good food is even better when it is shared.</p></div>
        </div>
      </section>

      <footer id="contact" className="scroll-mt-24 bg-[#efe2d0] px-5 py-10 text-center">
        <p className="text-2xl font-black tracking-[0.18em] text-[#9a4f32]">ZAYVORA</p>
        <p className="mt-2 text-sm text-[#806c5b]">A Taste Beyond Ordinary.</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#806c5b]">Explore our menu, discover your favourites and enjoy a warm, welcoming food experience. All listed prices are in Pakistani Rupees (PKR).</p>
        <div className="mt-5 flex justify-center gap-6 text-sm font-semibold text-[#806c5b]">
          <a href="#home" className="hover:text-[#a85e40]">Home</a>
          <a href="#menu" className="hover:text-[#a85e40]">Menu</a>
          <a href="#manage-menu" className="hover:text-[#a85e40]">Manage Menu</a>
        </div>
        <p className="mt-6 text-xs text-[#9b8978]">© 2026 Zayvora Restaurant. All rights reserved.</p>
      </footer>
    </main>
  );
}

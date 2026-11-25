"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  image_url: string | null;
  available: boolean;
}

interface Props {
  username: string;
}

interface DishForm {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  available: boolean;
}

const emptyForm: DishForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image_url: "",
  available: true,
};

const defaultPhoto =
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85";

function imageSource(url: string | null) {
  if (!url?.trim()) return defaultPhoto;
  const value = url.trim();
  if (value.startsWith("//")) return `https:${value}`;
  if (/^images\.unsplash\.com\//i.test(value)) return `https://${value}`;
  return value;
}

export default function AdminDashboard({ username }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState<DishForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchMenu(showLoading = true) {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/menu", { cache: "no-store" });
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data === "object" && data !== null && "error" in data
            ? String(data.error)
            : "Failed to load menu items.",
        );
      }
      if (!Array.isArray(data)) throw new Error("Invalid menu response.");
      setItems(data as MenuItem[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load menu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchMenu(false);
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(editingId ? `/api/menu/${editingId}` : "/api/menu", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          category: form.category.trim(),
          image_url: form.image_url.trim(),
          available: form.available,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save dish.");
      setMessage(editingId ? "Dish updated successfully." : "Dish added successfully.");
      setEditingId(null);
      setForm(emptyForm);
      await fetchMenu(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save dish.");
    } finally {
      setSaving(false);
    }
  }

  function editDish(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category: item.category ?? "",
      image_url: item.image_url ?? "",
      available: item.available,
    });
    setMessage("");
    setError("");
    document.getElementById("dish-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function deleteDish(id: number) {
    if (!window.confirm("Delete this dish from the menu?")) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete dish.");
      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
      setMessage("Dish deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete dish.");
    }
  }

  async function toggleAvailability(item: MenuItem) {
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/menu/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: item.id, available: !item.available }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update availability.");
      setItems((current) =>
        current.map((dish) =>
          dish.id === item.id ? { ...dish, available: !item.available } : dish,
        ),
      );
      setMessage(`${item.name} is now ${item.available ? "unavailable" : "available"}.`);
    } catch (availabilityError) {
      setError(
        availabilityError instanceof Error
          ? availabilityError.message
          : "Unable to update availability.",
      );
    }
  }

  async function logout() {
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Logout failed. Please try again.");
      router.replace("/admin/login");
      router.refresh();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to logout.");
    }
  }

  const categories = useMemo(
    () => ["All", ...new Set(items.map((item) => item.category?.trim()).filter((value): value is string => Boolean(value)))],
    [items],
  );
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        (item.description ?? "").toLowerCase().includes(term) ||
        (item.category ?? "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [items, search, category]);
  const availableCount = items.filter((item) => item.available).length;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link className="brand" href="/">ZAYVORA<span>.</span><small>RESTAURANT MANAGEMENT</small></Link>
        <div className="admin-user">
          <span><small>Signed in as</small><strong>{username}</strong></span>
          <Link className="admin-site-link" href="/">View website ↗</Link>
          <button type="button" className="admin-logout" onClick={logout}>Log out</button>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-page-heading">
          <div><p className="eyebrow">YOUR RESTAURANT, AT A GLANCE</p><h1>Menu management</h1><p>Keep your menu fresh, accurate, and ready to welcome guests.</p></div>
          <a href="#dish-form" className="button button-primary">＋ Add a dish</a>
        </div>

        {message && <div role="status" className="admin-alert success">{message}</div>}
        {error && <div role="alert" className="admin-alert error">{error}</div>}

        <section className="admin-stats" aria-label="Menu summary">
          <article className="stat-card"><span className="stat-mark">◎</span><small>Total dishes</small><strong>{items.length}</strong><span>On your restaurant menu</span></article>
          <article className="stat-card"><span className="stat-mark">✦</span><small>Available</small><strong>{availableCount}</strong><span>Ready to be ordered</span></article>
          <article className="stat-card"><span className="stat-mark">◌</span><small>Unavailable</small><strong>{items.length - availableCount}</strong><span>Temporarily off the menu</span></article>
        </section>

        <section className="admin-panel" id="dish-form">
          <div className="admin-panel-heading">
            <div><p className="eyebrow">{editingId ? "MAKE AN UPDATE" : "GROW YOUR MENU"}</p><h2>{editingId ? "Edit dish" : "Add a new dish"}</h2></div>
            {editingId && <button type="button" className="admin-cancel" onClick={cancelEdit}>Cancel editing</button>}
          </div>
          <form className="dish-form" onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <label>Dish name<input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Truffle mushroom pasta" maxLength={150} required /></label>
              <label>Price (PKR)<input name="price" type="number" value={form.price} onChange={handleChange} min="0.01" step="0.01" placeholder="0.00" required /></label>
              <label>Category<input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Pasta, Dessert" maxLength={100} /></label>
              <label>Food image URL<input name="image_url" type="url" value={form.image_url} onChange={handleChange} placeholder="https://…" /></label>
            </div>
            <label>Description<textarea name="description" value={form.description} onChange={handleChange} rows={3} maxLength={2000} placeholder="Describe the flavours and ingredients…" /></label>
            <div className="form-bottom-row">
              <label className="availability-check"><input type="checkbox" checked={form.available} onChange={(event) => setForm((previous) => ({ ...previous, available: event.target.checked }))} /><span>Available to order</span></label>
              <button type="submit" className="button button-primary" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes →" : "Add dish →"}</button>
            </div>
            <div className="image-preview-row">
              <Image width={67} height={55} src={imageSource(form.image_url || null)} alt="Dish image preview" unoptimized onError={(event) => { if (!event.currentTarget.dataset.fallbackApplied) { event.currentTarget.dataset.fallbackApplied = "true"; event.currentTarget.src = defaultPhoto; } else { event.currentTarget.style.visibility = "hidden"; } }} />
              <span><strong>Image preview</strong><small>Use a direct link to a food photograph.</small></span>
            </div>
          </form>
        </section>

        <section className="admin-panel menu-management">
          <div className="admin-panel-heading menu-list-heading">
            <div><p className="eyebrow">THE CURRENT SELECTION</p><h2>Your dishes <span>{items.length}</span></h2></div>
            <label className="admin-search"><span className="visually-hidden">Search dishes</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dishes…" /><span>⌕</span></label>
          </div>
          <div className="admin-category-list">
            {categories.map((item) => <button type="button" key={item} className={category === item ? "category-button active" : "category-button"} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}
          </div>
          {loading ? <p className="menu-state">Loading your dishes…</p> : visibleItems.length === 0 ? <p className="menu-state">No dishes found. Add one above to get started.</p> : (
            <div className="admin-dish-list">
              {visibleItems.map((item) => (
                <article className="admin-dish-card" key={item.id}>
                  <Image className="admin-dish-photo" width={92} height={78} src={imageSource(item.image_url)} alt={item.name} unoptimized onError={(event) => { if (!event.currentTarget.dataset.fallbackApplied) { event.currentTarget.dataset.fallbackApplied = "true"; event.currentTarget.src = defaultPhoto; } else { event.currentTarget.style.visibility = "hidden"; } }} />
                  <div className="admin-dish-info"><div className="admin-dish-title"><h3>{item.name}</h3><span className={item.available ? "availability-pill is-available" : "availability-pill is-unavailable"}>{item.available ? "Available" : "Unavailable"}</span></div><p>{item.description || "No description added yet."}</p><div className="admin-dish-meta"><span>{item.category || "Uncategorized"}</span><strong>Rs. {Number(item.price).toLocaleString("en-PK")}</strong></div></div>
                  <div className="admin-dish-actions">
                    <button type="button" className="action-button" onClick={() => void toggleAvailability(item)}>{item.available ? "Mark unavailable" : "Make available"}</button>
                    <button type="button" className="action-button" onClick={() => editDish(item)}>Edit</button>
                    <button type="button" className="action-button danger" onClick={() => void deleteDish(item.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <footer className="admin-footer">Zayvora Restaurant · Menu management</footer>
      </div>
    </main>
  );
}

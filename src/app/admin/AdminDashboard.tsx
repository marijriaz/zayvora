
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  available: boolean;
}

interface Props {
  username: string;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image_url: "",
};

export default function AdminDashboard({ username }: Props) {
  const router = useRouter();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch menu items
  async function fetchMenu() {
    try {
      setError("");

      const response = await fetch("/api/menu", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to load menu items.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid menu response.");
      }

      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load menu."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMenu();
  }, []);

  // Update form fields
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Add or update dish
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        image_url: form.image_url.trim(),
      };

      const url = editingId
        ? `/api/menu/${editingId}`
        : "/api/menu";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

        <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
        >
        Logout
        </button>


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save dish.");
      }

      setMessage(
        editingId
          ? "Dish updated successfully!"
          : "New dish added successfully!"
      );

      setForm(emptyForm);
      setEditingId(null);

      await fetchMenu();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  // Load dish for editing
  function handleEdit(item: MenuItem) {
    setEditingId(item.id);

    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: item.category || "",
      image_url: item.image_url || "",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Cancel editing
  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
  }

  // Delete dish
  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this dish?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete dish.");
      }

      setMessage("Dish deleted successfully!");

      if (editingId === id) {
        cancelEdit();
      }

      await fetchMenu();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Delete failed."
      );
    }
  }

  // Change availability
  async function toggleAvailability(item: MenuItem) {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/menu/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          id: item.id,
          available: !item.available,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to change availability.");
      }

      setMessage("Availability updated successfully!");

      await fetchMenu();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Availability update failed."
      );
    }
  }

  // Logout
  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to logout?");

    if (!confirmed) return;

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Unable to logout. Please try again.");
    }
  }

  // Search menu
  const filteredItems = items.filter((item) => {
    const term = search.toLowerCase();

    return (
      item.name.toLowerCase().includes(term) ||
      (item.category || "").toLowerCase().includes(term)
    );
  });

  const availableCount = items.filter(
    (item) => item.available
  ).length;

  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-[#173c2d] px-5 py-5 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold tracking-wider">
              ZAYVORA
            </h1>

            <p className="mt-1 text-xs tracking-widest text-gray-300">
              RESTAURANT ADMIN PANEL
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-gray-300">Logged in as</p>
              <p className="font-semibold">{username}</p>
            </div>
          </div>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Page Heading */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Menu Management
          </h2>

          <p className="mt-2 text-gray-500">
            Add, edit, delete and manage your restaurant dishes.
          </p>
        </div>

        {/* Notifications */}
        {message && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Dishes</p>
            <h3 className="mt-2 text-3xl font-bold text-gray-800">
              {items.length}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Available Dishes</p>
            <h3 className="mt-2 text-3xl font-bold text-green-600">
              {availableCount}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Unavailable Dishes</p>
            <h3 className="mt-2 text-3xl font-bold text-red-500">
              {items.length - availableCount}
            </h3>
          </div>

        </div>

        {/* Add / Edit Form */}
        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-gray-800">
              {editingId ? "Edit Dish" : "Add New Dish"}
            </h3>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                Cancel Editing
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Dish Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter dish name"
                  required
                  maxLength={150}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-[#173c2d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Price (PKR) *
                </label>

                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-[#173c2d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Category
                </label>

                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Pizza, Burger, Drinks"
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-[#173c2d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Image URL
                </label>

                <input
                  name="image_url"
                  type="url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-[#173c2d]"
                />
              </div>

            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                maxLength={2000}
                placeholder="Describe your dish..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-[#173c2d]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#173c2d] px-7 py-3 font-semibold text-white transition hover:bg-[#24543f] disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Dish"
                : "Add Dish"}
            </button>

          </form>
        </section>

        {/* Menu List */}
        <section className="rounded-xl bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <h3 className="text-xl font-bold text-gray-800">
              Existing Menu Items
            </h3>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none focus:border-[#173c2d] sm:w-64"
            />

          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">
              Loading menu items...
            </p>
          ) : filteredItems.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No menu items found.
            </p>
          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[750px] text-left">

                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                      Dish
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                      Category
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                      Price
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                      Availability
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredItems.map((item) => (

                    <tr key={item.id} className="border-b hover:bg-gray-50">

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">

                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                              🍽️
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-gray-800">
                              {item.name}
                            </p>

                            <p className="max-w-xs truncate text-xs text-gray-500">
                              {item.description || "No description"}
                            </p>
                          </div>

                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {item.category || "-"}
                      </td>

                      <td className="px-4 py-4 font-semibold text-gray-800">
                        Rs. {Number(item.price).toLocaleString("en-PK")}
                      </td>

                      <td className="px-4 py-4">

                        <button
                          type="button"
                          onClick={() => toggleAvailability(item)}
                          aria-label={`Change availability for ${item.name}`}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            item.available
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.available ? "Available" : "Unavailable"}
                        </button>

                      </td>

                      <td className="px-4 py-4">

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-md bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-md bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Zayvora Restaurant Admin Panel
        </footer>

      </div>

    </main>
  );
}

async function handleLogout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Logout failed.");
    }

    window.location.href = "/admin/login";
  } catch {
    alert("Unable to logout. Please try again.");
  }
}

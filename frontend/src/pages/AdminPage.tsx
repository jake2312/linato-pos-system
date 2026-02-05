import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import { formatPhp } from "../utils/format";
import type { Category, DiningTable, Product } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useConfirm } from "../providers/ConfirmProvider";
import { useToast } from "../providers/ToastProvider";

const tabs = [
  "Products",
  "Categories",
  "Tables",
  "Users",
  "Inventory",
  "Reports",
  "Settings",
] as const;

export function AdminPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Products");

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="heading text-2xl">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">
          Manage catalog, users, and reports.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <Button
              key={item}
              tone={tab === item ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTab(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </Card>

      {tab === "Products" && <ProductsSection />}
      {tab === "Categories" && <CategoriesSection />}
      {tab === "Tables" && <TablesSection />}
      {tab === "Users" && <UsersSection />}
      {tab === "Inventory" && <InventorySection />}
      {tab === "Reports" && <ReportsSection />}
      {tab === "Settings" && <SettingsSection />}
    </div>
  );
}

function CategoriesSection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await api.get<{ data: Category[] }>("/categories?all=1");
      return response.data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return api.patch(`/categories/${editing.id}`, { name });
      }
      return api.post("/categories", { name, is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setName("");
      setEditing(null);
      toast.success("Category saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  const handleDelete = async (category: Category) => {
    const ok = await confirm({
      title: "Delete category?",
      description: `This will remove ${category.name}.`,
      confirmText: "Delete",
      tone: "danger",
      requireTextConfirm: "DELETE",
    });
    if (!ok) return;
    await deleteMutation.mutateAsync(category.id);
    toast.success("Category deleted");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <h2 className="heading text-lg">Category Editor</h2>
        <div className="mt-3 space-y-3">
          <Input
            label="Category name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button onClick={() => saveMutation.mutate()}>
            {editing ? "Update" : "Create"}
          </Button>
        </div>
      </Card>
      <Card>
        <h2 className="heading text-lg">Categories</h2>
        <div className="mt-3 space-y-2">
          {categories?.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
            >
              <span>{category.name}</span>
              <div className="flex gap-2">
                <Button
                  tone="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(category);
                    setName(category.name);
                  }}
                >
                  Edit
                </Button>
                <Button
                  tone="danger"
                  size="sm"
                  onClick={() => handleDelete(category)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {!categories?.length && (
            <p className="text-sm text-slate-500">No categories yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function ProductsSection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category_id: "",
    price: "",
    cost: "",
  });
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await api.get<{ data: Category[] }>("/categories?all=1");
      return response.data.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const response = await api.get<{ data: Product[] }>("/products?all=1");
      return response.data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        sku: form.sku,
        category_id: Number(form.category_id),
        price: Number(form.price),
        cost: Number(form.cost || 0),
        is_active: true,
      };
      if (editing) {
        return api.patch(`/products/${editing.id}`, payload);
      }
      return api.post("/products", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEditing(null);
      setForm({ name: "", sku: "", category_id: "", price: "", cost: "" });
      toast.success("Product saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/products/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const handleDelete = async (product: Product) => {
    const ok = await confirm({
      title: "Delete product?",
      description: `This will remove ${product.name}.`,
      confirmText: "Delete",
      tone: "danger",
      requireTextConfirm: "DELETE",
    });
    if (!ok) return;
    await deleteMutation.mutateAsync(product.id);
    toast.success("Product deleted");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <h2 className="heading text-lg">Product Editor</h2>
        <div className="mt-3 space-y-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <Input
            label="SKU"
            value={form.sku}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, sku: event.target.value }))
            }
          />
          <label className="text-xs font-semibold uppercase text-slate-500">
            Category
            <select
              className="mt-1 w-full rounded-xl border-slate-200 text-sm"
              value={form.category_id}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  category_id: event.target.value,
                }))
              }
            >
              <option value="">Select category</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Price"
              type="number"
              value={form.price}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, price: event.target.value }))
              }
            />
            <Input
              label="Cost"
              type="number"
              value={form.cost}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cost: event.target.value }))
              }
            />
          </div>
          <Button onClick={() => saveMutation.mutate()}>
            {editing ? "Update" : "Create"}
          </Button>
        </div>
      </Card>
      <Card>
        <h2 className="heading text-lg">Products</h2>
        <div className="mt-3 space-y-2">
          {products?.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-slate-500">{product.sku}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="info">{formatPhp(Number(product.price))}</Badge>
                <Button
                  tone="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(product);
                    setForm({
                      name: product.name,
                      sku: product.sku,
                      category_id: String(product.category_id),
                      price: String(product.price),
                      cost: String(product.cost),
                    });
                  }}
                >
                  Edit
                </Button>
                <Button tone="danger" size="sm" onClick={() => handleDelete(product)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {!products?.length && (
            <p className="text-sm text-slate-500">No products yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function TablesSection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [form, setForm] = useState({ name: "", capacity: "2" });
  const [editing, setEditing] = useState<DiningTable | null>(null);

  const { data: tables } = useQuery({
    queryKey: ["admin-tables"],
    queryFn: async () => {
      const response = await api.get<{ data: DiningTable[] }>("/tables?all=1");
      return response.data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        capacity: Number(form.capacity),
        status: "available",
      };
      if (editing) {
        return api.patch(`/tables/${editing.id}`, payload);
      }
      return api.post("/tables", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tables"] });
      setEditing(null);
      setForm({ name: "", capacity: "2" });
      toast.success("Table saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/tables/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-tables"] }),
  });

  const handleDelete = async (table: DiningTable) => {
    const ok = await confirm({
      title: "Delete table?",
      description: `This will remove ${table.name}.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    await deleteMutation.mutateAsync(table.id);
    toast.success("Table deleted");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <h2 className="heading text-lg">Table Editor</h2>
        <div className="mt-3 space-y-3">
          <Input
            label="Table name"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <Input
            label="Capacity"
            type="number"
            value={form.capacity}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, capacity: event.target.value }))
            }
          />
          <Button onClick={() => saveMutation.mutate()}>
            {editing ? "Update" : "Create"}
          </Button>
        </div>
      </Card>
      <Card>
        <h2 className="heading text-lg">Tables</h2>
        <div className="mt-3 space-y-2">
          {tables?.map((table) => (
            <div
              key={table.id}
              className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold">{table.name}</p>
                <p className="text-xs text-slate-500">
                  {table.capacity} pax • {table.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  tone="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(table);
                    setForm({
                      name: table.name,
                      capacity: String(table.capacity),
                    });
                  }}
                >
                  Edit
                </Button>
                <Button tone="danger" size="sm" onClick={() => handleDelete(table)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {!tables?.length && (
            <p className="text-sm text-slate-500">No tables yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function UsersSection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "password",
    role: "cashier",
    is_active: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await api.get<{ data: any[] }>("/users");
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        return api.patch(`/users/${editingId}`, {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          role: form.role,
          is_active: form.is_active,
        });
      }
      return api.post("/users", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setForm({
        name: "",
        email: "",
        password: "password",
        role: "cashier",
        is_active: true,
      });
      setEditingId(null);
      toast.success("User saved");
    },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <h2 className="heading text-lg">
          {editingId ? "Edit User" : "Create User"}
        </h2>
        <div className="mt-3 space-y-2">
          <Input
            label="Name"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <Input
            label="Email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
          <Input
            label="Password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
          />
          <label className="text-xs font-semibold uppercase text-slate-500">
            Role
            <select
              className="mt-1 w-full rounded-xl border-slate-200 text-sm"
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value }))
              }
            >
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="kitchen">Kitchen</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, is_active: event.target.checked }))
              }
            />
            Active account
          </label>
          <Button onClick={() => createMutation.mutate()}>
            {editingId ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </Card>
      <Card>
        <h2 className="heading text-lg">Users</h2>
        <div className="mt-3 space-y-2">
          {users?.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="info">{user.roles?.join(", ")}</Badge>
                <Button
                  tone="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(user.id);
                    setForm({
                      name: user.name,
                      email: user.email,
                      password: "",
                      role: user.roles?.[0] ?? "cashier",
                      is_active: user.is_active ?? true,
                    });
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
          {!users?.length && (
            <p className="text-sm text-slate-500">No users yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function InventorySection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [adjustForm, setAdjustForm] = useState({
    product_id: "",
    quantity: "0",
    type: "restock",
  });

  const { data: stocks } = useQuery({
    queryKey: ["inventory-stocks"],
    queryFn: async () => {
      const response = await api.get<{ data: any[] }>("/inventory/stocks");
      return response.data.data;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      return api.post("/inventory/movements", {
        product_id: Number(adjustForm.product_id),
        quantity: Number(adjustForm.quantity),
        type: adjustForm.type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-stocks"] });
      toast.success("Stock updated");
    },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <h2 className="heading text-lg">Adjust Stock</h2>
        <div className="mt-3 space-y-2">
          <label className="text-xs font-semibold uppercase text-slate-500">
            Product
            <select
              className="mt-1 w-full rounded-xl border-slate-200 text-sm"
              value={adjustForm.product_id}
              onChange={(event) =>
                setAdjustForm((prev) => ({
                  ...prev,
                  product_id: event.target.value,
                }))
              }
            >
              <option value="">Select product</option>
              {stocks?.map((stock) => (
                <option key={stock.product_id} value={stock.product_id}>
                  {stock.product?.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase text-slate-500">
            Type
            <select
              className="mt-1 w-full rounded-xl border-slate-200 text-sm"
              value={adjustForm.type}
              onChange={(event) =>
                setAdjustForm((prev) => ({ ...prev, type: event.target.value }))
              }
            >
              <option value="restock">Restock</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </label>
          <Input
            label="Quantity"
            type="number"
            value={adjustForm.quantity}
            onChange={(event) =>
              setAdjustForm((prev) => ({
                ...prev,
                quantity: event.target.value,
              }))
            }
          />
          <Button onClick={() => adjustMutation.mutate()}>Save Adjustment</Button>
        </div>
      </Card>
      <Card>
        <h2 className="heading text-lg">Stock Levels</h2>
        <div className="mt-3 space-y-2">
          {stocks?.map((stock) => (
            <div
              key={stock.id}
              className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
            >
              <span>{stock.product?.name}</span>
              <span
                className={`text-xs font-semibold ${
                  stock.current_stock <= stock.reorder_level
                    ? "text-rose"
                    : "text-basil"
                }`}
              >
                {stock.current_stock} / {stock.reorder_level}
              </span>
            </div>
          ))}
          {!stocks?.length && (
            <p className="text-sm text-slate-500">No stock data yet.</p>
          )}
        </div>
        {stocks?.some((stock) => stock.current_stock <= stock.reorder_level) && (
          <div className="mt-4 rounded-xl bg-rose/10 px-3 py-2 text-xs text-rose">
            Low stock items are highlighted in red.
          </div>
        )}
      </Card>
    </div>
  );
}

function ReportsSection() {
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const { data: daily } = useQuery({
    queryKey: ["reports-daily", date],
    queryFn: async () => {
      const response = await api.get(
        `/reports/daily?date=${encodeURIComponent(date)}`
      );
      return response.data;
    },
  });

  const summary = useMemo(
    () => ({
      gross: daily?.gross_sales ?? 0,
      net: daily?.net_sales ?? 0,
      discount: daily?.discounts ?? 0,
      tax: daily?.tax ?? 0,
      service: daily?.service_charge ?? 0,
    }),
    [daily]
  );

  const { data: byProduct } = useQuery({
    queryKey: ["reports-product", date],
    queryFn: async () => {
      const response = await api.get(
        `/reports/sales-by-product?date=${encodeURIComponent(date)}`
      );
      return response.data as Array<{
        name_snapshot: string;
        total_qty: number;
        total_sales: number;
      }>;
    },
  });

  const { data: byCategory } = useQuery({
    queryKey: ["reports-category", date],
    queryFn: async () => {
      const response = await api.get(
        `/reports/sales-by-category?date=${encodeURIComponent(date)}`
      );
      return response.data as Array<{
        name: string;
        total_qty: number;
        total_sales: number;
      }>;
    },
  });

  const { data: shiftReport } = useQuery({
    queryKey: ["reports-shift"],
    queryFn: async () => {
      try {
        const response = await api.get("/reports/shift");
        return response.data as {
          opening_cash: number;
          closing_cash: number;
          expected_cash: number;
          discrepancy: number;
        };
      } catch {
        return null;
      }
    },
  });

  return (
    <Card>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="heading text-lg">Daily Summary</h2>
          <p className="text-sm text-slate-500">
            Sales performance and totals.
          </p>
        </div>
        <input
          type="date"
          className="rounded-xl border-slate-200 text-sm"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Gross Sales" value={formatPhp(summary.gross)} />
        <Stat label="Net Sales" value={formatPhp(summary.net)} />
        <Stat label="Discounts" value={formatPhp(summary.discount)} />
        <Stat label="Tax" value={formatPhp(summary.tax)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Top Products</p>
          <div className="mt-3 space-y-2 text-sm">
            {byProduct?.map((row) => (
              <div key={row.name_snapshot} className="flex justify-between">
                <span>{row.name_snapshot}</span>
                <span>{formatPhp(Number(row.total_sales))}</span>
              </div>
            ))}
            {!byProduct?.length && (
              <p className="text-xs text-slate-500">No data yet.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Top Categories</p>
          <div className="mt-3 space-y-2 text-sm">
            {byCategory?.map((row) => (
              <div key={row.name} className="flex justify-between">
                <span>{row.name}</span>
                <span>{formatPhp(Number(row.total_sales))}</span>
              </div>
            ))}
            {!byCategory?.length && (
              <p className="text-xs text-slate-500">No data yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 p-4">
        <p className="text-xs uppercase text-slate-500">Shift Report</p>
        {shiftReport ? (
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span>Opening Cash</span>
              <span>{formatPhp(Number(shiftReport.opening_cash))}</span>
            </div>
            <div className="flex justify-between">
              <span>Closing Cash</span>
              <span>{formatPhp(Number(shiftReport.closing_cash))}</span>
            </div>
            <div className="flex justify-between">
              <span>Expected Cash</span>
              <span>{formatPhp(Number(shiftReport.expected_cash))}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Discrepancy</span>
              <span>{formatPhp(Number(shiftReport.discrepancy))}</span>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Open a shift to see cash report.
          </p>
        )}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="heading mt-2 text-lg">{value}</p>
    </div>
  );
}

function SettingsSection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({ tax_rate: 12, service_charge_rate: 0 });

  const { data: settings } = useQuery({
    queryKey: ["settings-pos-admin"],
    queryFn: async () => {
      const response = await api.get<{ data: { value: any } }>("/settings/pos");
      return response.data.data.value;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        tax_rate: Number(settings.tax_rate ?? 0),
        service_charge_rate: Number(settings.service_charge_rate ?? 0),
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async () =>
      api.put("/settings/pos", {
        tax_rate: Number(form.tax_rate),
        service_charge_rate: Number(form.service_charge_rate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-pos-admin"] });
      toast.success("Settings updated");
    },
  });

  return (
    <Card>
      <h2 className="heading text-lg">POS Settings</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input
          label="Tax %"
          type="number"
          value={form.tax_rate}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              tax_rate: Number(event.target.value),
            }))
          }
        />
        <Input
          label="Service Charge %"
          type="number"
          value={form.service_charge_rate}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              service_charge_rate: Number(event.target.value),
            }))
          }
        />
      </div>
      <Button className="mt-4" onClick={() => updateMutation.mutate()}>
        Save Settings
      </Button>
    </Card>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import { formatPhp } from "../utils/format";
import type {
  Category,
  DiningTable,
  Order,
  OrderItem,
  PosSettings,
  Product,
} from "../types";

type CartItem = {
  product_id: number;
  name: string;
  price: number;
  qty: number;
  discount_amount: number;
  notes: string;
};

const dineTypes = [
  { value: "dine_in", label: "Dine-In" },
  { value: "takeout", label: "Takeout" },
  { value: "delivery", label: "Delivery" },
] as const;

export function PosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [dineType, setDineType] = useState<"dine_in" | "takeout" | "delivery">(
    "dine_in"
  );
  const [tableId, setTableId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [serviceRate, setServiceRate] = useState(0);
  const [taxRate, setTaxRate] = useState(12);
  const [rounding, setRounding] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get<{ data: Category[] }>("/categories?all=1");
      return response.data.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products", search, categoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ all: "1" });
      if (search) params.set("q", search);
      if (categoryId) params.set("category_id", String(categoryId));
      const response = await api.get<{ data: Product[] }>(
        `/products?${params.toString()}`
      );
      return response.data.data;
    },
  });

  const { data: tables } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await api.get<{ data: DiningTable[] }>("/tables?all=1");
      return response.data.data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings-pos"],
    queryFn: async () => {
      const response = await api.get<{ data: { value: PosSettings } }>(
        "/settings/pos"
      );
      return response.data.data.value;
    },
    onSuccess: (data) => {
      setTaxRate(data.tax_rate);
      setServiceRate(data.service_charge_rate);
    },
  });

  const { data: heldOrders } = useQuery({
    queryKey: ["held-orders"],
    queryFn: async () => {
      const response = await api.get<{ data: Order[] }>("/orders?per_page=50");
      return response.data.data.filter((order) => order.held_at);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post<{ data: Order }>("/orders", payload);
      return response.data.data;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["held-orders"] });
      setActiveOrderId(order.id);
      setStatusMessage(`Order ${order.receipt_number} created.`);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const response = await api.patch<{ data: Order }>(`/orders/${id}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Order }>(`/orders/${id}/confirm`);
      return response.data.data;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kds"] });
      setStatusMessage(`Order ${order.receipt_number} confirmed.`);
      setPaymentOpen(true);
    },
  });

  const holdOrderMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/orders/${id}/hold`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["held-orders"] });
    },
  });

  const resumeOrderMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/orders/${id}/resume`),
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (payload: {
      orderId: number;
      method: string;
      amount: number;
      reference_no?: string;
    }) => {
      const response = await api.post(`/orders/${payload.orderId}/payments`, {
        method: payload.method,
        amount: payload.amount,
        reference_no: payload.reference_no,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    const itemDiscount = cartItems.reduce(
      (sum, item) => sum + item.discount_amount,
      0
    );
    const net = Math.max(subtotal - itemDiscount - orderDiscount, 0);
    const serviceCharge = net * (serviceRate / 100);
    const taxAmount = net * (taxRate / 100);
    const total = net + serviceCharge + taxAmount + rounding;
    return {
      subtotal,
      itemDiscount,
      net,
      serviceCharge,
      taxAmount,
      total,
    };
  }, [cartItems, orderDiscount, serviceRate, taxRate, rounding]);

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          qty: 1,
          discount_amount: 0,
          notes: "",
        },
      ];
    });
  };

  const updateItem = (productId: number, patch: Partial<CartItem>) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, ...patch } : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const resetCart = () => {
    setCartItems([]);
    setActiveOrderId(null);
    setOrderDiscount(0);
    setCustomerName("");
    setPhone("");
    setAddress("");
    setTableId(null);
    setStatusMessage(null);
  };

  const buildPayload = () => ({
    dine_type: dineType,
    table_id: dineType === "dine_in" ? tableId : null,
    customer_name: dineType === "delivery" ? customerName : null,
    phone: dineType === "delivery" ? phone : null,
    address: dineType === "delivery" ? address : null,
    items: cartItems.map((item) => ({
      product_id: item.product_id,
      qty: item.qty,
      discount_amount: item.discount_amount,
      notes: item.notes,
    })),
    discount_amount: orderDiscount,
    service_charge_rate: serviceRate,
    tax_rate: taxRate,
    rounding,
    hold: false,
  });

  const submitOrder = async () => {
    const payload = buildPayload();
    if (!activeOrderId) {
      const order = await createOrderMutation.mutateAsync(payload);
      return order;
    }
    await updateOrderMutation.mutateAsync({ id: activeOrderId, payload });
    const response = await api.get<{ data: Order }>(`/orders/${activeOrderId}`);
    return response.data.data;
  };

  const handleConfirm = async () => {
    if (cartItems.length === 0) return;
    if (dineType === "dine_in" && !tableId) {
      setStatusMessage("Select a table for dine-in orders.");
      return;
    }
    if (
      dineType === "delivery" &&
      (!customerName || !phone || !address)
    ) {
      setStatusMessage("Delivery details are required.");
      return;
    }
    const order = await submitOrder();
    await confirmOrderMutation.mutateAsync(order.id);
  };

  const handleHold = async () => {
    if (cartItems.length === 0) return;
    if (dineType === "dine_in" && !tableId) {
      setStatusMessage("Select a table for dine-in orders.");
      return;
    }
    if (
      dineType === "delivery" &&
      (!customerName || !phone || !address)
    ) {
      setStatusMessage("Delivery details are required.");
      return;
    }
    if (!activeOrderId) {
      const order = await createOrderMutation.mutateAsync({
        ...buildPayload(),
        hold: true,
      });
      setStatusMessage(`Order ${order.receipt_number} held.`);
    } else {
      await holdOrderMutation.mutateAsync(activeOrderId);
    }
    resetCart();
  };

  const loadHeldOrder = async (orderId: number) => {
    const response = await api.get<{ data: Order }>(`/orders/${orderId}`);
    const order = response.data.data;
    await resumeOrderMutation.mutateAsync(orderId);
    queryClient.invalidateQueries({ queryKey: ["held-orders"] });
    const itemDiscountTotal = order.items.reduce(
      (sum, item) => sum + Number(item.discount_amount),
      0
    );
    const orderLevelDiscount = Math.max(
      Number(order.discount_amount) - itemDiscountTotal,
      0
    );
    setActiveOrderId(order.id);
    setDineType(order.dine_type);
    setTableId(order.table_id ?? null);
    setCustomerName(order.customer_name ?? "");
    setPhone(order.phone ?? "");
    setAddress(order.address ?? "");
    setOrderDiscount(orderLevelDiscount);
    setServiceRate(order.service_charge_rate);
    setTaxRate(order.tax_rate);
    setRounding(order.rounding);
    setCartItems(
      order.items.map((item: OrderItem) => ({
        product_id: item.product_id,
        name: item.name_snapshot,
        price: Number(item.price),
        qty: item.qty,
        discount_amount: Number(item.discount_amount),
        notes: item.notes ?? "",
      }))
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="heading text-2xl">POS Terminal</h1>
              <p className="text-sm text-slate-500">
                Select items and confirm orders fast.
              </p>
            </div>
            {statusMessage && (
              <div className="rounded-xl bg-basil/10 px-3 py-2 text-sm text-basil">
                {statusMessage}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              className="w-full rounded-xl border-slate-200"
              placeholder="Search products or SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="w-full rounded-xl border-slate-200 lg:w-48"
              value={categoryId ?? ""}
              onChange={(event) =>
                setCategoryId(event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">All categories</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {products?.map((product) => (
            <button
              key={product.id}
              className="rounded-2xl bg-white p-4 text-left shadow-card transition hover:-translate-y-1 hover:shadow-lg"
              onClick={() => addToCart(product)}
            >
              <p className="font-semibold">{product.name}</p>
              <p className="text-xs text-slate-500">{product.sku}</p>
              <p className="mt-2 text-sm font-semibold text-basil">
                {formatPhp(Number(product.price))}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="heading text-lg">Order Details</h2>
          <div className="mt-3 grid gap-3">
            <div className="flex flex-wrap gap-2">
              {dineTypes.map((type) => (
                <button
                  key={type.value}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    dineType === type.value
                      ? "bg-basil text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                  onClick={() => setDineType(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
            {dineType === "dine_in" && (
              <select
                className="rounded-xl border-slate-200"
                value={tableId ?? ""}
                onChange={(event) =>
                  setTableId(event.target.value ? Number(event.target.value) : null)
                }
              >
                <option value="">Select table</option>
                {tables?.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name} ({table.capacity} pax, {table.status})
                  </option>
                ))}
              </select>
            )}
            {dineType === "delivery" && (
              <div className="grid gap-2">
                <input
                  className="rounded-xl border-slate-200"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                />
                <input
                  className="rounded-xl border-slate-200"
                  placeholder="Phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <input
                  className="rounded-xl border-slate-200"
                  placeholder="Address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="heading text-lg">Cart</h2>
            <button
              className="text-xs font-semibold text-rose"
              onClick={resetCart}
            >
              Clear
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {cartItems.length === 0 && (
              <p className="text-sm text-slate-500">No items yet.</p>
            )}
            {cartItems.map((item) => (
              <div key={item.product_id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatPhp(item.price)}
                    </p>
                  </div>
                  <button
                    className="text-xs font-semibold text-rose"
                    onClick={() => removeItem(item.product_id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min={1}
                    className="rounded-lg border-slate-200 text-sm"
                    value={item.qty}
                    onChange={(event) =>
                      updateItem(item.product_id, {
                        qty: Number(event.target.value),
                      })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    className="rounded-lg border-slate-200 text-sm"
                    value={item.discount_amount}
                    onChange={(event) =>
                      updateItem(item.product_id, {
                        discount_amount: Number(event.target.value),
                      })
                    }
                    placeholder="Discount"
                  />
                  <input
                    className="rounded-lg border-slate-200 text-sm"
                    value={item.notes}
                    onChange={(event) =>
                      updateItem(item.product_id, {
                        notes: event.target.value,
                      })
                    }
                    placeholder="Notes"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="heading text-lg">Totals</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPhp(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Item discounts</span>
              <span>-{formatPhp(totals.itemDiscount)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Order discount</span>
              <input
                type="number"
                min={0}
                className="w-24 rounded-lg border-slate-200 text-right text-sm"
                value={orderDiscount}
                onChange={(event) => setOrderDiscount(Number(event.target.value))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Service charge %</span>
              <input
                type="number"
                min={0}
                className="w-24 rounded-lg border-slate-200 text-right text-sm"
                value={serviceRate}
                onChange={(event) => setServiceRate(Number(event.target.value))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Tax %</span>
              <input
                type="number"
                min={0}
                className="w-24 rounded-lg border-slate-200 text-right text-sm"
                value={taxRate}
                onChange={(event) => setTaxRate(Number(event.target.value))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Rounding</span>
              <input
                type="number"
                className="w-24 rounded-lg border-slate-200 text-right text-sm"
                value={rounding}
                onChange={(event) => setRounding(Number(event.target.value))}
              />
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatPhp(totals.total)}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              onClick={handleHold}
            >
              Hold Order
            </button>
            <button
              className="rounded-xl bg-basil px-4 py-2 text-sm font-semibold text-white"
              onClick={handleConfirm}
            >
              Confirm Order
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="heading text-lg">Held Orders</h2>
          <div className="mt-3 space-y-2">
            {heldOrders?.length ? (
              heldOrders.map((order) => (
                <button
                  key={order.id}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm"
                  onClick={() => loadHeldOrder(order.id)}
                >
                  <span>{order.receipt_number}</span>
                  <span className="text-slate-500">
                    {formatPhp(order.total)}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">No held orders.</p>
            )}
          </div>
        </div>
      </section>

      {paymentOpen && activeOrderId && (
        <PaymentModal
          total={totals.total}
          onClose={() => setPaymentOpen(false)}
          onSubmit={async (data) => {
            await addPaymentMutation.mutateAsync({
              orderId: activeOrderId,
              method: data.method,
              amount: data.amount,
              reference_no: data.reference_no,
            });
            setPaymentOpen(false);
            resetCart();
          }}
        />
      )}
    </div>
  );
}

function PaymentModal({
  total,
  onClose,
  onSubmit,
}: {
  total: number;
  onClose: () => void;
  onSubmit: (data: {
    method: "cash" | "gcash" | "card";
    amount: number;
    reference_no?: string;
  }) => void;
}) {
  const [method, setMethod] = useState<"cash" | "gcash" | "card">("cash");
  const [amount, setAmount] = useState(total);
  const [reference, setReference] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card">
        <h3 className="heading text-lg">Add Payment</h3>
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            {(["cash", "gcash", "card"] as const).map((type) => (
              <button
                key={type}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase ${
                  method === type ? "bg-basil text-white" : "bg-slate-100"
                }`}
                onClick={() => setMethod(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <input
            type="number"
            className="w-full rounded-xl border-slate-200"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
          {(method === "gcash" || method === "card") && (
            <input
              className="w-full rounded-xl border-slate-200"
              placeholder="Reference number"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-basil px-4 py-2 text-sm font-semibold text-white"
            onClick={() =>
              onSubmit({
                method,
                amount,
                reference_no: reference || undefined,
              })
            }
          >
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
}
